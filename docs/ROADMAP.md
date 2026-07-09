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

- [x] Next.js admin app shell, protected by role check (OWNER/EDITOR/SUPPORT)
- [x] Manage Products/Apps (CRUD: name, subdomain, pricing metadata, active flag) —
      OWNER/EDITOR only, no SUPPORT read access (business/pricing concern)
- [x] Manage Users (list, view subscriptions, manually grant/revoke role) — new
      core-api `users` admin module; list/detail viewable by OWNER/EDITOR/SUPPORT,
      grant/revoke restricted to OWNER only (more sensitive than a CRUD edit)
- [x] Manage Subscriptions (view/filter by user/product/status, manual override for support cases)
- [x] Manage Blog posts (CRUD, publish/unpublish) — completes the Phase 2
      pulled-forward blog admin routes; OWNER/EDITOR only, same as Products
- [x] View App Requests + Contact Messages (read-only, OWNER/EDITOR/SUPPORT)
- [x] Role-based route/action gating enforced server-side in core-api, not just
      hidden in UI — UI also hides actions/nav items a role can't use (verified
      by logging in as a real SUPPORT-role user in the browser: Products/Blog
      nav items correctly absent, Users has no grant/revoke buttons, Subscriptions
      has no status override, all matching what core-api actually allows)

Deferred: audit log UI, bulk operations, analytics dashboards.

## Phase 3.5 — Product Merchandising: Media & Promo Codes

- [x] `ProductMedia` model (photo/video gallery per product) + local-disk
      storage (`apps/core-api/src/lib/storage.ts`, `UPLOAD_DIR` env var,
      served at `/uploads/...` via `@fastify/static`) — swappable to an
      S3-compatible store later behind that same module, per the self-hosted
      deployment model in CLAUDE.md
- [x] `POST/DELETE /admin/products/:id/media` (multipart upload via
      `@fastify/multipart`, image/video mime + size validation), OWNER/EDITOR
      only, same gating as the rest of Products
- [x] Admin: media upload + gallery (with delete) in the Products page —
      switches straight to editing the new product after create, since
      uploads need a real `productId`
- [x] Store: `/apps/[slug]` renders the media gallery and renders
      `description` through the same markdown pipeline as the blog (no
      schema change, `description` was already free text)
- [x] `PromoCode` + `PromoCodeRedemption` models: percentage-only discount,
      tied to exactly one product (not store-wide), optional max uses,
      optional expiry, hard one-redemption-per-user rule enforced by a DB
      unique constraint
- [x] Admin Promo Codes page (OWNER/EDITOR): create/deactivate/delete,
      filterable by product
- [x] `POST /promo-codes/validate` (public/authenticated) + checkout
      (`POST /checkout/session`) accepts an optional `promoCode`, always
      re-validated server-side (never trusts a client-computed discount)
- [x] `CheckoutSessionParams` extended with `priceCents`/`currency` so a
      (future) real payment provider sees the actual, possibly-discounted
      amount to charge
- [x] Store: promo code input + "Apply" on the checkout flow, shows the
      discounted price before purchase

**Known simplification**: promo code redemption (usedCount increment +
`PromoCodeRedemption` row) happens atomically at checkout-session creation
time, not on payment webhook confirmation — the real WesternBid webhook
shape is still unknown (see External Blocking Dependencies). Consequence: an
abandoned checkout still permanently consumes one use and the per-user
redemption. Acceptable for an indie-scale operation for now; revisit once
the real WesternBid adapter exists.

Deferred: image/video reordering in the gallery UI, revenue/amount-paid
tracking on Subscription, fixed-amount (vs percentage-only) discounts,
store-wide (multi-product) promo codes.

## Phase 4+ — First Mini-App (Unstuck Daily)

Superseded the original narrower scope (scaffold + AI-call port + gating +
palette): the client asked for a from-scratch rewrite, not a v1 port, with a
materially larger feature set (visual focus timer, gamification, sharing,
real push notifications) — see the Change Log entry below for the full
rationale and the design-direction selection process.

