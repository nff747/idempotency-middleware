import { ICache, IdempotencyOptions, IdempotencyRecord } from './types.js';
import { MemoryCache } from './cache.js';
import { hashPayload } from './utils.js';
import { IdempotencyKeyConflictError } from './IdempotencyError.js';

export class IdempotencyManager {
  public cache: ICache;
  public headerName: string;
  public ttlSeconds: number;

  constructor(options: IdempotencyOptions & { cache?: ICache } = {}) {
    this.cache = options.cache || new MemoryCache();
    this.headerName = (options.headerName || 'Idempotency-Key').toLowerCase();
    this.ttlSeconds = options.ttlSeconds || 86400;
  }

  async check(key: string, requestPayload?: any): Promise<{ status: 'HIT'; record: IdempotencyRecord } | { status: 'MISS' }> {
    const startTime = Date.now();
    while (true) {
      const result = await this.cache.get(key);
      if (result === 'IN_PROGRESS') {
        if (Date.now() - startTime > 30000) {
          throw new Error('Idempotency lock timeout');
        }
        await new Promise(res => setTimeout(res, 50));
        continue;
      }
      if (result) {
        if (requestPayload !== undefined && result.payloadHash) {
          const currentHash = hashPayload(requestPayload);
          if (currentHash && currentHash !== result.payloadHash) {
            throw new IdempotencyKeyConflictError('Idempotency key reused with different request payload');
          }
        }
        return { status: 'HIT', record: result };
      }
      
      const setSuccess = await this.cache.set(key, 'IN_PROGRESS', this.ttlSeconds);
      if (setSuccess === false) {
        continue;
      }
      
      return { status: 'MISS' };
    }
  }

  async save(key: string, record: IdempotencyRecord, requestPayload?: any): Promise<void> {
    if (requestPayload !== undefined && !record.payloadHash) {
      record.payloadHash = hashPayload(requestPayload);
    }
    await this.cache.set(key, record, this.ttlSeconds);
  }
}
