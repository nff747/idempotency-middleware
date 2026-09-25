import { describe, it, expect, vi } from 'vitest';
import { expressIdempotencyMiddleware } from '../src/expressMiddleware';
import { MemoryStorageAdapter } from '../src/MemoryStorageAdapter';
describe('express intercept', () => {
  it('should intercept response and save', async () => {
    const adapter = new MemoryStorageAdapter();
    const middleware = expressIdempotencyMiddleware({ adapter, ttl: 1000 });
    const req = { headers: { 'idempotency-key': 'test1' } };
    const res: any = { send: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    await middleware(req, res, next);
    // intercept json
    res.json({ success: true });
    
    const saved = await adapter.get('test1');
    expect(saved).toBeDefined();
    expect(saved.body).toEqual({ success: true });
  });
});
