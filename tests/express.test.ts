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
