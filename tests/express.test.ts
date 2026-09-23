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
});

  it('should block concurrent requests', async () => {
    const middleware = expressIdempotency();
    const req = { headers: { 'idempotency-key': 'abc' } } as unknown as Request;
    
    let statusCode = 0;
    let jsonBody = null;
    const res = {
      status: vi.fn().mockImplementation((s) => {
        statusCode = s;
        return res;
      }),
      json: vi.fn().mockImplementation((b) => {
        jsonBody = b;
      }),
      send: vi.fn(),
      on: vi.fn(),
      getHeaders: vi.fn().mockReturnValue({})
    } as unknown as Response;
    const next = vi.fn();

    // First request
    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();

    // Second request
    await middleware(req, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(jsonBody).toEqual({ error: 'Concurrent request in progress' });
  });
