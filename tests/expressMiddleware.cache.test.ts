import { describe, it, expect, vi } from 'vitest';
import { expressIdempotencyMiddleware } from '../src/expressMiddleware';
import { MemoryStorageAdapter } from '../src/MemoryStorageAdapter';
describe('express cache', () => {
  it('should return cached response if key exists', async () => {
    const adapter = new MemoryStorageAdapter();
    await adapter.set('test-key', { status: 200, body: 'ok' }, 1000);
    const middleware = expressIdempotencyMiddleware({ adapter });
    const req = { headers: { 'idempotency-key': 'test-key' } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn(), send: vi.fn() };
    const next = vi.fn();
    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('ok');
    expect(next).not.toHaveBeenCalled();
  });
});
