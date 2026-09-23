import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryStorageAdapter } from '../src/MemoryStorageAdapter';

describe('MemoryStorageAdapter expiration', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });
  it('should expire data', async () => {
    const adapter = new MemoryStorageAdapter();
    await adapter.set('key1', 'data1', 100);
    vi.advanceTimersByTime(150);
    const data = await adapter.get('key1');
    expect(data).toBeNull();
  });
});
