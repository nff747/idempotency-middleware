import { StorageAdapter } from './StorageAdapter';

export class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, { data: any; expiry: number }>();

  constructor(private readonly maxEntries: number = 10000) {}

  async get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    // Refresh LRU order
    this.store.delete(key);
    this.store.set(key, item);
    return item.data;
  }

  async set(key: string, data: any, expiresIn: number) {
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      // Evict least recently used (first key in iteration order)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }
    this.store.set(key, { data, expiry: Date.now() + expiresIn });
  }

  async delete(key: string) {
    this.store.delete(key);
  }

  async size(): Promise<number> {
    return this.store.size;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async pruneExpired(): Promise<number> {
    const now = Date.now();
    let count = 0;
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiry) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }
}
