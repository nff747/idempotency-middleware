import { Context, Next } from 'hono';
import { IdempotencyManager } from './manager.js';
import { IdempotencyOptions, ICache } from './types.js';

export function honoIdempotency(options?: IdempotencyOptions & { cache?: ICache }) {
  const manager = new IdempotencyManager(options);

  return async (c: Context, next: Next) => {
    const key = c.req.header(manager.headerName);
    if (!key) {
      await next();
      return;
    }

    const checkResult = await manager.check(key);

    if (checkResult.status === 'HIT') {
      const { status, body, headers } = checkResult.record;
      for (const [k, v] of Object.entries(headers)) {
        c.header(k, v);
      }
      return c.body(body, status as any);
    }

    try {
      await next();

      if (c.res.status >= 200 && c.res.status < 300) {
        const resClone = c.res.clone();
        
        let body: any;
        try {
          body = resClone.headers.get('content-type')?.includes('application/json')
            ? await resClone.json()
            : await resClone.text();
        } catch (e) {
          body = null;
        }
          
        const headers: Record<string, string> = {};
        resClone.headers.forEach((value, k) => {
          headers[k] = value;
        });

        await manager.save(key, { status: resClone.status, body, headers });
      } else {
        await manager.cache.delete(key);
      }
    } catch (err) {
      await manager.cache.delete(key);
      throw err;
    }
  };
}
