# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

UnstuckLabs v2 is a monorepo for a suite of independently-sold mini-app PWAs, each on its own subdomain of `unstucklabs.store`. It hosts three internal apps — **Store** (public marketing/catalog/checkout), **Admin** (internal, role-gated management panel), and **core-api** (shared backend all other apps talk to) — plus, over time, the mini-apps themselves. This is a from-scratch rewrite of v1 (archived at `github.com/EvgenJS/unstucklabs`), which had no shared auth, no shared design system, inconsistent tech versions per app, and an abandoned plan to build the store on an open-source CMS (Payload CMS v2 via the DigitalHippo template). v2 deliberately replaces that with a custom-built admin and a single shared backend.

## Golden rule: consult docs/ROADMAP.md before adding scope

`docs/ROADMAP.md` is the source of truth for what phase we're in and what's in scope right now. Before implementing anything not already listed under the current phase, check the roadmap. If something genuinely needs to be added mid-phase, that's a visible edit to ROADMAP.md in the same PR, not silent scope drift. Update the relevant checkboxes as items land.

## Repo shape

```
apps/
  store/        Next.js — public marketing site, app catalog, checkout, account area
  admin/        Next.js — internal admin panel (role-gated), separate app from Store
  core-api/     Fastify + TypeScript — shared backend: auth, products, subscriptions, payments, email
  <mini-app>/   Vite + React + TS + Tailwind + vite-plugin-pwa, one per subdomain (added from Phase 4+)
packages/
  ui/           Shared design system/components, generated/maintained via the ui-ux-pro-max skill
  sdk/          Typed API client for core-api, used by store/admin/mini-apps
  config/       Shared tsconfig/eslint/tailwind presets
```

Mini-apps never talk to Postgres directly — only through core-api via `packages/sdk`. This keeps subscription/auth enforcement in one place instead of duplicated per app (which is what went wrong in v1).

## Tech stack

| Component | Technology |
|---|---|
| Store, Admin | Next.js 15 (App Router) |
| Mini-apps | Vite + React + TypeScript + Tailwind + vite-plugin-pwa |
| core-api | Node.js + Fastify + TypeScript |
| Database | PostgreSQL (self-hosted, new for v2) |
| ORM | Prisma |
| Monorepo tooling | pnpm workspaces + Turborepo |
| Email | Resend |
| Payments | WesternBid (via adapter — see below) |

## Auth model

Custom-built, not a third-party BaaS. core-api issues a short-lived JWT access token plus a long-lived refresh token stored in an **httpOnly cookie scoped to `.unstucklabs.store`**. This is what makes single sign-on work: log in once on the Store, and every mini-app subdomain recognizes the session. The cookie must use `sameSite: 'lax'` — v1 used `sameSite: 'strict'` on its refresh cookie, which does not survive cross-subdomain top-level navigation and would silently break SSO here. Use `secure: true` in production.

## Payments

WesternBid is the payment processor (chosen because standard Stripe/Paddle access is difficult for Ukrainian merchants). Its public API documentation is thin — API keys are obtained by opening a support ticket, and the exact webhook/checkout payload shape is not yet known. Because of this, all WesternBid-specific logic is isolated behind a `PaymentProvider` interface in `apps/core-api/src/modules/payments/` (`createCheckoutSession`, `verifyAndParseWebhook`). Nothing outside that module should reference WesternBid specifics directly. A `NullPaymentProvider` stub exists for local development so Store/Admin work isn't blocked on WesternBid API access.

## Database conventions

Prisma schema lives at `apps/core-api/prisma/schema.prisma`. Run migrations via `pnpm db:migrate` (delegates to the core-api workspace). Each mini-app's arbitrary user data goes into the `AppUserData` table's JSONB `data` column, scoped by `userId` + `productId` — reach for this instead of adding a new relational table per mini-app feature; only graduate to a real table if the data needs to be queried/joined relationally, not just stored and read back whole.

## Environment variables

Each app keeps its own `.env.example` documenting required variables. Real secrets are never committed — only `.env.example` templates are tracked in git.

## Git workflow

- Branch naming: `phase-<n>/<short-description>` when the work maps to a docs/ROADMAP.md phase (e.g. `phase-1/core-api-auth`), otherwise `fix/...` or `chore/...`.
- `main` is protected — PRs required, even for solo work. This gives a paper trail and an easy revert point.
- Every PR states which ROADMAP.md item(s) it completes; update the checkbox(es) in the same PR or an immediate fast-follow.
- Conventional-commit-style prefixes (`feat:`, `fix:`, `chore:`, `docs:`) are recommended for scanability, not tool-enforced yet.

## Design system

`packages/ui` is generated and maintained using the `ui-ux-pro-max` Claude Code skill (installed at `.claude/skills/ui-ux-pro-max/`) — 67 styles, 161 color palettes, 57 font pairings across 21 stacks. Brand-level tokens live here first; each mini-app can later layer its own palette on top without forking the component library itself.

## Commands

```bash
pnpm dev                    # run all apps in dev mode
pnpm build                  # build all apps/packages (Turborepo)
pnpm --filter core-api dev  # run just core-api
pnpm --filter store dev     # run just the Store
pnpm db:migrate             # apply Prisma migrations
pnpm db:seed                # seed local dev data
pnpm typecheck              # typecheck all workspaces
```

## Local Postgres

No Docker on the primary dev machine. Postgres runs via Homebrew instead:

```bash
brew services start postgresql@16          # starts as a background service
psql -U unstucklabs -d unstucklabs_dev -h localhost
```

Dev database `unstucklabs_dev` and role `unstucklabs` already exist locally with password `unstucklabs_dev` (see `apps/core-api/.env.example` for the full `DATABASE_URL`). `psql`/`pg_ctl` live at `/usr/local/opt/postgresql@16/bin` (added to PATH via `.zshrc`).

## Deployment model

Self-hosted on the user's own server — not Vercel or any serverless platform. Nginx + Let's Encrypt handle TLS and subdomain routing; PM2 manages the Store/Admin/core-api Node processes. Mini-apps are static Vite builds served directly by Nginx. Don't write code that assumes serverless function timeouts, edge runtimes, or platform-specific deploy hooks.

## Explicitly rejected approaches

- No open-source CMS (Payload, Strapi, etc.) — the admin panel is custom-built.
- No Supabase or other BaaS for auth/DB — auth and Postgres access are both custom, in core-api.
- No unified "all-access" bundle subscription — each mini-app is priced and subscribed to individually (schema doesn't prevent adding a bundle later, but don't build for it speculatively).
- No premature multi-tenant abstraction beyond what's in docs/ROADMAP.md's current phase.
