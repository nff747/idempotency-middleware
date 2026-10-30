import { Request, Response, NextFunction } from 'express';
import { IdempotencyManager } from './manager.js';
import { IdempotencyOptions, ICache } from './types.js';
import { hashPayload } from './utils.js';

export function expressIdempotency(options?: IdempotencyOptions & { cache?: ICache }) {
  const manager = new IdempotencyManager(options);

  return async (req: Request, res: Response, next: NextFunction) => {
    const rawKey = req.headers[manager.headerName];
    if (!rawKey) return next();

    try {
      if (typeof rawKey !== 'string' || rawKey.length > 512 || !options?.resolveScope) throw new Error('Valid idempotency key and authenticated scope resolver required');
      const scope = await options.resolveScope(req);
      if (typeof scope !== 'string' || !scope.trim()) throw new Error('Authenticated idempotency scope required');
      if (req.body === undefined && (req.headers['transfer-encoding'] || Number(req.headers['content-length'] || 0) > 0)) {
        throw new Error('Parse the request body before the idempotency middleware');
      }
      const key = hashPayload([scope, req.method, req.originalUrl, rawKey]);
      const payload = { body: req.body ?? null };
      const checkResult = await manager.check(key, payload);

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
          const headers = Object.fromEntries(Object.entries(res.getHeaders()).filter(([name]) => !['set-cookie', 'authorization'].includes(name.toLowerCase()))) as Record<string, string>;
          manager.save(key, { status: res.statusCode, body: bodyToSave, headers }, payload).catch(console.error);
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
