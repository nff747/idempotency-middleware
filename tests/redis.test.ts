import { describe, it, expect } from 'vitest';
import { RedisCache, RedisClientLike } from '../src/redis.js';

describe('RedisCache Adapter', () => {
  it('acquires distributed in-progress lock with atomic SET NX EX', async () => {
    const memoryMock = new Map<string, string>();
    const mockRedis: RedisClientLike = {
      async get(key: string) {
        return memoryMock.get(key) || null;
      },
      async set(key: string, value: string, options?: { EX?: number; NX?: boolean }) {
        if (options?.NX && memoryMock.has(key)) {
          return null; // lock not acquired
        }
        memoryMock.set(key, value);
        return 'OK';
      },
      async del(key: string) {
        memoryMock.delete(key);
      }
    };

    const redisCache = new RedisCache(mockRedis);

    // First attempt acquires lock
    const locked1 = await redisCache.set('req-1', 'IN_PROGRESS', 60);
    expect(locked1).toBe(true);
    expect(await redisCache.get('req-1')).toBe('IN_PROGRESS');

    // Concurrent second attempt fails to acquire lock
    const locked2 = await redisCache.set('req-1', 'IN_PROGRESS', 60);
    expect(locked2).toBe(false);

    // Save final response
    await redisCache.set('req-1', { status: 200, body: { success: true }, headers: {} }, 60);
    const result = await redisCache.get('req-1');
    expect(result).not.toBe('IN_PROGRESS');
    expect((result as any).status).toBe(200);

    // Clean up
    await redisCache.delete('req-1');
    expect(await redisCache.get('req-1')).toBeNull();
  });
});
