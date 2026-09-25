import { describe, it, expect, vi } from 'vitest';
import { expressIdempotencyMiddleware } from '../src/expressMiddleware';
import { MemoryStorageAdapter } from '../src/MemoryStorageAdapter';
describe('express intercept', () => {
  it('should intercept response and save', async () => {
    const adapter = new MemoryStorageAdapter();
    const middleware = expressIdempotencyMiddleware({ adapter });
    const req = { headers: { 'idempotency-key': 'test1' } };
    const res = { send: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
