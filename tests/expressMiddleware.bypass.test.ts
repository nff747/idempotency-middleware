import { describe, it, expect, vi } from 'vitest';
import { expressIdempotencyMiddleware } from '../src/expressMiddleware';
describe('express bypass', () => {
  it('should call next if no idempotency key header', () => {
    const middleware = expressIdempotencyMiddleware();
    const req = { headers: {} };
    const res = {};
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
