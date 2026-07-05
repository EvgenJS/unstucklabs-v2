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
- [x] GitHub branch protection on main (require PR; repo made public since classic
      branch protection needs GitHub Pro on private repos; `enforce_admins` left
      off so the owner isn't locked out solo)
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

### Phase 2b — WesternBid application readiness (gates filing the WesternBid ticket)

WesternBid requires the store to look and function like a real, live business
*before* they'll even review a payment-processing application — the ticket is
filed only once every item below is true, not before. None of this blocks
Phase 1/3/4 work, only the moment we submit the WesternBid application.

- [ ] Real products listed in the catalog (the mini-apps we actually intend to
      sell — "coming soon" status is fine, but no lorem-ipsum/placeholder products)
- [ ] No empty sections or template/placeholder content anywhere on the public site
- [ ] Any visitor password gate / staging lock removed — site is genuinely public
- [ ] Shipping/delivery method configured (digital delivery — describe how access
      is granted post-purchase, since there's no physical shipping)
- [ ] Contact Us page with at least two contact methods (e.g. support email + a
      contact form, or email + social)
- [ ] About Us page: the idea/motivation behind UnstuckLabs, the business model,
      and a named responsible person
- [ ] Legal/Policy pages published: Shipping Policy (digital delivery variant),
      Refund Policy, User Agreement / Terms of Service, Privacy Policy
- [ ] Western Bid merchant profile itself reaches "Confirmed" status (separate
      from the storefront checklist — user-side account step)

Content for About Us / Contact Us / Legal pages needs real input from the user
(business/legal entity status, policy specifics, named responsible person,
contact channels) — flag this explicitly when Phase 2 implementation starts
rather than inventing placeholder legal text.

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
  webhook/checkout API shape is undocumented publicly. Per WesternBid's own process,
  the ticket is filed only after the Phase 2b readiness checklist is fully checked
  off (they review the live storefront before issuing API access) — do not file it
  earlier. This does not block Phase 0/1/3/4 work, which can proceed against the
  stub PaymentProvider indefinitely.

## Change Log

- 2026-07-05 — Initial roadmap drafted and committed as part of Phase 0 scaffold.
- 2026-07-05 — Added Phase 2b (WesternBid application readiness checklist) per
  WesternBid's stated requirements: real catalog content, no empty/template
  sections, no visitor password, Contact Us / About Us / Legal pages, and
  merchant profile "Confirmed" status — all required before filing the API
  access ticket, not before.
- 2026-07-05 — Repo made public and branch protection enabled on main (classic
  branch protection is a paid-plan-only feature for private repos on GitHub).
