import { IdempotencyConfig } from './IdempotencyConfig';
export const honoIdempotencyMiddleware = (config?: IdempotencyConfig) => {
  return async (c: any, next: any) => {
    await next();
  };
};
