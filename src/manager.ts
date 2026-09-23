import { ICache, IdempotencyOptions } from './types.js';
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
}
