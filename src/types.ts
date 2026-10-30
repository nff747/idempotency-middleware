/**
 * Configuration options for idempotency middleware.
 */
export interface IdempotencyOptions {
  headerName?: string;
  ttlSeconds?: number;
  /** Return an authenticated, server-verified principal or tenant scope. */
  resolveScope?: (context: any) => string | Promise<string>;
}

export interface IdempotencyRecord {
  status: number;
  body: any;
  headers: Record<string, string>;
  payloadHash?: string;
}

export interface ICache {
  get(key: string): Promise<IdempotencyRecord | 'IN_PROGRESS' | null>;
  set(key: string, value: IdempotencyRecord | 'IN_PROGRESS', ttlSeconds: number): Promise<boolean | void>;
  delete(key: string): Promise<void>;
}
