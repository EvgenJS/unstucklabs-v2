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
      — Unstuck Daily, HabitFlow, FishCast are all seeded and live
- [x] No empty sections or template/placeholder content anywhere on the public site
      — the About page's named-responsible-person placeholder (the one remaining
      gap here) is now filled in, see below
- [x] Any visitor password gate / staging lock removed — site is genuinely public
      — confirmed live on unstucklabs.store, no auth wall anywhere on the public site
- [x] Shipping/delivery method configured (digital delivery — `/legal/shipping-policy`
      describes instant access via account + confirmation email)
- [x] Contact Us page with at least two contact methods — email (`hello@unstucklabs.store`)
      + working contact form (`/contact`, posts to `POST /contact`, admin-readable via
      `GET /admin/contact-messages`). Telegram/social was requested but no handle
      exists yet — add once there's a real one; email + form already satisfy
      WesternBid's stated minimum of two methods.
- [x] About Us page: idea/motivation/business model written (`/about`), named
      responsible person is **Yevhen Spatar**, operating independently as an
      individual based in Ukraine — matches the legal pages' stated business status.
- [x] Legal/Policy pages published: `/legal/shipping-policy`, `/legal/refund-policy`,
      `/legal/terms`, `/legal/privacy` — written to accurately reflect that
      UnstuckLabs is currently operated by an individual (not a registered legal
      entity) in Ukraine, per the user's confirmed business status. Not
      placeholder/lorem-ipsum text, but not lawyer-reviewed either.
- [ ] Western Bid merchant profile itself reaches "Confirmed" status (separate
      from the storefront checklist — user-side account step, not started)

Before filing the WesternBid application: reach "Confirmed" merchant profile
status (the one remaining item — a user-side WesternBid account step, not a
storefront change), and optionally add a Telegram/social link once one exists.
Every storefront-side item on this checklist is done.

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

## Phase 5 — Second Mini-App (HabitFlow)

Same rule as Phase 4+: rewrite, not a port. v1's HabitFlow (Express+MongoDB
backend, single-file vanilla-JS frontend, Paddle payments) contributed only
the product concept — none of its code, freemium-tier logic, or unbounded
completions array carried forward.

- [x] Prisma: `Subscription.trialEndsAt` + migration
- [x] core-api: generic trial-start endpoint (`POST /apps/:productSlug/trial/start`),
      reusable by any future mini-app, not just HabitFlow
- [x] core-api: lazy trial-expiry in `access.plugin.ts` (flips `TRIALING` →
      `EXPIRED` on the next gated request past `trialEndsAt`, no new scheduler)
- [x] core-api: extracted shared OpenRouter plumbing (`lib/openrouter.ts` —
      `extractJson`/`callOpenRouter`/`retryJsonCall`) out of Unstuck Daily's
      AI routes so HabitFlow (and future apps) reuse it instead of
      duplicating the fetch/parse logic
- [x] core-api: HabitFlow AI routes — `/ai/coach` (weekly consistency
      check-in) and `/ai/recovery-day` (AI-suggested streak-preserving
      micro-habit, server-enforced 1-use-per-habit-per-7-days guard),
      on a cheap paid model (`nvidia/nemotron-3-ultra-550b-a55b`) rather than
      the free tier, sidestepping the congestion problems documented in the
      Phase 4+ Change Log
- [x] core-api: generalized the push module — removed Unstuck-Daily-only
      product guards from `push.routes.ts` (subscribe/unsubscribe were
      already product-generic, the guard was vestigial); refactored
      `push.scheduler.ts` into a per-product `ReminderStrategy` registry so
      each app owns its own "what counts as missed" semantics
- [x] packages/sdk: generic `push.ts` module (was hardcoded to Unstuck
      Daily's URLs), `habitflow.ts` module, `subscriptions.startTrial()`
- [x] Vite+React+TS+Tailwind v4+vite-plugin-pwa scaffold under
      `apps/habitflow`, manifest `shortcuts` entry for a home-screen
      quick-check-in affordance
- [x] Frontend: Today (habit cards, Sunday-start calendar week grid,
      tap-to-check-off, streak badges), Add/Edit Habit (Atomic-Habits-style
      Action/Time/Place fields, no AI call), Stats (30-day bars, longest
      streak, total check-ins), AI Coach (consistency ring reusing Unstuck
      Daily's focus-timer visual language)
- [x] Streak protection: AI-suggested recovery day only — deliberately not
      combined with a second "streak shields" mechanic (client reviewed and
      rejected that combination after seeing a colleague's proposal)
- [x] Monetization: 5-day full-access free trial (no per-feature/habit
      limits, no card required), then the existing binary
      `requireProductAccess()` gate — no in-app freemium-tier logic to
      maintain, unlike v1's duplicated free/Pro checks
- [x] Push notifications on missed check-ins, plus a deterministic (non-AI)
      day-of-week miss-rate nudge — computed as stats over the user's own
      history, not a new AI call, since the scheduler ticks for every user
      on every interval
- [x] Seed: new `habitflow` Product row, priced to match Unstuck Daily
      ($7/mo, $70/yr)
- [x] Mini-app color scheme, revised twice after live client feedback (see
      Change Log): the original `ui-ux-pro-max`-generated "Warm Stone"
      direction (taupe/amber/cream) and a higher-contrast "Warm Coral"
      revision were both rejected on readability/taste grounds. Client asked
      to try Unstuck Daily's exact "Sky optimism" palette (indigo +
      sunrise-yellow, DM Sans) instead — currently applied as-is, meaning
      HabitFlow no longer has a color identity distinct from Unstuck Daily
      (unlike every other app in the repo). Per-habit accent colors
      (rotated from a small fixed palette at habit creation) remain layered
      on top regardless of base palette.

**Known simplification**: the day-of-week miss-rate push heuristic and the
"today" boundary for streak/reminder logic are both computed in the
*server's* local timezone (see `reminder-strategy.ts`'s `dateKey` comment),
not each individual user's — acceptable for a single-timezone self-hosted
deployment, same caveat already documented for the scheduler's
single-process assumption; revisit only if users in materially different
timezones report the "today" boundary landing on the wrong day for them.

## Phase 6 — Third Mini-App (FishCast)

Same rule as Phase 4+/5: rewrite, not a port. v1's FishCast (a real
React+Vite+TS frontend, Express+TS+Mongoose backend, Paddle/Patreon
payments) contributed the product concept and, per explicit client
instruction, its exact color palette — none of its code, its binary
`isPro` freemium gating, or its Paddle/Patreon integration carried forward.

