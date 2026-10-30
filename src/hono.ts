import { Context, Next } from 'hono';
import { IdempotencyManager } from './manager.js';
import { IdempotencyOptions, ICache } from './types.js';
import { hashPayload } from './utils.js';
import { IdempotencyKeyConflictError } from './IdempotencyError.js';

export function honoIdempotency(options?: IdempotencyOptions & { cache?: ICache }) {
  const manager = new IdempotencyManager(options);

  return async (c: Context, next: Next) => {
    const rawKey = c.req.header(manager.headerName);
    if (!rawKey) {
      await next();
      return;
    }

    if (rawKey.length > 512 || !options?.resolveScope) throw new Error('Valid idempotency key and authenticated scope resolver required');
    const scope = await options.resolveScope(c);
    if (typeof scope !== 'string' || !scope.trim()) throw new Error('Authenticated idempotency scope required');
    const key = hashPayload([scope, c.req.method, c.req.url, rawKey]);
    const payload = { body: await c.req.raw.clone().text() };
    let checkResult;
    try {
      checkResult = await manager.check(key, payload);
    } catch (error) {
      if (error instanceof IdempotencyKeyConflictError) return c.json(error.toProblemDetails(), 409);
      throw error;
    }

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
        
        // Store the actual response bytes as text; passing parsed objects to
        // c.body() does not reproduce the original JSON response.
        const body = await resClone.text();
          
        const headers: Record<string, string> = {};
        resClone.headers.forEach((value, k) => {
          if (!['set-cookie', 'authorization'].includes(k.toLowerCase())) headers[k] = value;
        });

        await manager.save(key, { status: resClone.status, body, headers }, payload);
      } else {
        await manager.cache.delete(key);
      }
    } catch (err) {
      await manager.cache.delete(key);
      throw err;
    }
  };
}
