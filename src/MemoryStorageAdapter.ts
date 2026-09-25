import { StorageAdapter } from './StorageAdapter';
export class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, {data: any, expiry: number}>();
  async get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.data;
  }
  async set(key: string, data: any, expiresIn: number) {
    this.store.set(key, { data, expiry: Date.now() + expiresIn });
  }
  async delete(key: string) {
    this.store.delete(key);
  }
}