- [x] Prisma: `Product.annualPriceCents`, `Subscription.billingPeriod`, `PushSubscription` table + migration
- [x] core-api: generic `AppUserData` module (`GET`/`PUT /apps/:productSlug/data`) + `requireProductAccess` plugin
- [x] core-api: AI proxy (OpenRouter, free Llama model, per-user daily cap, coach-persona system prompt)
- [x] core-api: push module (VAPID config, subscribe/unsubscribe, in-process reminder scheduler)
- [x] Payments: monthly/annual billing end to end (Store toggle → SDK → checkout → `Subscription.billingPeriod`)
- [x] Vite+React+TS+Tailwind v4+vite-plugin-pwa (`injectManifest`) scaffold under `apps/unstuck-daily` — first Vite app in the repo, establishes the pattern
- [x] Frontend: task input → AI breakdown → focus/execution view → completion → history
- [x] Visual focus timer ("the glow" — ambient radial progress, no countdown pressure)
- [x] Gamification: lifetime milestone badges, explicitly no streaks/no shame
- [x] Shareable completion card (canvas-based)
- [x] Push notification permission flow + custom service worker push handler
- [x] Subscription gating: client redirect (`SubscriptionGate`) + server enforcement (`requireProductAccess`)
- [x] Distinct mini-app color scheme via the `ui-ux-pro-max` skill — "Sky optimism" (indigo + sunrise-yellow accent, DM Sans), chosen by the client from 5 generated candidate directions

Requires an OpenRouter account/API key (self-serve signup) before AI features
work locally, and locally-generated VAPID keys (`npx web-push generate-vapid-keys`)
before push notifications work — neither is a blocker like WesternBid, both
are one-time setup steps documented in `apps/core-api/.env.example`.

**Known simplification**: `AppUserData.data` (task/session/history/achievement
state) is read-whole/write-whole per user, same pattern as the existing
promo-code note elsewhere in this document — true concurrent multi-tab edits
have a small last-write-wins race window. Acceptable at this scale; revisit
only if it's a real problem.

**Deployment caveat**: the push reminder scheduler is an in-process
`setInterval` in core-api (no new external infra, consistent with the
self-hosted PM2 model) — correct only when core-api runs as a single
process. Running it in PM2 cluster mode would run one interval per worker
and double-send reminders.

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
- 2026-07-06 — Phase 3 (Admin MVP) implemented and verified end to end in the
  browser: Products/Blog CRUD, Users (list + OWNER-only role grant/revoke via
  a new core-api `users` admin module), Subscriptions (filter + status
  override), and read-only App Requests/Contact Messages. Verified RBAC by
  actually logging in as a real SUPPORT-role user in the browser (not just
  reasoning about it) — found and fixed a real gap where the Products and Blog
  nav items weren't hidden for SUPPORT even though those admin routes are
  OWNER/EDITOR-only in core-api, which left SUPPORT users stuck on an infinite
  "Loading…" screen; now the Sidebar hides those links and the pages fall back
  to a clear "you don't have access" message if reached directly.
