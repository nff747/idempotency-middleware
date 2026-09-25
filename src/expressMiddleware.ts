import { IdempotencyConfig } from './IdempotencyConfig';
export const expressIdempotencyMiddleware = (config?: IdempotencyConfig) => {
  return (req: any, res: any, next: any) => {
    if (!config) return next();
    const key = req.headers['idempotency-key'];
    if (!key) return next();
    next();
  };
};
