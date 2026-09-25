import { ICache, IdempotencyOptions, IdempotencyRecord } from './types.js';
import { MemoryCache } from './cache.js';

export class IdempotencyManager {
  public cache: ICache;
  public headerName: string;
  public ttlSeconds: number;

  constructor(options: IdempotencyOptions & { cache?: ICache } = {}) {
    this.cache = options.cache || new MemoryCache();
    this.headerName = (options.headerName || 'Idempotency-Key').toLowerCase();
    this.ttlSeconds = options.ttlSeconds || 86400;
  }

  async check(key: string): Promise<{ status: 'HIT'; record: IdempotencyRecord } | { status: 'IN_PROGRESS' } | { status: 'MISS' }> {
    const result = await this.cache.get(key);
    if (result === 'IN_PROGRESS') return { status: 'IN_PROGRESS' };
    if (result) return { status: 'HIT', record: result };
    
    await this.cache.set(key, 'IN_PROGRESS', this.ttlSeconds);
    return { status: 'MISS' };
  }

  async save(key: string, record: IdempotencyRecord): Promise<void> {
    await this.cache.set(key, record, this.ttlSeconds);
  }
}
