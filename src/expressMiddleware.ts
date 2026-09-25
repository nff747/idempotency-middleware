import { IdempotencyConfig } from './IdempotencyConfig';
export const expressIdempotencyMiddleware = (config?: IdempotencyConfig) => {
  return async (req: any, res: any, next: any) => {
    if (!config) return next();
    const key = req.headers['idempotency-key'];
    if (!key) return next();
    const cached = await config.adapter.get(key);
    if (cached) {
      return res.status(cached.status).json(cached.body);
    }
    next();
  };
};
