# Idempotency Middleware

A pluggable TS middleware for Hono and Express that guarantees API idempotency.

## Usage

### Express
```ts
import express from 'express';
import { expressIdempotency } from 'idempotency-middleware';

const app = express();
app.use(expressIdempotency());
```

### Hono
```ts
import { Hono } from 'hono';
import { honoIdempotency } from 'idempotency-middleware';

const app = new Hono();
app.use('*', honoIdempotency());
```
