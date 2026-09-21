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
  it('should wait for IN_PROGRESS and then HIT', async () => {
    const manager = new IdempotencyManager();
    
    // First request gets MISS and sets IN_PROGRESS
    const result1 = await manager.check('test-key-2');
    expect(result1.status).toBe('MISS');

    // Simulate concurrent request that should wait
    let result2Promise = manager.check('test-key-2');
    
    // Let it wait a bit
    await new Promise(res => setTimeout(res, 100));
    
    // Now finish the first request
    await manager.save('test-key-2', { status: 200, body: 'ok', headers: {} });

    // The second request should now resolve with HIT
    const result2 = await result2Promise;
    expect(result2.status).toBe('HIT');
    if (result2.status === 'HIT') {
      expect(result2.record.body).toBe('ok');
    }
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
