import { describe, it, expect, vi } from 'vitest';
import { honoIdempotencyMiddleware } from '../src/honoMiddleware';
import { MemoryStorageAdapter } from '../src/MemoryStorageAdapter';
describe('hono intercept', () => {
  it('should save response', async () => {
    const adapter = new MemoryStorageAdapter();
    const middleware = honoIdempotencyMiddleware({ adapter });
    const c = { req: { header: () => 'test2' }, res: { status: 201, clone: () => ({ text: async () => 'body' }) } };
    const next = vi.fn();
    await middleware(c, next);
    const saved = await adapter.get('test2');
    expect(saved.body).toBe('body');
    expect(saved.status).toBe(201);
  });
});
