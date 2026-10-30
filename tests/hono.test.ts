import { describe, it, expect, vi } from 'vitest';
import { honoIdempotency } from '../src/hono.js';
import { Context, Hono } from 'hono';

describe('Hono Middleware', () => {
  it('should skip if no idempotency key', async () => {
    const middleware = honoIdempotency({ resolveScope: () => 'fixture-user' });
    const c = { req: { header: vi.fn().mockReturnValue(undefined) } } as unknown as Context;
    const next = vi.fn();

    await middleware(c, next);
    expect(next).toHaveBeenCalled();
  });

  it('should wait for concurrent requests and return cached response', async () => {
    const middleware = honoIdempotency({ resolveScope: () => 'fixture-user' });
    
    let clonedMap = new Map();
    clonedMap.set('content-type', 'application/json');
    const c1 = { 
      req: { header: vi.fn().mockReturnValue('key-123'), method: 'POST', url: 'https://test/purchase', raw: new Request('https://test/purchase', {method:'POST'}) },
      res: { status: 200, clone: vi.fn().mockReturnValue({
        headers: clonedMap,
        text: vi.fn().mockResolvedValue('{"hello":"world"}'),
        status: 200
      })},
      header: vi.fn(),
      body: vi.fn()
    } as unknown as Context;

    const c2 = { 
      req: { header: vi.fn().mockReturnValue('key-123'), method: 'POST', url: 'https://test/purchase', raw: new Request('https://test/purchase', {method:'POST'}) },
      header: vi.fn(),
      body: vi.fn()
    } as unknown as Context;

    // First request - IN_PROGRESS
    const p1 = middleware(c1, async () => {
      // Simulate long processing
      await new Promise(r => setTimeout(r, 100));
    });

    // Wait a tick to ensure first request started
    await new Promise(r => setTimeout(r, 10));

    // Second request
    const p2 = middleware(c2, vi.fn());
    
    await p1;
    await p2;

    expect(c2.body).toHaveBeenCalledWith('{"hello":"world"}', 200);
  });

  it('replays the exact JSON response through a real Hono app', async () => {
    const app = new Hono();
    let executions = 0;
    app.use('*', honoIdempotency({ resolveScope: () => 'fixture-user' }));
    app.post('/purchase', (c) => { executions++; return c.json({ receipt: 'ok' }, 201); });
    const request = () => app.request('/purchase', { method: 'POST', headers: { 'Idempotency-Key': 'purchase-1' } });
    const first = await request();
    const second = await request();
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(await first.text()).toBe(await second.text());
    expect(second.headers.get('content-type')).toContain('application/json');
    expect(executions).toBe(1);
  });

  it('isolates authenticated scopes and detects changed request bodies', async () => {
    const app = new Hono();
    // Test identity is injected by a preceding authentication layer.
    app.use('*', async (c, next) => { c.set('principal', c.req.header('test-principal')); await next(); });
    app.use('*', honoIdempotency({ resolveScope: (c) => c.get('principal') }));
    let count = 0;
    app.post('/action', (c) => c.json({ execution: ++count }));
    const request = (principal: string, body: string) => app.request('/action', { method:'POST', headers: { 'idempotency-key':'same', 'test-principal':principal }, body });
    expect(await (await request('alice', 'one')).json()).toEqual({ execution: 1 });
    expect(await (await request('bob', 'one')).json()).toEqual({ execution: 2 });
    expect(await (await request('alice', 'one')).json()).toEqual({ execution: 1 });
    expect((await request('alice', 'different')).status).toBe(409);
    expect(count).toBe(2);
  });

  it('fails closed for keyed requests without a trusted scope', async () => {
    const app = new Hono();
    let count = 0;
    app.use('*', honoIdempotency());
    app.post('/', (c) => { count++; return c.text('executed'); });
    const response = await app.request('/', { method:'POST', headers: { 'idempotency-key':'same' } });
    expect(response.status).toBe(500);
    expect(count).toBe(0);
  });
});
