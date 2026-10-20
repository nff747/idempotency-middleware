import { describe, it, expect } from 'vitest';
import { MemoryStorageAdapter } from '../src/MemoryStorageAdapter';

describe('MemoryStorageAdapter LRU Eviction & Capacity Bounds', () => {
  it('evicts least recently used items when capacity limit is reached', async () => {
    const adapter = new MemoryStorageAdapter(3); // capacity = 3

    await adapter.set('key1', 'val1', 60000);
    await adapter.set('key2', 'val2', 60000);
    await adapter.set('key3', 'val3', 60000);

    expect(await adapter.size()).toBe(3);

    // Access key1 to make it recently used
    await adapter.get('key1');

    // Add key4 -> should evict key2 (oldest unaccessed key)
    await adapter.set('key4', 'val4', 60000);

    expect(await adapter.size()).toBe(3);
    expect(await adapter.get('key2')).toBeNull();
    expect(await adapter.get('key1')).toBe('val1');
    expect(await adapter.get('key3')).toBe('val3');
    expect(await adapter.get('key4')).toBe('val4');
  });

  it('prunes expired items from storage', async () => {
    const adapter = new MemoryStorageAdapter(10);
    await adapter.set('live', 'data', 10000);
    await adapter.set('expired1', 'data', -100);
    await adapter.set('expired2', 'data', -200);

    const pruned = await adapter.pruneExpired();
    expect(pruned).toBe(2);
    expect(await adapter.size()).toBe(1);
    expect(await adapter.get('live')).toBe('data');
  });

  it('clears all storage entries', async () => {
    const adapter = new MemoryStorageAdapter(5);
    await adapter.set('k1', 'v1', 10000);
    await adapter.set('k2', 'v2', 10000);
    expect(await adapter.size()).toBe(2);

    await adapter.clear();
    expect(await adapter.size()).toBe(0);
    expect(await adapter.get('k1')).toBeNull();
  });
});
