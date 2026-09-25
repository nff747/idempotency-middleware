import { IdempotencyConfig } from './IdempotencyConfig';
export const honoIdempotencyMiddleware = (config?: IdempotencyConfig) => {
  return async (c: any, next: any) => {
    if (!config) return await next();
    const key = c.req.header('idempotency-key');
    if (!key) return await next();
    await next();
  };
};
