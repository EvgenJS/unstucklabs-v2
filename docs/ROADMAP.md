# UnstuckLabs v2 Roadmap

Source of truth for phase scope. Check the current phase here before adding
functionality not listed. Update checkboxes as items land — do not silently
drift from this document. If scope genuinely needs to expand mid-phase, that's
a visible diff to this file in the same PR, not silent scope creep.

## Phase 0 — Repo & Tooling Setup

- [x] pnpm workspace + Turborepo scaffold committed
- [x] CLAUDE.md committed
- [x] .claude/settings.json committed (team-shared, distinct from settings.local.json)
- [x] Shared tsconfig/eslint/prettier presets in packages/config (`@unstucklabs/config`)
- [x] GitHub branch protection on main (require PR; repo made public since classic
      branch protection needs GitHub Pro on private repos; `enforce_admins` left
      off so the owner isn't locked out solo)
- [x] CI skeleton (GitHub Actions: install/typecheck/build, `.github/workflows/ci.yml`)
- [x] Local Postgres running for dev (PostgreSQL 16 via Homebrew, db `unstucklabs_dev`)

Deferred: CD/deploy automation, Nginx/PM2 config (own infra phase later).

## Phase 1 — core-api Foundation

- [x] Fastify app skeleton, health check route
- [x] Prisma schema v1 (User, Membership, Product, Subscription, EmailSubscriber, AppUserData)
- [x] Postgres migration applied locally (PostgreSQL 16 via Homebrew, db `unstucklabs_dev`)
- [x] Auth module: register/login/refresh/logout, JWT access+refresh, httpOnly cookie scoped to `.unstucklabs.com`
- [x] PaymentProvider interface + NullPaymentProvider stub for local dev
- [x] Email module: Resend client wrapper, waitlist capture endpoint writing to EmailSubscriber
- [x] Seed script: at least one product/app row, one admin user
- [x] Products + Subscriptions modules (public catalog, admin CRUD, RBAC-gated)
- [x] Admin RBAC plugin (`requireRole`, composable preHandler)

Deferred: real WesternBid adapter (blocked on API access — see External Dependencies),
refresh-token rotation edge cases beyond basic reuse detection, rate limiting beyond
a basic plugin, RBAC enforcement logic (lands in Phase 3).

## Phase 2 — Store MVP

- [x] Next.js app shell, shared layout using packages/ui tokens
- [x] Distinct landing/home page (`/`) with persuasive copy — separate from the catalog
- [x] App catalog page (`/apps`) rendering Product rows from core-api (via packages/sdk)
- [x] Per-app pricing page (`/apps/[slug]`)
- [x] Blog for SEO: `BlogPost` Prisma model + core-api `blog` module (public list/detail
      + admin CRUD pulled forward from Phase 3), `/blog` + `/blog/[slug]` pages,
      `sitemap.ts`, `robots.ts`, RSS feed, per-post OG/Twitter metadata
- [x] FAQ page (`/faq`) — objection-handling + long-tail SEO
- [x] "Help shape what we build next" co-creation section on the landing page +
      lightweight `AppRequest` capture (email + free-text idea) — NOT the full
      AI-quiz/confirmation pipeline, see Future/Backlog below
- [x] Auth pages (login/register) hitting core-api
- [x] Authenticated account area: "my subscriptions" list + "launch app" link to the mini-app subdomain
- [x] Checkout flow wired to PaymentProvider interface (stub provider acceptable until WesternBid ticket resolves)
- [x] Pre-launch waitlist capture form on the landing page (hero + footer)
- [x] Brand-level design tokens generated via the ui-ux-pro-max skill (teal/orange,
      Plus Jakarta Sans — see packages/ui/design-system/unstucklabs/MASTER.md)

Deferred: per-mini-app distinct palettes (part of each mini-app's own Phase 4+ work),
real payment completion (depends on WesternBid credentials), blog categories/tags
(until ~8-10 posts exist), rich-text blog editor (Phase 3 admin UI work).

### Phase 2b — WesternBid application readiness (gates filing the WesternBid ticket)

WesternBid requires the store to look and function like a real, live business
*before* they'll even review a payment-processing application — the ticket is
filed only once every item below is true, not before. None of this blocks
Phase 1/3/4 work, only the moment we submit the WesternBid application.

- [x] Real products listed in the catalog (the mini-apps we actually intend to
      sell — "coming soon" status is fine, but no lorem-ipsum/placeholder products)
      — Unstuck Daily is seeded; more products land as Phase 4+ apps are built
- [ ] No empty sections or template/placeholder content anywhere on the public site
      — **not yet true**: the About page intentionally has no named responsible
      person yet (user asked for a placeholder there for now, see below)
- [ ] Any visitor password gate / staging lock removed — site is genuinely public
      (n/a until deployed; nothing gates it locally)
- [x] Shipping/delivery method configured (digital delivery — `/legal/shipping-policy`
      describes instant access via account + confirmation email)
- [x] Contact Us page with at least two contact methods — email (`hello@unstucklabs.com`)
      + working contact form (`/contact`, posts to `POST /contact`, admin-readable via
      `GET /admin/contact-messages`). Telegram/social was requested but no handle
      exists yet — add once there's a real one; email + form already satisfy
      WesternBid's stated minimum of two methods.
- [ ] About Us page: idea/motivation/business model written (`/about`), but the
      **named responsible person is a placeholder** — user explicitly asked to defer
      this and write it later. Must be filled in with a real name before filing
      the WesternBid application.
- [x] Legal/Policy pages published: `/legal/shipping-policy`, `/legal/refund-policy`,
      `/legal/terms`, `/legal/privacy` — written to accurately reflect that
      UnstuckLabs is currently operated by an individual (not a registered legal
      entity) in Ukraine, per the user's confirmed business status. Not
      placeholder/lorem-ipsum text, but not lawyer-reviewed either.
- [ ] Western Bid merchant profile itself reaches "Confirmed" status (separate
      from the storefront checklist — user-side account step, not started)

Before filing the WesternBid application: (1) add a real name to `/about`,
(2) reach "Confirmed" merchant profile status, (3) optionally add a Telegram/
social link once one exists. Everything else on this checklist is done.

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

## Future / Backlog (not scheduled)

- **AI-quiz-based app co-creation flow**: user describes what they need via a
  short quiz, an AI confirms/refines the idea back to them, they submit a
  build request. Early participants get free access to the resulting app once
  built — grantable today via the existing admin subscription override
  endpoint (`PATCH /admin/subscriptions/:id`), no new mechanism needed for
  that part. Phase 2 only ships the lightweight version of this (an
  `AppRequest` capture: email + free-text description, no quiz, no AI
  confirmation step) so the landing page's "help shape what we build next"
  messaging has a real destination instead of a dead-end CTA. The full
  quiz/confirmation mechanic is deferred past Phase 4 — revisit once there's
  real submission volume to justify building it.

## Change Log

- 2026-07-05 — Initial roadmap drafted and committed as part of Phase 0 scaffold.
- 2026-07-05 — Added Phase 2b (WesternBid application readiness checklist) per
  WesternBid's stated requirements: real catalog content, no empty/template
  sections, no visitor password, Contact Us / About Us / Legal pages, and
  merchant profile "Confirmed" status — all required before filing the API
  access ticket, not before.
- 2026-07-05 — Repo made public and branch protection enabled on main (classic
  branch protection is a paid-plan-only feature for private repos on GitHub).
- 2026-07-05 — Phase 1 (core-api foundation) implemented and verified end to
  end locally: health check, Prisma migration, auth register/login/refresh/me,
  RBAC-gated admin routes, waitlist capture, checkout stub, and the null-provider
  webhook flow updating a Subscription. Local Postgres via Homebrew
  (`postgresql@16`, db `unstucklabs_dev`) since Docker wasn't available.
- 2026-07-06 — Phase 2 (Store MVP) implemented and verified end to end in the
  browser: full landing page (hero, pain points, value props, how-it-works,
  live catalog teaser, co-creation capture, waitlist), catalog + per-app pricing
  pages, blog with SEO (sitemap/robots/RSS/OG tags), FAQ, About, Contact
  (backed by a new `ContactMessage` model + core-api module), and all four
  legal pages. Full register → login → session-persists-reload → checkout →
  logout cycle verified via browser automation, plus a real bug found and
  fixed along the way (see below). Also added `packages/sdk` (typed core-api
  client) and `packages/ui` design tokens (teal/orange, Plus Jakarta Sans, via
  ui-ux-pro-max) as part of this phase.
- 2026-07-06 — Fixed a bug in `packages/sdk`'s `apiRequest`: it always set
  `Content-Type: application/json` even on bodyless requests (e.g.
  `/auth/refresh`, `/auth/logout`), which made Fastify's JSON body parser choke
  on an empty body and return 400 — silently logging users out on any full
  page reload. Now only sets the header when a body is actually present.
