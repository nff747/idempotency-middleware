import { ICache, IdempotencyRecord } from './types.js';

export interface RedisClientLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number; NX?: boolean }): Promise<string | null | boolean>;
  del(key: string): Promise<number | void>;
}

export class RedisCache implements ICache {
  constructor(private redis: RedisClientLike, private keyPrefix: string = 'idemp:') {}

  private formatKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get(key: string): Promise<IdempotencyRecord | 'IN_PROGRESS' | null> {
    const raw = await this.redis.get(this.formatKey(key));
    if (!raw) return null;
    if (raw === '__IN_PROGRESS__') return 'IN_PROGRESS';
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async set(key: string, value: IdempotencyRecord | 'IN_PROGRESS', ttlSeconds: number): Promise<boolean> {
    const fullKey = this.formatKey(key);

    if (value === 'IN_PROGRESS') {
      // Atomic SET NX EX ensures single-flight concurrent lock
      const acquired = await this.redis.set(fullKey, '__IN_PROGRESS__', {
        NX: true,
        EX: ttlSeconds
      });
      return acquired !== null && acquired !== false;
    }

    const payload = JSON.stringify(value);
    await this.redis.set(fullKey, payload, { EX: ttlSeconds });
    return true;
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(this.formatKey(key));
  }
}
