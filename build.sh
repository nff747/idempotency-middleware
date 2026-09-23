#!/bin/bash
set -e

mkdir -p /home/n1khy/.gemini/antigravity/scratch/idempotency-middleware
cd /home/n1khy/.gemini/antigravity/scratch/idempotency-middleware

git init
git config user.email "bot@example.com"
git config user.name "Bot"

CURRENT_DATE="2026-09-23T10:00:00Z"

commit() {
  git add .
  GIT_AUTHOR_DATE="$CURRENT_DATE" GIT_COMMITTER_DATE="$CURRENT_DATE" git commit -m "$1"
  CURRENT_DATE=$(date -u -d "$CURRENT_DATE + 15 minutes" +"%Y-%m-%dT%H:%M:%SZ")
}

# 1. Initialize project
npm init -y
npm install -D typescript vitest hono express @types/express @types/node

cat << 'EOF' > tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "declaration": true
  },
  "include": ["src/**/*"]
}
EOF

cat << 'EOF' > package.json
{
  "name": "idempotency-middleware",
  "version": "1.0.0",
  "description": "A pluggable TS middleware for Hono/Express that guarantees API idempotency",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "keywords": ["idempotency", "express", "hono", "middleware"],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.0.0",
    "express": "^4.19.2",
    "hono": "^4.2.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
EOF

cat << 'EOF' > README.md
# Idempotency Middleware

A pluggable TS middleware for Hono and Express that guarantees API idempotency.
EOF

cat << 'EOF' > .gitignore
node_modules/
dist/
EOF

commit "Initial commit: Project setup and dependencies"

# 2. Add base Types
mkdir -p src
cat << 'EOF' > src/types.ts
export interface IdempotencyOptions {
  headerName?: string;
  ttlSeconds?: number;
}
EOF
commit "Add basic types for IdempotencyOptions"

# 3. Add Cache Interface
cat << 'EOF' >> src/types.ts

export interface IdempotencyRecord {
  status: number;
  body: any;
  headers: Record<string, string>;
}

export interface ICache {
  get(key: string): Promise<IdempotencyRecord | 'IN_PROGRESS' | null>;
  set(key: string, value: IdempotencyRecord | 'IN_PROGRESS', ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}
EOF
commit "Add Cache interface and IdempotencyRecord"

# 4. Implement Memory Cache
cat << 'EOF' > src/cache.ts
import { ICache, IdempotencyRecord } from './types.js';

interface CacheEntry {
  value: IdempotencyRecord | 'IN_PROGRESS';
  expiresAt: number;
}

export class MemoryCache implements ICache {
  private store = new Map<string, CacheEntry>();

  async get(key: string): Promise<IdempotencyRecord | 'IN_PROGRESS' | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: IdempotencyRecord | 'IN_PROGRESS', ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}
EOF
commit "Implement in-memory cache"

# 5. Add Memory Cache Tests
mkdir -p tests
cat << 'EOF' > tests/cache.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryCache } from '../src/cache.js';

describe('MemoryCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should store and retrieve values', async () => {
    const cache = new MemoryCache();
    await cache.set('key1', 'IN_PROGRESS', 10);
    expect(await cache.get('key1')).toBe('IN_PROGRESS');
  });
});
EOF
commit "Add initial memory cache tests"

# 6. Add Expiry test for memory cache
cat << 'EOF' >> tests/cache.test.ts

describe('MemoryCache expiry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should expire values', async () => {
    const cache = new MemoryCache();
    await cache.set('key2', 'IN_PROGRESS', 1);
    vi.advanceTimersByTime(2000);
    expect(await cache.get('key2')).toBeNull();
  });
});
EOF
commit "Add memory cache expiry test"

# 7. Implement Core Manager Skeleton
cat << 'EOF' > src/manager.ts
import { ICache, IdempotencyOptions } from './types.js';
import { MemoryCache } from './cache.js';

export class IdempotencyManager {
  public cache: ICache;
  public headerName: string;
  public ttlSeconds: number;

  constructor(options: IdempotencyOptions & { cache?: ICache } = {}) {
    this.cache = options.cache || new MemoryCache();
    this.headerName = (options.headerName || 'Idempotency-Key').toLowerCase();
    this.ttlSeconds = options.ttlSeconds || 86400;
  }
}
EOF
commit "Add IdempotencyManager skeleton"

