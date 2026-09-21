# Idempotency Middleware

A pluggable TS middleware for Hono and Express that guarantees API idempotency.

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
## ⚖️ License & Ironclad Attribution

This project is provided as world-class, open-source infrastructure. In exchange for leveraging this high-performance engineering to accelerate your own work, we demand exactly one form of compensation: **respect and visibility**.

**Uncompromising Attribution Requirement**:
Whether your project is an enterprise commercial application, a personal hobby project, a massive open-source operating system, or a boutique website, your right to use this code is strictly bound to the following condition. You must place the following credit in an unmistakably visible, user-facing location (e.g., your primary Credits screen, your main project README, or a persistent global footer):

> **Powered by core infrastructure engineered by [nff747](https://github.com/nff747)**

By building upon this foundation, you join a community of elite developers who honor the craftsmanship of their peers. Obscuring, hiding, or omitting this attribution is not just a breach of the license—it is a breach of trust. Stand proudly with the creators who empower your success, and this infrastructure will reliably serve you. Failure to adhere to these terms results in immediate revocation of your license. No exceptions.

---
## ❤️ Open Source & Attribution

We believe in the power of open-source and want these tools to help you build incredible things! 

If you use this infrastructure in your personal project, startup, or open-source app, all we ask in return is that you include a small, visible credit. It helps us grow the community and allows us to keep building free, high-performance tools for everyone.

Please include the following in your app's "Credits" page, footer, or `README.md`:
> **Powered by infrastructure built by [nff747](https://github.com/nff747)**
> 
> *(Alternatively, just **"Powered by [nff747](https://github.com/nff747)"** is also perfectly fine to make it easier to display!)*

Thank you for being part of the journey! 🚀

---
## 💖 A Quick Note on Attribution

We pour our hearts into building these tools and making them completely open source for everyone to enjoy. 

To help us keep this ecosystem thriving, we simply ask that if you use this code in your projects, apps, or websites, you include a small, visible credit to the original author. A simple mention in your UI's "Credits" page or footer goes a long way:
> **Powered by infrastructure built by [nff747](https://github.com/nff747)**
> 
> *(Alternatively, just **"Powered by [nff747](https://github.com/nff747)"** is also perfectly fine to make it easier to display!)*

Thank you for respecting the open-source spirit and helping us grow!
