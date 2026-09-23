import { describe, it, expect, vi } from 'vitest';
import { honoIdempotencyMiddleware } from '../src/honoMiddleware';
import { MemoryStorageAdapter } from '../src/MemoryStorageAdapter';
describe('hono cache', () => {
  it('should return cached response', async () => {
    const adapter = new MemoryStorageAdapter();
    await adapter.set('test1', { status: 200, body: 'cached' }, 1000);
    const middleware = honoIdempotencyMiddleware({ adapter });
    const c = { 
      req: { header: () => 'test1' }, 
      newResponse: vi.fn().mockReturnValue('response_obj') 
    };
    const next = vi.fn();
    const result = await middleware(c, next);
    expect(result).toBe('response_obj');
    expect(c.newResponse).toHaveBeenCalledWith('cached', 200);
  });
});
