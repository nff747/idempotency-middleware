import { Context, Next } from 'hono';
import { IdempotencyManager } from './manager.js';
import { IdempotencyOptions, ICache } from './types.js';

export function honoIdempotency(options?: IdempotencyOptions & { cache?: ICache }) {
  const manager = new IdempotencyManager(options);

  return async (c: Context, next: Next) => {
    await next();
  };
}
