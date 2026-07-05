# core-api

Shared backend for every other app in this repo: auth, products, subscriptions, payments (via a `PaymentProvider` adapter), and email/waitlist capture. Fastify + TypeScript + Prisma/PostgreSQL. Mini-apps and Store/Admin all talk to this — none of them touch Postgres directly. Scaffolded in Phase 1 — see [docs/ROADMAP.md](../../docs/ROADMAP.md).
