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
