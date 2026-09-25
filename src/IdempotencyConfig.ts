import { StorageAdapter } from './StorageAdapter';
export interface IdempotencyConfig {
  adapter: StorageAdapter;
  ttl?: number;
}
