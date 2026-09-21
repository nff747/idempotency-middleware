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

  it('should wait for concurrent requests and return cached response', async () => {
    const middleware = honoIdempotency();
    
    let clonedMap = new Map();
    clonedMap.set('content-type', 'application/json');
    const c1 = { 
      req: { header: vi.fn().mockReturnValue('key-123') },
      res: { status: 200, clone: vi.fn().mockReturnValue({
        headers: clonedMap,
        json: vi.fn().mockResolvedValue({ hello: "world" }),
        status: 200
      })},
      header: vi.fn(),
      body: vi.fn()
    } as unknown as Context;

    const c2 = { 
      req: { header: vi.fn().mockReturnValue('key-123') },
      header: vi.fn(),
      body: vi.fn()
    } as unknown as Context;

    // First request - IN_PROGRESS
    const p1 = middleware(c1, async () => {
      // Simulate long processing
      await new Promise(r => setTimeout(r, 100));
    });

    // Wait a tick to ensure first request started
    await new Promise(r => setTimeout(r, 10));

    // Second request
    const p2 = middleware(c2, vi.fn());
    
    await p1;
    await p2;

    expect(c2.body).toHaveBeenCalledWith({ hello: "world" }, 200);
  });
});
