# Idempotency Middleware

Experimental TypeScript middleware for Hono and Express. **Do not use it for payments, sensitive multi-tenant data, or other production-critical operations in its current form.** Keyed requests require an application-provided authenticated scope; route, method and body participate in isolation and conflict detection. This is a breaking change from earlier versions. In-memory locking is process-local; the Redis adapter needs ownership-safe locking and failure recovery before it can provide reliable distributed guarantees. Successful response delivery and cache persistence are also not transactional. Response replay is currently intended for text, not arbitrary binary streams. No exactly-once guarantee is provided.

## Installation

```bash
npm install idempotency-middleware
```

## Usage

### Express
```ts
import express from 'express';
import { expressIdempotency } from 'idempotency-middleware';

const app = express();
app.use(express.json());
// Run authentication first. resolveScope must return a verified identity or
// tenant from your authentication layer, never a caller-supplied header.
app.use(expressIdempotency({ resolveScope: req => req.authenticatedPrincipalId }));
```

### Hono
```ts
import { Hono } from 'hono';
import { honoIdempotency } from 'idempotency-middleware';

const app = new Hono();
// Run your authentication middleware first and populate the trusted context.
app.use('*', honoIdempotency({ resolveScope: c => c.get('authenticatedPrincipalId') }));
```

## License

This project is licensed under the [Apache-2.0 License](LICENSE).
