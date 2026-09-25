/**
 * Configuration options for idempotency middleware.
 */
export interface IdempotencyOptions {
  headerName?: string;
  ttlSeconds?: number;
}

export interface IdempotencyRecord {
  status: number;
  body: any;
  headers: Record<string, string>;
}

export interface ICache {
  get(key: string): Promise<IdempotencyRecord | 'IN_PROGRESS' | null>;
  set(key: string, value: IdempotencyRecord | 'IN_PROGRESS', ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}
