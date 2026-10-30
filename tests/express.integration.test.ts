import { describe, it, expect } from 'vitest';
import express from 'express';
import { expressIdempotency } from '../src/express.js';
import { IdempotencyError } from '../src/IdempotencyError.js';

describe('Express integration', () => {
  it('isolates scopes, replays a response, and rejects changed payloads', async () => {
    const app = express();
    app.use(express.json());
    // Fixture identity simulates a preceding trusted authentication layer.
    app.use(expressIdempotency({ resolveScope: req => req.header('fixture-user') }));
    let executions = 0;
    app.post('/action', (_req, res) => res.json({ execution: ++executions }));
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(err instanceof IdempotencyError ? err.status : 500).send(err.message);
    });
    const server = app.listen(0, '127.0.0.1');
    try {
      await new Promise<void>(resolve => server.once('listening', resolve));
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('missing test listener');
      const request = (user: string, amount: number) => fetch(`http://127.0.0.1:${address.port}/action`, {
        method:'POST', headers: { 'content-type':'application/json', 'idempotency-key':'key', 'fixture-user':user }, body:JSON.stringify({ amount })
      });
      expect(await (await request('alice', 1)).json()).toEqual({ execution:1 });
      expect(await (await request('bob', 1)).json()).toEqual({ execution:2 });
      expect(await (await request('alice', 1)).json()).toEqual({ execution:1 });
      expect((await request('alice', 2)).status).toBe(409);
      expect(executions).toBe(2);
    } finally { await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve())); }
  });
});