- 2026-07-06 — Phase 3.5 (Product Merchandising) implemented and verified end
  to end: local-disk media upload/storage for product photos/videos
  (`@fastify/multipart` + `@fastify/static`), rendered as a gallery on the
  Store's product page; percentage-only promo codes tied to a single
  product, with atomic max-uses and one-redemption-per-user enforcement
  verified via curl (correct rejection at the usage cap, correct
  "already used" message when a cap isn't yet hit, expired codes rejected).
  Checkout now takes an optional promo code, always re-validated
  server-side.
- 2026-07-06 — Store landing page Hero given a full-bleed background photo
  (AI-generated via the Higgsfield MCP integration) with a gradient scrim,
  tuned for mobile text contrast (verified 9-11:1 against white text).
  Also fixed a pre-existing bug found during mobile verification: the
  header nav overflowed horizontally at narrow viewports, clipping "My
  account" — it now collapses into a hamburger menu below the `sm`
  breakpoint.
- 2026-07-06 — Added cover image upload for blog posts, closing a gap where
  `BlogPost.coverImageUrl` existed in the schema/API but had no upload path
  and wasn't rendered anywhere but Open Graph/Twitter meta tags. Reused the
  Phase 3.5 local-disk storage module (generalized `saveUploadedFile` to
  take a `category` param instead of being product-only), added
  `POST`/`DELETE /admin/blog/posts/:id/cover` routes, an admin
  `BlogCoverManager` upload widget (mirrors `ProductMediaManager`), and
  cover image rendering on both the Store's blog list and post pages.
- 2026-07-08 — Phase 4+ (Unstuck Daily) implemented as a from-scratch
  rewrite, not a port of the archived v1 prototype — the client asked for
  the concept only, explicitly rejecting v1's MongoDB/Paddle/internal-
  webhook architecture. Added: monthly/annual billing
  (`Product.annualPriceCents`, `Subscription.billingPeriod`, threaded
  through checkout/webhooks/Store UI/Admin); a generic, reusable
  `AppUserData` module (`GET`/`PUT /apps/:productSlug/data`) plus a
  `requireProductAccess` gate mirroring the existing RBAC pattern — both
  meant for every future mini-app, not just this one; an OpenRouter-backed
  AI task-breakdown proxy with a coach-persona system prompt and a per-user
  daily cap (abuse backstop, not a cost lever, since the model is free); a
  full Web Push notification system (VAPID, a `PushSubscription` table --
  the one place this feature graduates out of `AppUserData` into a real
  table, since the reminder scheduler needs to query across all users — and
  an in-process `setInterval` scheduler, no new external infra); the first
  Vite app in the monorepo (`apps/unstuck-daily`, `vite-plugin-pwa` in
  `injectManifest` mode since a custom push/notificationclick handler isn't
  possible in `generateSW` mode); an ambient, non-countdown focus timer
  ("the glow"); lifetime-milestone gamification (explicitly no streaks, to
  avoid contradicting the product's own "no shame, no pressure" positioning);
  and a canvas-based shareable completion card. Design direction ("Sky
  optimism" — indigo + sunrise-yellow accent, DM Sans) was chosen by the
  client from 5 candidate directions generated via the `ui-ux-pro-max`
  skill and presented as an interactive visual comparison, not assumed.
- 2026-07-09 — Phase 4+ follow-up fixes and small features, found via the
  client actually using the deployed app, then merged (PR #9):
  - **AI reliability**: `openrouter/free`'s auto-router was observed
    returning 429 on every retry when the whole free pool was congested.
    Added a model fallback chain (`buildAttemptPlan`): retry the free
    auto-router twice, then a named free model
    (`nvidia/nemotron-3-ultra-550b-a55b:free` — requires the account's
    OpenRouter privacy settings to allow free-tier providers, or it 404s
    and is silently skipped), then the same model paid as a last resort
    (`OPENROUTER_PAID_FALLBACK_MODEL`, ~$0.00004/call) so the AI coach
    essentially never hard-fails.
  - **Crash + silent data loss on completing the last subtask**: two
    compounding bugs. `completeSubtask()` called `setNewlyUnlocked()` from
    inside `setData`'s functional updater, which React disallows and
    which crashed the whole tree with no error boundary to catch it
    (blank white screen). Separately, `flush()` was called synchronously
    right after `update()`, but `update()` relied on `setData`'s
    functional-updater form, which React doesn't invoke until after the
    event handler returns — so `flush()` always shipped the *pre-update*
    snapshot to the server and cancelled the debounced write that would
    have sent the correct one, silently dropping the final completion.
    Fixed by computing next state synchronously against a ref in
    `update()` and moving the achievement-unlock `setState` out of the
    updater; also added a top-level `ErrorBoundary` so a future uncaught
    error shows a recoverable message instead of a dead blank screen.
    Reproduced the exact reported crash live before fixing it, then
    verified a full task completes and survives a reload.
  - **Optional per-subtask resource finder**: a "Find resources for this
    step" button (explicitly opt-in per the client's request, not
    automatic per subtask) using OpenRouter's web-search plugin, which
    costs real money per call regardless of the model's own price — gets
    its own daily cap (`UNSTUCK_DAILY_RESOURCES_DAILY_CAP`) separate from
    the main AI cap. Reads real source URLs straight out of the response's
    `annotations` (`url_citation`) rather than asking the model to author
    a JSON list in its own text, sidestepping the reasoning-token-
    exhaustion failure mode entirely.
  - **UI polish**: `TaskInput` had no way to reach History (only reachable
    from an in-progress task); `BreakdownView`'s and `FocusView`'s primary
    buttons were left-aligned instead of centered (missing
    `justify-center`/`items-center` on their flex rows); the resources
    link was inline beside the primary CTA instead of below it and didn't
    stand out visually — given a 🔎 icon and accent color.
  - **Share-card promo link**: the completion share card now promotes
    `unstucklabs.store`, baked into the canvas image itself as a subtle
    watermark (survives share targets that only keep the file, e.g.
    saving straight to Photos) and passed as `text`/`url` to
    `navigator.share()` for targets that auto-linkify it.
