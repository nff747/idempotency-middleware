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

describe('MemoryCache expiry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should expire values', async () => {
    const cache = new MemoryCache();
    await cache.set('key2', 'IN_PROGRESS', 1);
    vi.advanceTimersByTime(2000);
    expect(await cache.get('key2')).toBeNull();
  });
});
