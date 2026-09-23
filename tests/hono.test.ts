import { describe, it, expect, vi } from 'vitest';
import { honoIdempotency } from '../src/hono.js';
import { Context } from 'hono';

describe('Hono Middleware', () => {
  it('should skip if no idempotency key', async () => {
    const middleware = honoIdempotency();
    const c = { req: { header: vi.fn().mockReturnValue(undefined) } } as unknown as Context;
    const next = vi.fn();

    await middleware(c, next);
    expect(next).toHaveBeenCalled();
  });

  it('should block concurrent requests', async () => {
    const middleware = honoIdempotency();
    const c1 = { 
      req: { header: vi.fn().mockReturnValue('key-123') },
      res: { status: 200, clone: vi.fn().mockReturnValue({
        headers: new Map(),
        json: vi.fn().mockResolvedValue({})
      })},
      json: vi.fn()
    } as unknown as Context;

    // First request - IN_PROGRESS
    const p1 = middleware(c1, async () => {
      // Simulate long processing
      await new Promise(r => setTimeout(r, 100));
    });

    // Wait a tick for cache.set to complete
    await new Promise(r => setTimeout(r, 10));

    // Second request
    const c2 = { 
      req: { header: vi.fn().mockReturnValue('key-123') },
      json: vi.fn()
    } as unknown as Context;
    
    await middleware(c2, vi.fn());
    expect(c2.json).toHaveBeenCalledWith({ error: 'Concurrent request in progress' }, 409);
    
    await p1;
  });
});
