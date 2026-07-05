# UnstuckLabs v2 Roadmap

Source of truth for phase scope. Check the current phase here before adding
functionality not listed. Update checkboxes as items land — do not silently
drift from this document. If scope genuinely needs to expand mid-phase, that's
a visible diff to this file in the same PR, not silent scope creep.

## Phase 0 — Repo & Tooling Setup

- [x] pnpm workspace + Turborepo scaffold committed
- [x] CLAUDE.md committed
- [x] .claude/settings.json committed (team-shared, distinct from settings.local.json)
- [ ] Shared tsconfig/eslint/prettier presets in packages/config
- [ ] GitHub branch protection on main (require PR, no direct pushes) — manual, via GitHub UI/gh
- [ ] CI skeleton (GitHub Actions: install/build/typecheck) — can be minimal/no-op initially
- [ ] Local Postgres running for dev

Deferred: CD/deploy automation, Nginx/PM2 config (own infra phase later).

## Phase 1 — core-api Foundation

- [ ] Fastify app skeleton, health check route
- [ ] Prisma schema v1 (User, Membership, Product, Subscription, EmailSubscriber, AppUserData)
- [ ] Postgres migration applied locally
- [ ] Auth module: register/login/refresh/logout, JWT access+refresh, httpOnly cookie scoped to `.unstucklabs.com`
- [ ] PaymentProvider interface + NullPaymentProvider stub for local dev
- [ ] Email module: Resend client wrapper, waitlist capture endpoint writing to EmailSubscriber
- [ ] Seed script: at least one product/app row, one admin user

Deferred: real WesternBid adapter (blocked on API access — see External Dependencies),
refresh-token rotation edge cases beyond basic reuse detection, rate limiting beyond
a basic plugin, RBAC enforcement logic (lands in Phase 3).

## Phase 2 — Store MVP

- [ ] Next.js app shell, shared layout using packages/ui tokens
- [ ] App catalog page rendering Product rows from core-api (via packages/sdk)
- [ ] Per-app pricing page
- [ ] Auth pages (login/register) hitting core-api
- [ ] Authenticated account area: "my subscriptions" list + "launch app" link to the mini-app subdomain
- [ ] Checkout flow wired to PaymentProvider interface (stub provider acceptable until WesternBid ticket resolves)
- [ ] Pre-launch waitlist capture form on the marketing/landing page
- [ ] Brand-level design tokens generated via the ui-ux-pro-max skill

Deferred: per-mini-app distinct palettes (part of each mini-app's own Phase 4+ work),
real payment completion (depends on WesternBid credentials).

## Phase 3 — Admin MVP

- [ ] Next.js admin app shell, protected by role check (OWNER/EDITOR/SUPPORT)
- [ ] Manage Products/Apps (CRUD: name, subdomain, pricing metadata, active flag)
- [ ] Manage Users (list, view subscriptions, manually grant/revoke role)
- [ ] Manage Subscriptions (view/filter by user/product/status, manual override for support cases)
- [ ] Role-based route/action gating enforced server-side in core-api, not just hidden in UI

Deferred: audit log UI, bulk operations, analytics dashboards.

## Phase 4+ — First Mini-App Port (Unstuck Daily)

- [ ] Vite+React+TS+Tailwind+vite-plugin-pwa scaffold under `apps/unstuck-daily`
- [ ] Port brain-dump / AI-call feature (OpenRouter)
- [ ] Wire subscription-gating via core-api SDK (replaces v1's boolean flag + internal webhook hack)
- [ ] Distinct mini-app color scheme via the ui-ux-pro-max skill

Not started until Phase 3 is done and stable.

## External Blocking Dependencies

- **WesternBid API access**: requires opening a support ticket to obtain an API key;
  webhook/checkout API shape is undocumented publicly. File this ticket immediately —
  it gates real checkout testing in Phase 2 only, and does not block Phase 0/1/3 work,
  which can proceed against the stub PaymentProvider.

## Change Log

- 2026-07-05 — Initial roadmap drafted and committed as part of Phase 0 scaffold.
