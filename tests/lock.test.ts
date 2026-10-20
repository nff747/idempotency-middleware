import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InFlightLock } from '../src/lock';

describe('InFlightLock concurrent request deduplication', () => {
  let lock: InFlightLock;

  beforeEach(() => {
    vi.useFakeTimers();
    lock = new InFlightLock();
  });

  afterEach(() => {
    lock.clear();
    vi.useRealTimers();
  });

  it('acquires lock on first request and rejects concurrent requests with same key', () => {
    const key = 'idem-req-123';
    expect(lock.acquire(key)).toBe(true);
    expect(lock.isLocked(key)).toBe(true);
    expect(lock.activeCount()).toBe(1);

    // Concurrent request attempts to acquire same key
    expect(lock.acquire(key)).toBe(false);
  });

  it('releases lock allowing subsequent requests to proceed', () => {
    const key = 'idem-req-456';
    expect(lock.acquire(key)).toBe(true);
    expect(lock.release(key)).toBe(true);
    expect(lock.isLocked(key)).toBe(false);

    // Can re-acquire after release
    expect(lock.acquire(key)).toBe(true);
  });

  it('automatically expires lock after configured TTL to prevent deadlock on crash', () => {
    const key = 'idem-req-crash';
    lock.acquire(key, 5000); // 5 second TTL
    expect(lock.isLocked(key)).toBe(true);

    vi.advanceTimersByTime(5001);
    expect(lock.isLocked(key)).toBe(false);
  });
});
