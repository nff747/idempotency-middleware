import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorageAdapter } from '../src/MemoryStorageAdapter';

describe('MemoryStorageAdapter', () => {
  let adapter: MemoryStorageAdapter;
  beforeEach(() => {
    adapter = new MemoryStorageAdapter();
  });
  it('should store and retrieve data', async () => {
    await adapter.set('key1', 'data1', 1000);
    const data = await adapter.get('key1');
    expect(data).toBe('data1');
  });
});
