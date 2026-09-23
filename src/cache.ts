import { ICache, IdempotencyRecord } from './types.js';

interface CacheEntry {
  value: IdempotencyRecord | 'IN_PROGRESS';
  expiresAt: number;
}

export class MemoryCache implements ICache {
  private store = new Map<string, CacheEntry>();

  async get(key: string): Promise<IdempotencyRecord | 'IN_PROGRESS' | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: IdempotencyRecord | 'IN_PROGRESS', ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}
