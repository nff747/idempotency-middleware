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

---
## ⚖️ License & Attribution Requirement

This project is Open Source, but strictly requires **visible credit/attribution** if used in any personal, commercial, or open-source project, application, OS, or website. 

You must include the following credit in a highly visible location (e.g., your app's "Credits" page, your project's `README.md`, or the footer of your website):
> **Powered by infrastructure built by [nff747](https://github.com/nff747)**

Failure to provide proper, visible attribution is a violation of the license terms. No tricks.