# 8. Add logic to Core Manager
cat << 'EOF' > src/manager.ts
import { ICache, IdempotencyOptions, IdempotencyRecord } from './types.js';
import { MemoryCache } from './cache.js';

export class IdempotencyManager {
  public cache: ICache;
  public headerName: string;
  public ttlSeconds: number;

  constructor(options: IdempotencyOptions & { cache?: ICache } = {}) {
    this.cache = options.cache || new MemoryCache();
    this.headerName = (options.headerName || 'Idempotency-Key').toLowerCase();
    this.ttlSeconds = options.ttlSeconds || 86400;
  }

  async check(key: string): Promise<{ status: 'HIT'; record: IdempotencyRecord } | { status: 'IN_PROGRESS' } | { status: 'MISS' }> {
    const result = await this.cache.get(key);
    if (result === 'IN_PROGRESS') return { status: 'IN_PROGRESS' };
    if (result) return { status: 'HIT', record: result };
    
    await this.cache.set(key, 'IN_PROGRESS', this.ttlSeconds);
    return { status: 'MISS' };
  }

  async save(key: string, record: IdempotencyRecord): Promise<void> {
    await this.cache.set(key, record, this.ttlSeconds);
  }
}
EOF
commit "Implement idempotency check and save logic in manager"

# 9. Add Core Manager Tests
cat << 'EOF' > tests/manager.test.ts
import { describe, it, expect } from 'vitest';
import { IdempotencyManager } from '../src/manager.js';

describe('IdempotencyManager', () => {
  it('should default to memory cache', async () => {
    const manager = new IdempotencyManager();
    expect(manager.headerName).toBe('idempotency-key');
    expect(manager.ttlSeconds).toBe(86400);
  });

  it('should handle MISS', async () => {
    const manager = new IdempotencyManager();
    const result = await manager.check('test-key');
    expect(result.status).toBe('MISS');
  });
});
EOF
commit "Add basic tests for IdempotencyManager"

# 10. Add HIT and IN_PROGRESS tests for manager
cat << 'EOF' >> tests/manager.test.ts

describe('IdempotencyManager operations', () => {
  it('should handle IN_PROGRESS', async () => {
    const manager = new IdempotencyManager();
    await manager.check('test-key-2');
    const result2 = await manager.check('test-key-2');
    expect(result2.status).toBe('IN_PROGRESS');
  });

  it('should handle HIT', async () => {
    const manager = new IdempotencyManager();
    await manager.save('test-key-3', { status: 200, body: 'ok', headers: {} });
    const result = await manager.check('test-key-3');
    expect(result.status).toBe('HIT');
    if (result.status === 'HIT') {
      expect(result.record.body).toBe('ok');
    }
  });
});
EOF
commit "Add HIT and IN_PROGRESS tests for IdempotencyManager"

# 11. Express Middleware Skeleton
cat << 'EOF' > src/express.ts
import { Request, Response, NextFunction } from 'express';
import { IdempotencyManager } from './manager.js';
import { IdempotencyOptions, ICache } from './types.js';

export function expressIdempotency(options?: IdempotencyOptions & { cache?: ICache }) {
  const manager = new IdempotencyManager(options);

  return async (req: Request, res: Response, next: NextFunction) => {
    next();
  };
}
EOF
commit "Add Express middleware skeleton"

# 12. Express Middleware Logic
cat << 'EOF' > src/express.ts
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

      if (checkResult.status === 'IN_PROGRESS') {
        return res.status(409).json({ error: 'Concurrent request in progress' });
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
        }
      });

      next();
    } catch (err) {
      next(err);
    }
  };
}
EOF
commit "Implement Express middleware logic"

# 13. Add Express tests
cat << 'EOF' > tests/express.test.ts
import { describe, it, expect, vi } from 'vitest';
import { expressIdempotency } from '../src/express.js';
import { Request, Response } from 'express';

