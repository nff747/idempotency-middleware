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
});