- [x] Prisma: `FishCastForecastCache` — the second deliberate exception to
      the AppUserData-JSONB rule (after `PushSubscription`), justified the
      same way: forecasts need to be looked up across all users querying
      the same location, not scoped to one user
- [x] core-api: `lib/openweathermap.ts` — current weather, real 5-day/
      3-hour forecast, geocoding, reverse-geocoding, and the moon-phase/
      season calculations ported verbatim from v1's working math. All
      calls happen server-side — v1 had a real OpenWeatherMap key hardcoded
      in frontend source for geocoding, fixed here
- [x] core-api: FishCast forecast route — cross-user cached by rounded
      location + fish + water type + units, AI call via the shared
      `lib/openrouter.ts` plumbing on a cheap paid model
      (`nvidia/nemotron-3-ultra-550b-a55b` by default; the client plans to
      supply a different AI provider/model separately, a one-line env var
      swap once given). **Fixes a real v1 bug**: v1's cache key omitted
      the user id even though the AI prompt was enriched with that user's
      own catch history when Pro, leaking one user's personalized analysis
      to every other user querying the same spot within the 12h TTL. v2's
      cached AI response never includes personalization at all — a
      separate, uncached, deterministic `personalNote` is computed
      per-request from the caller's own catch history and appended outside
      the cache
- [x] core-api: catch-photo upload route, reusing `lib/storage.ts` with a
      new `"catches"` category — makes real a `Catch.photoUrl` field that
      existed in v1's schema but had no upload UI or upload code anywhere
- [x] packages/sdk: `fishcast.ts` module (forecast, geocode,
      reverseGeocode, uploadCatchPhoto)
- [x] Vite+React+TS+Tailwind v4+vite-plugin-pwa scaffold under
      `apps/fishcast` (port 5175) — uses vite-plugin-pwa's `generateSW`
      strategy rather than Unstuck Daily/HabitFlow's `injectManifest`,
      since FishCast has no push-notification feature requiring custom
      service-worker code (see Future/Backlog below)
- [x] Frontend: Forecast (location search with real-time geocoding, real
      3-hour-bucket "golden window" heatmap instead of v1's single-
      snapshot LLM-invented heatmap, bite score, lure picks, quick catch
      logging), Saved Spots (new vs. v1 — a reusable list of favorite
      locations), Catch Log (list + add form with a real photo upload),
      Profile (stats, badges, units toggle)
- [x] Badges/stats (`first_catch`/`streak_5`/`early_bird`/`sniper`/
      `seasonal`, accuracy, streak, favorite species) ported verbatim from
      v1's algorithm, computed client-side from the already-loaded
      `AppUserData` blob instead of a dedicated server endpoint
- [x] Monetization: matches Unstuck Daily/HabitFlow exactly — 5-day
      full-access free trial, then the existing binary
      `requireProductAccess()` gate. Replaces v1's binary `isPro` boolean +
      Paddle webhook + Patreon-link upgrade flow entirely — no backend
      change needed beyond reuse, same as HabitFlow's trial addition
- [x] Seed: new `fishcast` Product row, priced to match Unstuck Daily/
      HabitFlow ($7/mo, $70/yr)
- [x] Design: v1's exact color palette (`#0B1426` background, `#0F1E36`
      surface, `#0EA5E9` primary, `#F59E0B` accent/CTA, `#E2EAF4`
      foreground, `#94B3CC` muted, Inter) kept verbatim per explicit client
      instruction — no `ui-ux-pro-max` design pass for this app, unlike
      Unstuck Daily/HabitFlow. FishCast is v2's first dark-by-default
      mini-app

**Known simplification**: `--color-on-primary` (the CTA button text color)
was set to the dark background color rather than reproducing v1's likely
white-on-amber pairing, since white-on-`#F59E0B` measures under WCAG AA's
4.5:1 text-contrast minimum and dark-on-amber clears it comfortably — same
six brand hex values as v1, just paired correctly. `--color-border` is
similarly a new, slightly-lifted-navy value; v1 bordered inputs with the
same color as their own background (functionally invisible).

## SEO / GEO (Store)

Run via the `seo-geo` skill against the live Store, targeting both
classic SEO and citability in AI answer engines (Google AI Overviews,
ChatGPT, Perplexity).

- [x] `robots.ts` (Store): explicit allow rules for AI crawlers (GPTBot,
      ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, CCBot,
      Applebot-Extended) alongside the existing `*` rule
- [x] `apps/admin/app/robots.ts` (new): blocks all crawling outright —
      Admin is internal/role-gated and had no robots.txt route before this,
      relying only on the page-level `noindex` meta tag (which doesn't stop
      crawling itself, only indexing after a fetch)
- [x] `llms.txt` route (`apps/store/app/llms.txt/route.ts`, new) — a
      generated (not static) content map for AI crawlers/agents, per the
      llmstxt.org convention, listing active apps and published posts so it
      stays in sync with the catalog automatically
- [x] JSON-LD structured data: `Organization`/`WebSite` (root layout),
      `FAQPage` (/faq), `BlogPosting` (blog posts, attributed to the real
      founder as a Person, not a generic Organization), `Product` (app
      detail pages, with real price/currency/availability)
- [x] Self-hosted `Plus Jakarta Sans` via `next/font/google` (replaces the
      old render-blocking `@import` in `globals.css`)
- [x] `next/image` migration for all remaining `<img>` tags (blog cards,
      blog post cover, app catalog, app detail gallery, account page,
      landing hero/preview) — real `sizes`, no more `eslint-disable`
      no-img-element escapes
- [x] `alternates.canonical` added to every static/dynamic Store page
- [x] `lib/markdown.ts` (new) — strips Markdown down to plain text for
      JSON-LD `description`/`headline` fields, and a `toMetaDescription()`
      helper that truncates on a word boundary instead of mid-word

