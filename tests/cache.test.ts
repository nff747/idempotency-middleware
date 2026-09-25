import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryCache } from '../src/cache.js';

describe('MemoryCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should store and retrieve values', async () => {
    const cache = new MemoryCache();
    await cache.set('key1', 'IN_PROGRESS', 10);
    expect(await cache.get('key1')).toBe('IN_PROGRESS');
  });
});
