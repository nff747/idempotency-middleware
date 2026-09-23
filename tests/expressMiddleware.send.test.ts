import { describe, it, expect, vi } from 'vitest';
import { expressIdempotencyMiddleware } from '../src/expressMiddleware';
import { MemoryStorageAdapter } from '../src/MemoryStorageAdapter';
describe('express send intercept', () => {
  it('should intercept res.send', async () => {
    const adapter = new MemoryStorageAdapter();
    const middleware = expressIdempotencyMiddleware({ adapter });
    const req = { headers: { 'idempotency-key': 'send-key' } };
    const res: any = { send: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    await middleware(req, res, next);
    res.send('hello');
    const saved = await adapter.get('send-key');
    expect(saved.body).toEqual('hello');
  });
});