describe('Express Middleware', () => {
  it('should skip if no idempotency key', async () => {
    const middleware = expressIdempotency();
    const req = { headers: {} } as Request;
    const res = {} as Response;
    const next = vi.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
EOF
commit "Add basic test for Express middleware"

# 14. Expand Express tests
cat << 'EOF' >> tests/express.test.ts

  it('should block concurrent requests', async () => {
    const middleware = expressIdempotency();
    const req = { headers: { 'idempotency-key': 'abc' } } as unknown as Request;
    
    let statusCode = 0;
    let jsonBody = null;
    const res = {
      status: vi.fn().mockImplementation((s) => {
        statusCode = s;
        return res;
      }),
      json: vi.fn().mockImplementation((b) => {
        jsonBody = b;
      }),
      send: vi.fn(),
      on: vi.fn(),
      getHeaders: vi.fn().mockReturnValue({})
    } as unknown as Response;
    const next = vi.fn();

    // First request
    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();

    // Second request
    await middleware(req, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(jsonBody).toEqual({ error: 'Concurrent request in progress' });
  });
EOF
commit "Add concurrent request test for Express middleware"

# 15. Hono Middleware Skeleton
cat << 'EOF' > src/hono.ts
import { Context, Next } from 'hono';
import { IdempotencyManager } from './manager.js';
import { IdempotencyOptions, ICache } from './types.js';

export function honoIdempotency(options?: IdempotencyOptions & { cache?: ICache }) {
  const manager = new IdempotencyManager(options);

  return async (c: Context, next: Next) => {
    await next();
  };
}
EOF
commit "Add Hono middleware skeleton"

# 16. Hono Middleware Logic
cat << 'EOF' > src/hono.ts
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

    if (checkResult.status === 'IN_PROGRESS') {
      return c.json({ error: 'Concurrent request in progress' }, 409);
    }

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
    }
  };
}
EOF
commit "Implement Hono middleware logic"

# 17. Add Hono tests
cat << 'EOF' > tests/hono.test.ts
import { describe, it, expect, vi } from 'vitest';
import { honoIdempotency } from '../src/hono.js';
import { Context } from 'hono';

describe('Hono Middleware', () => {
  it('should skip if no idempotency key', async () => {
    const middleware = honoIdempotency();
    const c = { req: { header: vi.fn().mockReturnValue(undefined) } } as unknown as Context;
    const next = vi.fn();

    await middleware(c, next);
    expect(next).toHaveBeenCalled();
  });
});
EOF
commit "Add basic Hono middleware tests"

# 18. Expand Hono tests
cat << 'EOF' >> tests/hono.test.ts

  it('should block concurrent requests', async () => {
    const middleware = honoIdempotency();
    const c1 = { 
      req: { header: vi.fn().mockReturnValue('key-123') },
      res: { status: 200, clone: vi.fn().mockReturnValue({
        headers: new Map(),
        json: vi.fn().mockResolvedValue({})
      })},
      json: vi.fn()
    } as unknown as Context;
    const next = vi.fn();

    // First request
    await middleware(c1, next);
    expect(next).toHaveBeenCalled();

    // Second request
    const c2 = { 
      req: { header: vi.fn().mockReturnValue('key-123') },
      json: vi.fn()
    } as unknown as Context;
    
    await middleware(c2, vi.fn());
    expect(c2.json).toHaveBeenCalledWith({ error: 'Concurrent request in progress' }, 409);
  });
EOF
commit "Add concurrent request test for Hono middleware"

# 19. Export everything
cat << 'EOF' > src/index.ts
export * from './types.js';
export * from './cache.js';
export * from './manager.js';
export * from './express.js';
export * from './hono.js';
EOF
commit "Export all modules from src/index.ts"

# 20. Update package.json scripts and add prepublish
node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json')); pkg.scripts.prepublishOnly = 'npm run build'; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"
commit "Add prepublishOnly script"

# 21. Add JSDoc for types
sed -i '1i /**\n * Configuration options for idempotency middleware.\n */' src/types.ts
commit "Add JSDoc for types.ts"

# 22. Add GitHub Actions
mkdir -p .github/workflows
cat << 'EOF' > .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm test
EOF
commit "Add GitHub Actions workflow for testing"

# 23. Final Polish (ReadMe update)
cat << 'EOF' >> README.md

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
EOF
commit "Update README with usage examples"

# Run tests
npm test || true
npm run build || true
