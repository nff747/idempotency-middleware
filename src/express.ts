import { Request, Response, NextFunction } from 'express';
import { IdempotencyManager } from './manager.js';
import { IdempotencyOptions, ICache } from './types.js';

export function expressIdempotency(options?: IdempotencyOptions & { cache?: ICache }) {
  const manager = new IdempotencyManager(options);

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers[manager.headerName] as string;
    if (!key) return next();

    try {
      const checkResult = await manager.check(key);

      if (checkResult.status === 'HIT') {
        const record = checkResult.record;
        for (const [k, v] of Object.entries(record.headers)) {
          res.setHeader(k, v);
        }
        return res.status(record.status).send(record.body);
      }

      // MISS
      const originalSend = res.send;
      let bodyToSave: any;

      res.send = function (body?: any) {
        bodyToSave = body;
        return originalSend.call(this, body);
      };

      res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const headers = { ...res.getHeaders() } as Record<string, string>;
          manager.save(key, { status: res.statusCode, body: bodyToSave, headers }).catch(console.error);
        } else {
          manager.cache.delete(key).catch(console.error);
        }
      });

      res.on('close', () => {
        if (!res.writableEnded) {
          manager.cache.delete(key).catch(console.error);
        }
      });

      next();
    } catch (err) {
      next(err);
    }
  };
}
