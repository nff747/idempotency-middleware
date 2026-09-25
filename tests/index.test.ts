import { describe, it, expect } from 'vitest';
import * as index from '../src/index';
describe('index', () => {
  it('should export modules', () => {
    expect(index.expressIdempotencyMiddleware).toBeDefined();
    expect(index.honoIdempotencyMiddleware).toBeDefined();
    expect(index.MemoryStorageAdapter).toBeDefined();
  });
});
