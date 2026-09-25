import { describe, it, expect } from 'vitest';
import { MemoryStorageAdapter } from '../src/MemoryStorageAdapter';
describe('MemoryStorageAdapter delete', () => {
  it('should delete data', async () => {
    const adapter = new MemoryStorageAdapter();
    await adapter.set('key1', 'data1', 1000);
    await adapter.delete('key1');
    expect(await adapter.get('key1')).toBeNull();
  });
});
