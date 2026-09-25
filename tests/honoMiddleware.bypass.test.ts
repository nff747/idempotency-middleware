import { describe, it, expect, vi } from 'vitest';
import { honoIdempotencyMiddleware } from '../src/honoMiddleware';
describe('hono bypass', () => {
  it('should call next if no key', async () => {
    const middleware = honoIdempotencyMiddleware();
    const next = vi.fn();
    const c = { req: { header: () => undefined } };
    await middleware(c, next);
    expect(next).toHaveBeenCalled();
  });
});
