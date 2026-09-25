import { IdempotencyConfig } from './IdempotencyConfig';
export const honoIdempotencyMiddleware = (config?: IdempotencyConfig) => {
  return async (c: any, next: any) => {
    if (!config) return await next();
    const key = c.req.header('idempotency-key');
    if (!key) return await next();
    const cached = await config.adapter.get(key);
    if (cached) {
      return c.newResponse(
        typeof cached.body === 'object' ? JSON.stringify(cached.body) : cached.body, 
        cached.status || 200
      );
    }
    await next();
  };
};
