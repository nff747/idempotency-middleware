import { describe, it, expect, vi } from 'vitest';
import { expressIdempotency } from '../src/express.js';
import { Request, Response } from 'express';

describe('Express Middleware', () => {
  it('should skip if no idempotency key', async () => {
    const middleware = expressIdempotency();
    const req = { headers: {} } as Request;
    const res = {} as Response;
    const next = vi.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should wait for concurrent requests and return cached response', async () => {
    const middleware = expressIdempotency();
    const req = { headers: { 'idempotency-key': 'abc' } } as unknown as Request;
    
    const res1 = {
      send: vi.fn(),
      on: vi.fn(),
      getHeaders: vi.fn().mockReturnValue({}),
      statusCode: 200
    } as unknown as Response;

    const res2 = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      setHeader: vi.fn()
    } as unknown as Response;

    const next1 = vi.fn();
    const next2 = vi.fn();

    // First request
    const p1 = middleware(req, res1, next1);
    
    // Simulate some delay before first request finishes
    await new Promise(r => setTimeout(r, 50));

    // Second request should wait
    const p2 = middleware(req, res2, next2);

    await p1;
    // Simulate finishing first request
    // @ts-ignore
    const finishCallback = res1.on.mock.calls[0][1];
    res1.send('hello');
    finishCallback();

    await p2;
    expect(res2.status).toHaveBeenCalledWith(200);
    expect(res2.send).toHaveBeenCalledWith('hello');
    expect(next2).not.toHaveBeenCalled();
  });
});