**Note on `next.config.ts` security headers**: `X-Content-Type-Options`/
`X-Frame-Options`/`Referrer-Policy`/`Permissions-Policy` were already set
at the Next.js layer in both Store and Admin (predating this SEO pass).
These now duplicate what `deploy/nginx/snippets/security-headers.conf`
already sets in production (including HSTS, which Nginx sets but
Next.js deliberately doesn't) — harmless defense-in-depth, kept because
they still matter when either app is run standalone without Nginx in
front (e.g. `next dev`).

### Follow-up pass (2026-07-14, same day)

The five items above marked "deliberately not done" were revisited same-day
at user request. Four landed; one is a draft awaiting review.

- [x] **CSP**, both apps, via `middleware.ts` (nonce + `'strict-dynamic'`,
  no `'unsafe-inline'`/`'unsafe-eval'` in production). Real bug caught in
  local production-build testing before this ever reached the server:
  Next's own inline RSC-hydration scripts (`self.__next_f.push(...)`) need
  the nonce Next reads back off the request's `Content-Security-Policy`
  header, which **only reaches statically-prerendered pages if they're
  forced dynamic** — Admin was 100% static (no page there calls a dynamic
  API), so nonces never made it into the HTML, `'strict-dynamic'` then
  drops the `'self'` fallback, and every script silently failed to
  execute (client-side auth redirect from `/` to `/login` never fired —
  admin/app/layout.tsx now has `export const dynamic = "force-dynamic"`,
  same reasoning as Store's homepage). Verified after the fix: direct
  loads, client-side `<Link>` transitions to both static and dynamic Store
  routes, and a real login POST all work under the new policy. Store's
  `style-src` keeps `'unsafe-inline'` (next/image `fill` sets a real
  inline `style` attribute CSP has no nonce mechanism for); Admin's
  doesn't need it (no `fill` usage there).
- [x] **Named blog post authors**: `BlogPost.authorName` (plain string,
  `@default("Yevhen Spatar")`, not a `User` relation — posts aren't
  necessarily written by a registered account) + migration
  `20260714134523_add_blog_post_author_name`, threaded through
  `blog.routes.ts`/`blog.admin.routes.ts`, `BlogPostInput`/`BlogPostSummary`
  in `packages/sdk`, `BlogPostForm.tsx` (new required field, defaults to
  the founder's name for new posts), and Store's `BlogPosting.author` +
  a visible byline on the post page.
- [x] **Cache-Control on `/` and `/apps`**: added at the Nginx layer
  (`deploy/nginx/snippets/store-cache.conf`, 30s `proxy_cache` +
  stale-while-revalidate), matching the original "belongs at Nginx" call.
  Live on the server: cache zone dropped into `/etc/nginx/conf.d/`
  (already `include`d from stock `nginx.conf`'s `http{}`, no hand-edit of
  the shared file needed) and confirmed working (`X-Cache-Status:
  MISS` → `HIT` on repeat requests, other Store routes correctly
  uncached, `admin`/`api`/the unrelated `betting-advisor` PM2 process all
  unaffected). One real bug caught and fixed live: Next.js sends
  `Cache-Control: no-store` on these `force-dynamic` routes, which
  `proxy_cache` honors by default — every request was silently a `MISS`
  until `proxy_ignore_headers Cache-Control Expires Set-Cookie;` was
  added.
- [x] **`sameAs` infrastructure**: `apps/store/lib/social.ts` (Threads, X,
  TikTok, Instagram, YouTube — all empty `href`s right now) feeds both a
  Footer icon row and the Organization JSON-LD `sameAs`; both
  automatically skip anything empty. Confirmed working end-to-end with a
  temporary test URL, then reverted to empty. Still correctly **not**
  populated with real links — fill in `lib/social.ts` once the accounts
  exist, nothing else to wire up.
- [ ] **FAQ answer length**: two answers (bundle/pricing-model, subscription
  vs. one-time) got expanded drafts in `apps/store/app/faq/page.tsx`,
  marked `// DRAFT` in a comment — written, not yet reviewed/approved as
  final copy. The pricing-model one states "$7/month" as a concrete
  example, accurate as of 2026-07-14 for all three live apps (Unstuck
  Daily, HabitFlow, FishCast) but will go stale whenever pricing changes —
  update or cut that detail then, don't let it drift.

## Deployment

**Live in production** on `unstucklabs.store` (all 6 subdomains) since
2026-07-13. Nginx + PM2 configs for the self-hosted single-server
deployment described in CLAUDE.md live under `deploy/` —
`ecosystem.config.js` (repo root, PM2 process defs for
core-api/store/admin) and `deploy/nginx/*.conf` (one server block per
subdomain, plus shared snippets, including `Strict-Transport-Security`).
Full walkthrough in `deploy/DEPLOYMENT.md`. v1 was fully decommissioned as
part of this cutover (old PM2 processes stopped, old nginx sites removed,
old certs revoked) — see the Change Log for the full sequence, including
two real compatibility bugs the actual server surfaced (nginx 1.24's
`http2` directive syntax, PM2's interpreter handling of pnpm's shell-script
`next` binary) that only showed up once genuinely deployed, not in local
dev. Every change since the initial cutover (security fixes, password
reset, branded emails, etc.) has gone through the same build → migrate →
PM2 restart cycle on the real server, not just committed to git.
WesternBid is **not** required to run — the site runs fully on
`NullPaymentProvider` until that's granted (see External Blocking
Dependencies below) — real checkout is the only thing that won't work.

## Email Verification

New Store registrations now require email confirmation before login, matching
v1 FishCast's proven design: `POST /auth/register` creates the user
unverified and emails a 24h single-use token (`EMAIL_VERIFICATION_TOKEN_HOURS`)
instead of logging in immediately; `POST /auth/login` 403s with
`EMAIL_NOT_VERIFIED` until the link is clicked; `GET /auth/verify-email`
flips the account and auto-logs the user in via the same httpOnly refresh
cookie every mini-app relies on for SSO — verified live in-browser post-verify
that a mini-app (FishCast) still recognizes the session immediately. All
pre-existing accounts (including the seeded admin) were grandfathered as
verified in the migration, so no existing login broke. `resendVerification`
always returns an identical generic response regardless of whether the
account exists, to avoid leaking which emails are registered. Locally,
without a real `RESEND_API_KEY` set, the verification link is printed to
core-api's terminal output instead of sent, so the flow is fully testable
without Resend access.

## Password Reset

`POST /auth/forgot-password` (email in, always a generic 202 response --
same anti-enumeration shape as `resendVerification`) emails a 1h single-use
token (`PASSWORD_RESET_TOKEN_HOURS`, deliberately shorter than email
verification's 24h since a live reset link is more sensitive); `POST
/auth/reset-password` consumes it, hashes the new password, and auto-logs
the user in via the same refresh-cookie mechanism `verifyEmail` uses.
Consuming the token also bumps `User.tokenVersion`, invalidating every
existing session for that account -- a password reset is exactly the
moment a stale/possibly-compromised session should stop working, same
tokenVersion mechanism the logout fix added. Verified live: reset flips
the password (old password rejected, new one accepted immediately after),
the token can't be replayed, and a garbage/expired token cleanly shows an
"invalid or expired" state with an inline way to request a new link.

## External Blocking Dependencies

- **WesternBid — rejected (2026-07-20)**: after finally reaching "Confirmed"
  merchant profile status and filing the application (per the Phase 2b
  checklist above), WesternBid declined: *"на жаль, наше торгове агентство
  не обслуговує прийом платежів за цифровий товар цього характеру"*
  ("unfortunately, our trading agency does not service payment acceptance
  for digital goods of this nature") — a product-category rejection, not an
  identity/country one like Paddle/Lemon Squeezy below. Vague enough that a
  clarifying reply to WesternBid (asking what specifically about "digital
  goods of this nature" — the subscription model? PWA delivery? SaaS in
  general? — is unsupported) is still worth sending; not yet done. This does
  not block Phase 0/1/3/4 work, which can proceed against the stub
  PaymentProvider indefinitely.

### Lemon Squeezy — ruled out (2026-07-16 to 2026-07-20)

Was evaluated as a second `PaymentProvider` implementation, developed
alongside WesternBid rather than instead of it — see the research trail
below for why this looked viable on paper (Merchant of Record, no
support-ticket-gated API access, handles EU VAT itself) before live testing
and, finally, Lemon Squeezy support directly, closed it off entirely.
No `LemonSqueezyProvider` was ever implemented — killed at the account/
onboarding stage, never reached the point of writing adapter code.

**Final answer from Lemon Squeezy support (2026-07-20)**, replying to the
open question below: *"Unfortunately, we are currently unable to support
stores based in Ukraine. This means you won't be able to activate your
store or start selling at this time even with paypal connected... We will
make an announcement if we are able to support sellers from Ukraine in the
future."* Confirms this is a blanket country-level block, not a fixable
tax-onboarding glitch — matches Stripe's own well-known Ukraine restriction
now bleeding through post-acquisition (see the live walkthrough below).
**Lemon Squeezy is ruled out** until they announce Ukraine support; don't
retry without a concrete reason to believe that's changed.

**Application/payout research (2026-07-16)**, from Lemon Squeezy's own docs
(docs.lemonsqueezy.com) plus a web check on current PayPal/Payoneer status
for Ukraine:

- Onboarding: free account → store starts in test mode → "Activate your
  store" (business questionnaire + identity verification, gov-issued ID) →
  approval typically 2-3 business days. Unlike Paddle, a rejection here is
  explicitly **not final** per their own FAQ — resubmission is invited if
  the underlying issue is addressed.
- Product fit confirmed: subscription-based SaaS (exactly what the three
  mini-apps are) is an explicitly approved category.
- Eligibility hinges on the **payout bank account's country, not the
  seller's citizenship** ("get paid into a bank or PayPal account located in
  one of our hundreds of supported countries"). Checked the current list —
  **Ukraine is not on it**.
- PayPal payout is a dead end for a Ukraine-based seller right now: Ukrainian
  PayPal accounts can send money but can't reliably receive/withdraw
  business payouts as of 2026.
- Payoneer is **not** a native Lemon Squeezy payout option — it's a
  long-standing unshipped feature request on their public feedback board
  (649 votes, no commitment).
- Fees to plan around: platform fee ~5% + $0.50 + 1.5% (international) +
  0.5% (subscription) ≈ ~7% + $0.50 per transaction; payout fee 1% for
  non-US bank accounts (free for US); $50 minimum payout threshold,
  twice-monthly schedule with a 13-day hold.

**Live account walkthrough, correcting the docs-based read above
(2026-07-16)**: created the real account and store (`unstucklabs.lemonsqueezy.com`,
test mode). The docs' framing — eligibility depends on the bank account's
country, not the seller's — turned out **not to match the actual product**:

- Settings → Payouts: the "Bank Account" payout method is a hard-`disabled`
  button reading "Not available in your country", gated on the store's
  *registered* country (Ukraine), not on which country's bank details you'd
  enter. The Payoneer-virtual-foreign-bank-account idea above is not
  reachable through this UI at all — there's no field to enter routing/
  account numbers for any country.
- PayPal is the only payout method that could actually be connected
  (`Connect` succeeded with a real PayPal account).
- A separate "[Action Required] Submit your tax information" step (required
  "to avoid payout delays") fails outright with **"Unfortunately, Stripe
  payouts are currently not available in your country"** — confirming that
  post-acquisition, Lemon Squeezy's payout/tax-onboarding backend now runs
  through Stripe (see the "2026 Update: Lemon Squeezy + Stripe Managed
  Payments" post referenced earlier), and Stripe's own Ukraine restriction
  (the same one WesternBid was chosen to route around, see CLAUDE.md)
  bleeds directly into Lemon Squeezy for Ukrainian sellers now.
- "Verify your identity" (flagged "Action Required" on the General tab)
  redirects back to Settings instead of opening a form — unclear if this is
  gated behind the tax step above, or a separate bug.
- **Open question, emailed to Lemon Squeezy support 2026-07-16**: whether
  PayPal payouts can proceed at all without completing the Stripe tax step,
  since that step itself 500s/rejects for a Ukraine-registered store. No
  reply yet.
- **Revised assessment**: Lemon Squeezy looks considerably weaker as a
  Ukraine-viable option than the docs suggested — this isn't a workaround-
  able country/bank mismatch, it's a hard Stripe-backend rejection. WesternBid
  (chosen specifically because it's built for Ukrainian merchants) remains
  the stronger bet; keep Lemon Squeezy's PayPal-only path as a maybe pending
  support's answer, not as a confident parallel/backup the way it was framed
  above.

**Paddle ruled out (2026-07-16)**: Paddle was also tried as a candidate MoR
provider. Application was rejected — "This decision is final... we are unable
to provide additional specifics or engage in further correspondence regarding
this result" — received a few days *before* an automated "verify your
identity to activate your account" reminder email, which is stale/queued
noise from their drip system, not a real reopening of the application. Not
pursuing further (no appeal channel exists per their own wording, and
submitting government-ID/proof-of-address/video-selfie KYC to an account
already finally rejected has no upside). Don't retry Paddle later without a
concrete reason to believe the outcome would differ.

**Update (2026-07-20)**: a *different* Paddle email arrived — "we haven't
received the identity verification details... closed your current onboarding
application... welcome to start a new application whenever you have your
documents ready." This contradicts the "final, no further correspondence"
message above and reads like an unrelated automated onboarding-funnel
closure (never got as far as ID verification, unsurprising since the
business-level rejection made submitting docs seem pointless) rather than a
reversal of the earlier decision. Undecided whether a fresh application is
worth it — not yet attempted.

**WesternBid rejected (2026-07-20)**: after finally reaching "Confirmed"
merchant profile status, the application itself was declined — "unfortunately,
our trading agency does not service payment acceptance for digital goods of
this nature" (product-category reason, not identity/country). Vague enough
that a clarifying reply asking what specifically is unsupported is still
worth sending — not yet done.

### Ukraine-native payment gateways (candidate, added 2026-07-20)

WayForPay, LiqPay (PrivatBank), and Fondy were raised as alternatives to the
international MoR platforms above, specifically because they're built for
the Ukrainian market and shouldn't inherit Stripe's Ukraine restriction the
way Lemon Squeezy did. **Precondition discovered**: all three require the
seller to be registered as a ФОП (individual entrepreneur) or legal entity
in Ukraine to connect — UnstuckLabs currently operates as an unregistered
individual (see About/Legal pages), so this blocks on a real-world
registration step, not a technical one. Unlike the three rejections above,
this is a *solvable* precondition rather than a dead end — undecided yet
whether to register a ФОП to unlock this path. Not yet researched: each
gateway's specific requirements beyond entity registration, subscription/
recurring-billing support, and whether they act as MoR (handle
international card processing/VAT themselves) or require pairing with a
separate acquiring bank.

### Payoneer manual invoicing — working interim option (added 2026-07-20)

Also considered whether Payoneer itself (already has an active account, used
for receiving WesternBid/Lemon Squeezy-style payouts) could directly accept
customer payments, not just receive payouts from other platforms. Researched
two Payoneer products:

- **Payoneer Checkout** (embeddable storefront checkout): not viable —
  currently early-access only and requires a **Hong Kong legal entity** plus
  $20k+/month sales volume.
- **Payoneer Recurring Payments** (automatic repeat billing): **US-business
  only** — not available to a Ukraine-based account.
- **Payoneer "Request a Payment"** (invoice/payment-link tool, normally used
  for freelance/B2B invoicing): **this actually works today, no new
  registration needed.** The payer does **not** need their own Payoneer
  account — they pay by card (Visa/Mastercard/Amex) directly on the hosted
  link, globally. This is a real, honest payment for the actual product
  (unlike the DeStream idea above) — just a manual one, since Payoneer has
  no public API to create these links or notify on payment; everything below
  is dashboard-driven by hand.

**Mechanism (manual, no new `PaymentProvider` needed) — implemented
2026-07-21**:
1. Customer clicks "Request to subscribe" on a product page (`CheckoutButton`
   — replaces the old automated-checkout call entirely, not just alongside
   it) → `POST /apps/:productSlug/manual-payment-request` creates a
   `ManualPaymentRequest` row (idempotent on resubmission) and shows "Thanks
   for your order and your interest in our product. You'll receive an
   invoice for payment shortly."
2. Admin is notified immediately over **two channels** (email via
   `CONTACT_NOTIFY_EMAIL` + Telegram via a bot, both best-effort so one
   failing channel doesn't hide the other) — the exact "don't let a request
   go unnoticed" gap the contact-form fix closed earlier, now applied here
   too. New Admin page (`/manual-payment-requests`) lists every request.
3. Yevhen manually creates a "Request a Payment" invoice in the Payoneer
   dashboard for the right amount, tagged with the customer's account email
   and product/billing period (still fully outside this system — Payoneer
   has no creation API)
4. Customer pays by card on the Payoneer-hosted link — no account needed
5. Yevhen clicks "Mark Fulfilled" in Admin — this both marks the request
   fulfilled **and** activates the real `Subscription` row (`ACTIVE`,
   `provider: "payoneer-manual"`, `currentPeriodEnd` computed as one
   month/year from the fulfilment moment), in one action rather than a
   second manual step through the existing Subscriptions page
6. Renewal is also manual (no recurring outside the US): `access.plugin.ts`
   now lazily flips an `ACTIVE` subscription to `EXPIRED` once
   `currentPeriodEnd` passes (same pattern as the existing `trialEndsAt`
   branch), and a new in-process scheduler
   (`renewal-reminder.scheduler.ts`, no new infra, single-process only —
   same constraint as `push.scheduler.ts`) emails the customer **and**
   pings the admin (email + Telegram) once, a configurable number of days
   before `currentPeriodEnd` (`MANUAL_RENEWAL_REMINDER_DAYS_BEFORE`,
   default 3), tracked via a new `renewalReminderSentAt` field so it never
   repeats

Verified end to end locally: submitted a request as a test user, saw the
Telegram-not-configured log line (graceful no-op) and the request appear in
Admin, fulfilled it, and confirmed the `Subscription` row came back `ACTIVE`
with the correct `currentPeriodEnd` in the database.

**Live on production (2026-07-21)**: `@unstucklabs_bot` created, deployed
(`prisma migrate deploy` + rebuild + `pm2 reload`), and verified end to end
against the real site — registered a throwaway test account, submitted a
manual payment request from `/apps/unstuck-daily`, and confirmed the
Telegram alert actually arrived (test user/request deleted afterward). Both
notification channels are live.

**Ruled out after a real attempt (2026-07-21)**: tried actually creating and
paying a "Request a Payment" invoice, and it doesn't hold up in practice,
contradicting what Payoneer's own help docs implied:

- **$20 minimum invoice amount** — above the $7/mo price point entirely (only
  the $70/yr plan would even clear it, and forcing every subscriber onto
  annual billing just to route around a payment-tool limitation isn't
  something to design the product around).
- **Requires the buyer's US state** on the payment form, an odd/blocking ask
  for a non-US customer.
- **The payer, in practice, does need to create a Payoneer account and go
  through a lengthy onboarding** (street address, phone, state, zip code,
  more) — directly contradicting the "payer doesn't need an account, pays by
  card globally" claim in Payoneer's own help center that this whole
  mechanism was built on. Ground truth from actually trying it beats the
  marketing copy.

**This entire mechanism (steps 1-6 above, the Admin page, the notification
channels, the lazy-expiry/reminder scheduler) stays in the codebase** —
none of it is Payoneer-specific at the code level (the `ManualPaymentRequest`
model and flow don't hardcode Payoneer anywhere, "create the actual invoice"
is a manual step outside the system regardless of which processor ends up
usable), so switching the human-side invoicing tool to whatever payment
path is chosen next (a Ukrainian gateway, once ФОП-registered) requires zero
further code changes to this flow — only where Yevhen actually goes to
create the invoice/payment link changes.

**Where this leaves things**: WesternBid, Paddle, Lemon Squeezy, and now
Payoneer direct invoicing have all failed for a Ukraine-based individual
seller of a ~$7/mo digital subscription. The ФОП + Ukrainian-gateway path
(WayForPay/LiqPay/Fondy, see above) is the only remaining candidate that
hasn't hit a hard wall — it just requires the real-world ФОП registration
step first.

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

- **HabitFlow: full multi-turn AI chat coach**: a colleague's ("Gemini")
  proposal suggested a chat-style interface with action-item buttons on top
  of the weekly consistency check-in HabitFlow actually ships. Client
  confirmed backlog, citing cost — unbounded chat turns conflict with the
  deliberate "cheap paid model, not free tier" decision for HabitFlow's AI
  calls. Revisit only if the single-shot weekly digest proves insufficient
  in practice.

- **FishCast: proactive push notifications on saved spots** — notify a
  user when conditions turn favorable at one of their saved spots, without
  them having to open the app and ask. Client explicitly declined for the
  initial build (presented via `AskUserQuestion` alongside three other
  proposed improvements, all approved; this one alone declined), citing
  cost: unlike Unstuck Daily/HabitFlow's push reminders (a free JSONB
  read on each scheduler tick), this would mean re-running paid weather +
  AI calls for every saved spot of every user on every tick. Revisit only
  if usage volume/spot count makes the cost justifiable, and consider
  batching/coalescing spots that resolve to the same cache key before
  building it.

- **Fourth mini-app candidate: AI document-to-quiz + spaced repetition** —
  inspired by seeing `github.com/Magerko/quizli-releases` (a native Android
  app: upload PDF/Word/TXT, AI generates a quiz, missed questions come back
  on a spaced-repetition schedule, optional voice input + semantic checking
  on open questions). Releases-only repo, no source published — nothing to
  port, concept only, same as every other mini-app's "rewrite, not a port"
  rule. Architecturally a good fit for the existing pattern: quiz/progress
  state fits `AppUserData` JSONB same as the other three apps, generation
  would reuse the shared `lib/openrouter.ts` plumbing, gating would reuse
  `requireProductAccess()` and the existing trial/pricing model. Two real
  departures from the source app to plan around before building: (1) the
  original is fully offline including generation (native, on-device);
  a PWA can only cache offline *review* of already-generated quizzes —
  generation and any semantic-checking of open-answer responses need a
  server LLM call every time, unlike HabitFlow/FishCast's on-tick-only AI
  usage. (2) voice input via the Web Speech API is materially less
  reliable on iOS Safari PWAs than native Android speech recognition —
  treat as a nice-to-have, not launch-blocking. Also needs a per-user
  generation cap before shipping (cost scales with document length/question
  count per generation, plus a per-review call for open-answer checking —
  closer to Unstuck Daily's per-user daily-cap shape than HabitFlow/
  FishCast's cheap-per-tick shape). Not scheduled — revisit when picking
  the next mini-app after FishCast.

- **SEO/GEO: broaden audit scope past the 2026-07-14 Store-only pass** (see
  the "SEO / GEO (Store)" section above). Not done, not currently planned —
  revisit each when the trigger condition below is actually true:
  - **Admin / core-api**: only robots.txt + security headers were checked
    (correctly — Admin is role-gated and shouldn't rank, core-api is a JSON
    backend with no HTML surface). No full audit needed unless that changes.
  - **The three mini-apps** (Unstuck Daily, HabitFlow, FishCast): not
    touched at all — separate Vite PWAs on their own subdomains, out of
    scope for a Store-only pass. Each would need its own audit once/if
    they're meant to be independently discoverable (most mini-app traffic
    is expected to arrive via Store links, not organic/AI search directly).
  - **Unused `claude-seo` sub-skills**: `seo-visual` (screenshots/mobile
    rendering), `seo-sxo` (search-intent/persona mismatch analysis),
    `seo-cluster` (topic-cluster content architecture), `seo-image-gen`
    (OG image quality), `seo-google`/`seo-dataforseo` (need real GSC/GA4/
    DataForSEO credentials — not configured), `seo-backlinks` (moot
    pre-launch, zero backlinks exist yet). Revisit `seo-google`/
    `seo-dataforseo`/`seo-backlinks` once there's real traffic/links to
    measure; the others can run any time someone wants that specific lens.
  - **Not fixable by a code change at all**: actual search/AI-answer
    rankings, real backlinks, field Core Web Vitals (CrUX) — all require
    real traffic/time post-launch, not more engineering. Blog content is
    currently 1-2 draft/stub posts, not citation-ready material — that's a
    content-writing backlog item, not an SEO code fix.

## Change Log

- 2026-07-21 — Payoneer "Request a Payment" ruled out after an actual
  attempt: $20 minimum invoice (above the $7/mo price point), requires the
  buyer's US state, and the payer in practice needs their own Payoneer
  account through a lengthy address/phone/zip onboarding -- contradicting
  Payoneer's own help-center claim that no payer account is needed. WesternBid,
  Paddle, Lemon Squeezy, and now Payoneer direct invoicing have all failed;
  the ФОП + Ukrainian-gateway path is the only one left standing. The
  `ManualPaymentRequest` flow/code stays as-is (not Payoneer-specific) --
  only the human-side invoicing tool needs to change once a working
  processor is found. See the "Payoneer manual invoicing" note under
  External Blocking Dependencies.
- 2026-07-21 — Implemented the Payoneer manual-invoicing flow: new
  `ManualPaymentRequest` model, customer-facing "Request to subscribe" flow
  replacing the automated-checkout call in `CheckoutButton`, an Admin page
  to review/fulfil requests, two-channel (email + Telegram) admin
  notifications for new requests, and an in-process scheduler that reminds
  both the customer and the admin before a manually-activated subscription's
  `currentPeriodEnd` lapses. `access.plugin.ts` now lazily expires manual
  subscriptions past their period, mirroring the existing trial-expiry
  pattern. See the "Payoneer manual invoicing" note under External Blocking
  Dependencies for the full mechanism. Telegram alerts need a bot token/chat
  ID set in production before they'll actually fire.
- 2026-07-20 — WesternBid rejected the payment-processing application
  (product-category reason: "digital goods of this nature" unsupported) and
  Lemon Squeezy support confirmed a blanket "unable to support stores based
  in Ukraine" block, unrelated to the earlier tax-onboarding glitch. Also
  received a second, contradictory Paddle email inviting a fresh
  application (see the Paddle update note) — undecided whether worth
  pursuing given the earlier "final" rejection. All three payment-provider
  candidates tried so far have failed or are in doubt for a Ukraine-based
  seller. Raised Ukraine-native gateways (WayForPay/LiqPay/Fondy) as the
  next candidate — these require ФОП/legal-entity registration, which
  UnstuckLabs doesn't have yet; a solvable precondition rather than a
  rejection, unlike the three above. See External Blocking Dependencies for
  full detail.
- 2026-07-20 — Considered and rejected disguising subscription payments as
  DeStream donations (DeStream's API is purely tips/donations between
  streamers and viewers, with no product/subscription concept) — real risk
  of transaction-laundering/chargeback exposure for misrepresenting a
  mandatory payment as a voluntary tip, not just a technicality. Two honest
  alternatives identified instead: (1) a genuine free-with-optional-donation
  model (mini-apps free, payment unlocks a bonus, not core access) parked as
  a tentative idea, not decided; (2) Payoneer's "Request a Payment" invoice
  tool, which works today with no new registration and no account risk since
  it honestly states what the charge is for — see the new "Payoneer manual
  invoicing" note under External Blocking Dependencies. Payoneer's own
  Checkout product (needs a Hong Kong entity + $20k/mo) and Recurring
  Payments (US-only) were both ruled out first.
- 2026-07-16 — Added Lemon Squeezy as a parallel/backup `PaymentProvider`
  candidate (see External Blocking Dependencies) while WesternBid's own
  onboarding remains stuck on the merchant-profile "Confirmed" step. Not
  implemented yet — scope addition only, per the golden-rule requirement to
  make mid-phase scope changes a visible roadmap diff.
- 2026-07-16 — Paddle ruled out as a payment-provider candidate: application
  received a final rejection with no appeal channel offered, days before an
  unrelated automated "verify your identity" reminder arrived. See the
  "Paddle ruled out" note under External Blocking Dependencies.
- 2026-07-16 — Researched Lemon Squeezy's actual application/payout
  requirements (see "Application/payout research" note under External
  Blocking Dependencies): Ukraine isn't in their supported bank-payout
  country list and PayPal can't receive Ukraine business payouts, but a
  Payoneer USD/EUR receiving account can stand in as the payout bank account
  since eligibility is based on the bank account's country, not the
  seller's.
- 2026-07-16 — Corrected the above after actually walking through a real
  Lemon Squeezy account/store (see "Live account walkthrough" note under
  External Blocking Dependencies): the Payoneer-as-virtual-bank-account idea
  doesn't hold up against the real product — "Bank Account" is hard-disabled
  by the store's registered country with no field to enter any bank's
  details, and the tax-info step required to avoid payout delays fails
  outright with "Stripe payouts are currently not available in your
  country," confirming Stripe's Ukraine restriction now runs through Lemon
  Squeezy post-acquisition. Only PayPal connected successfully; whether it
  can pay out without the blocked tax step is an open question emailed to
  Lemon Squeezy support. WesternBid remains the stronger bet.
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
- 2026-07-09 — Phase 5 (HabitFlow) implemented as a from-scratch rewrite and
  verified end to end in the browser: trial start (full access, no card),
  server-side 403 on an unauthenticated/non-trialing request, habit
  check-off + streak display, a real AI Coach call against
  `nvidia/nemotron-3-ultra-550b-a55b`, the recovery-day flow (CTA appears
  on a genuine gap, AI-suggested micro-habit applies and continues the
  streak, a second attempt within 7 days correctly 429s server-side), the
  generalized push module (subscribe works for HabitFlow through the same
  route Unstuck Daily uses, the refactored scheduler's per-product
  `ReminderStrategy` correctly picks up HabitFlow subscriptions), and lazy
  trial-expiry (`trialEndsAt` in the past flips the row to `EXPIRED` on the
  next request and the client shows "trial has ended," correctly distinct
  from the initial "trial available" state, since a trial was already
  used). Re-verified Unstuck Daily's own AI task-breakdown call and
  `SubscriptionGate` after the shared `push.routes.ts`/`push.scheduler.ts`/
  `lib/openrouter.ts` changes — no regression.
  - **Bug found and fixed during verification**: `dateKey()` in both
    `apps/habitflow/src/lib/streaks.ts` and
    `apps/core-api/src/modules/habitflow/reminder-strategy.ts` used
    `.toISOString().slice(0,10)` (UTC-based) while the surrounding date
    arithmetic (`setHours`, `setDate`) operates in local time. In any
    positive-UTC-offset timezone (confirmed live in Europe/Kiev, UTC+3), a
    local-midnight `Date` serializes via `toISOString()` to the *previous*
    UTC calendar day, silently shifting every streak/week-grid/reminder
    date-key lookup back by one day — reproduced live as "No streak yet"
    immediately after checking off a habit, and the week grid highlighting
    the wrong day as "today." Fixed by switching both to local getters
    (`getFullYear()`/`getMonth()`/`getDate()`). A `longestStreakEver` value
    written before the fix was briefly stale (showed "0 days" on Stats
    despite a live 1-day streak) until the next check-off recomputed it
    under the corrected logic — not a separate bug, just a stored value
    computed before the fix landed.
- 2026-07-09 — HabitFlow follow-up: separate OpenRouter API key
  (`HABITFLOW_OPENROUTER_API_KEY`, falling back to the shared
  `OPENROUTER_API_KEY` if unset) so HabitFlow's AI spend is tracked and
  capped independently of Unstuck Daily's, per the client's request.
  `callOpenRouter`/`retryJsonCall` in the shared `lib/openrouter.ts` now
  accept an optional `apiKey` override.
- 2026-07-09 — HabitFlow color scheme revised twice after live client
  feedback, each round verified in the browser:
  1. **"Warm Stone" → "Warm Coral"**: the original taupe/amber/cream
     palette read as low-contrast — faint week-grid borders and
     `text-foreground/NN`-opacity secondary text nearly disappeared
     against the cream background. Re-sourced from the `ui-ux-pro-max`
     skill's palette database under product type "Habit Tracker"
     specifically, warmed toward coral/orange to match a reference the
     client liked, and added a solid `--color-muted-foreground` token to
     replace the opacity-based secondary text across every HabitFlow
     component. Also added a per-habit accent color (rotated from a
     small fixed palette at habit creation, not user-picked) applied to
     the check-off circle and week-grid fills, with a backfill for habits
     persisted before the field existed.
  2. **"Warm Coral" also rejected** — client asked to try Unstuck Daily's
     exact "Sky optimism" palette (indigo + sunrise-yellow, DM Sans)
     instead, to compare directly. Applied as-is (values copied verbatim
     from `apps/unstuck-daily/src/index.css`), keeping the
     `--color-muted-foreground` contrast fix and per-habit accent colors
     from step 1, which are independent of the base palette. HabitFlow
     currently shares its color identity with Unstuck Daily rather than
     having a distinct one — flagged in `index.css` and here for a
     final decision, not silently treated as settled.
  - Also fixed the bottom-nav Coach tab icon (✨ rendered too
    light/washed-out to see against the light background) — swapped for
    🧠, which has stronger contrast and fits "AI Coach" semantically.
- 2026-07-09 — Unstuck Daily's original "no free tier, subscription only"
  decision (Phase 4+) reversed: the client asked for the same 5-day
  full-access free trial HabitFlow already has. No backend change was
  needed — `POST /apps/:productSlug/trial/start` was already built
  product-agnostic during Phase 5 specifically so future apps could reuse
  it. Ported HabitFlow's `SubscriptionGate.tsx` `trial-available` state
  (and its `TrialScreen`) into `apps/unstuck-daily`, with Unstuck-Daily-
  specific copy. Verified the existing demo account's `ACTIVE` subscription
  still grants access unaffected by the added state.
- 2026-07-12 — Phase 6 (FishCast) implemented as a from-scratch rewrite of
  v1's React+Vite+Express+Mongoose app, reusing v2's established
  core-api/Postgres/Prisma stack and the same 5-day-trial monetization as
  Unstuck Daily/HabitFlow. v1's exact color palette was kept verbatim per
  explicit client instruction (the only mini-app so far to skip the
  `ui-ux-pro-max` design pass). Direct source review of every v1 file (an
  earlier pass in this session had wrongly assumed a vanilla-JS frontend;
  corrected before planning) surfaced a real correctness bug worth fixing
  rather than porting: v1's forecast cache key omitted the user id even
  though the AI prompt included that user's own catch history when Pro,
  meaning one user's personalized analysis could be served to a different
  user querying the same spot within the 12h cache TTL. v2's
  `FishCastForecastCache` never includes personalization in the cached
  blob at all — it's computed per-request from the caller's own
  `AppUserData` and appended outside the cache, which also incidentally
  fixes the leak by construction rather than by a targeted patch. Also
  fixed v1's hardcoded, publicly-exposed OpenWeatherMap API key (was in
  frontend source) by proxying all weather/geocoding calls through
  core-api, and made the `Catch.photoUrl` field real (existed in v1's
  schema but had no upload UI or upload code anywhere) via a new
  catch-photo upload route reusing `lib/storage.ts`. Client-approved
  scope additions beyond v1: real 3-hour-bucket weather-forecast data
  powering the "golden window" heatmap (v1 only ever called current-
  conditions and had the AI invent a fake 24-value hourly heatmap from one
  snapshot) and Saved Spots (a reusable favorite-locations list, not
  present in v1). Proactive push notifications on saved spots were
  proposed alongside those and explicitly declined for now — see
  Future/Backlog.
- 2026-07-13 — Deployment infrastructure: `ecosystem.config.js` (PM2, three
  processes — core-api/store/admin, all `exec_mode: "fork"`, explicitly
  `instances: 1` on core-api since `push.scheduler.ts` isn't safe to run
  more than once) and `deploy/nginx/*.conf` (one server block per
  subdomain: apex+www→store, admin, api, and the three static mini-app
  builds, plus shared snippets for reverse-proxy headers, SPA cache
  headers, and security headers). `core-api/src/server.ts` now reads
  `HOST` from env (default `0.0.0.0`, set to `127.0.0.1` in production —
  Nginx is the only thing that should reach that port directly). Full
  walkthrough in `deploy/DEPLOYMENT.md`, including the
  `prisma migrate deploy` vs. `prisma migrate dev` distinction (the
  existing `pnpm db:migrate` script is dev-only, deliberately not
  repointed at `deploy`, since local iteration still needs the dev
  command). Not yet run against a real server.
- 2026-07-13 — Email verification on registration (Resend-backed), matching
  v1 FishCast's design: `User` gains `isEmailVerified`/
  `emailVerificationToken`/`emailVerificationExpires`; `register()` no
  longer issues a session, `login()` 403s `EMAIL_NOT_VERIFIED` until the
  emailed link is clicked, `verifyEmail()` auto-logs in on success. All
  existing rows (including the seeded admin) were backfilled as verified
  in the same migration so no current login broke. `resendVerification()`
  always returns the same generic response to avoid account-enumeration.
  Verified end to end live in-browser: register → blocked login → resend
  → click link → auto-login on `/account` → normal re-login → FishCast
  still SSO'd correctly afterward, proving the shared refresh cookie
  wasn't regressed. See "Email Verification" section above for details.
