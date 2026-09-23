import { describe, it, expect } from 'vitest';
import { IdempotencyManager } from '../src/manager.js';

describe('IdempotencyManager', () => {
  it('should default to memory cache', async () => {
    const manager = new IdempotencyManager();
    expect(manager.headerName).toBe('idempotency-key');
    expect(manager.ttlSeconds).toBe(86400);
  });

  it('should handle MISS', async () => {
    const manager = new IdempotencyManager();
    const result = await manager.check('test-key');
    expect(result.status).toBe('MISS');
  });
});

describe('IdempotencyManager operations', () => {
  it('should handle IN_PROGRESS', async () => {
    const manager = new IdempotencyManager();
    await manager.check('test-key-2');
    const result2 = await manager.check('test-key-2');
    expect(result2.status).toBe('IN_PROGRESS');
  });

  it('should handle HIT', async () => {
    const manager = new IdempotencyManager();
    await manager.save('test-key-3', { status: 200, body: 'ok', headers: {} });
    const result = await manager.check('test-key-3');
    expect(result.status).toBe('HIT');
    if (result.status === 'HIT') {
      expect(result.record.body).toBe('ok');
    }
  });
});
