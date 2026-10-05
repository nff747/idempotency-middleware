import { IdempotencyConfig } from './IdempotencyConfig';
export const expressIdempotencyMiddleware = (config?: IdempotencyConfig) => {
  return async (req: any, res: any, next: any) => {
    if (!config) return next();
    const key = req.headers['idempotency-key'];
    if (!key || typeof key !== 'string' || key.length > 512) return next();
    const cached = await config.adapter.get(key);
    if (cached) {
      if (typeof cached.body === 'string') {
          return res.status(cached.status || 200).send(cached.body);
      }
      return res.status(cached.status || 200).json(cached.body);
    }
    
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      config.adapter.set(key, { status: res.statusCode || 200, body }, config.ttl || 3600000).catch(() => {});
      return originalJson(body);
    };
    
    const originalSend = res.send.bind(res);
    res.send = (body: any) => {
      config.adapter.set(key, { status: res.statusCode || 200, body }, config.ttl || 3600000).catch(() => {});
      return originalSend(body);
    };
    
    next();
  };
};
