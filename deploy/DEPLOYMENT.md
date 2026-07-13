# Deployment guide

Self-hosted on a single server, per CLAUDE.md's deployment model — no
Vercel, no serverless, no containers. Nginx handles TLS + subdomain
routing, PM2 keeps the three Node processes (core-api, store, admin)
alive, and the three mini-apps are static builds Nginx serves directly.

This guide assumes a fresh Ubuntu/Debian server. Adjust package-manager
commands if you're on something else.

## 0. Before you start

- [ ] A server with a public IP, SSH access, and a domain (`unstucklabs.com`)
      you control DNS for.
- [ ] Postgres reachable from the server (self-hosted on the same box via
      Homebrew-equivalent/apt, or a managed instance — either works, this
      guide assumes it's on the same box for simplicity).
- [ ] **WesternBid**: not required to deploy. The app runs against
      `NullPaymentProvider` until WesternBid access is granted (see
      docs/ROADMAP.md's External Blocking Dependencies). Real checkout
      won't work until then, but everything else — auth, the mini-apps,
      the admin panel, trials — works fine without it.

## 1. DNS

Point six A/AAAA records at the server's IP:

```
unstucklabs.com
www.unstucklabs.com
admin.unstucklabs.com
api.unstucklabs.com
unstuck-daily.unstucklabs.com
habitflow.unstucklabs.com
fishcast.unstucklabs.com
```

(seven records, six unique subdomains — `www` and the apex both point at
the same place; Nginx redirects `www` to the apex.)

## 2. Server prerequisites

```bash
# Node (match the version this repo was built against) + pnpm via corepack
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
corepack enable

# PM2, globally
sudo npm install -g pm2

# Nginx + certbot
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Postgres (skip if using a managed instance elsewhere)
sudo apt-get install -y postgresql
```

Create the database and role (matches the shape `DATABASE_URL` expects —
see `apps/core-api/.env.example`):

```bash
sudo -u postgres createuser unstucklabs --pwprompt
sudo -u postgres createdb unstucklabs_prod -O unstucklabs
```

## 3. Get the code onto the server

```bash
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
git clone https://github.com/EvgenJS/unstucklabs-v2.git /var/www/unstucklabs-v2
cd /var/www/unstucklabs-v2
```

If you clone somewhere other than `/var/www/unstucklabs-v2`, update the
`root` paths in `deploy/nginx/{unstuck-daily,habitflow,fishcast}.unstucklabs.com.conf`
and the `cwd` paths in `ecosystem.config.js` to match.

## 4. Environment variables

Each app that runs as a process needs its own `.env` in production —
**copy each `.env.example`, then fill in real values, never the dev
placeholders.** The three mini-apps don't need a runtime `.env` on the
server — their `VITE_*` values are baked in at build time (step 5), so
set those in `apps/<mini-app>/.env.production` before building instead.

```bash
cp apps/core-api/.env.example apps/core-api/.env
cp apps/store/.env.example apps/store/.env
cp apps/admin/.env.example apps/admin/.env
```

Things that must change from the `.env.example` defaults:

- `DATABASE_URL` — real Postgres credentials from step 2
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — generate fresh
  (`openssl rand -hex 32`), never reuse the local-dev placeholder values
- `COOKIE_DOMAIN=".unstucklabs.com"` — the leading dot is what makes the
  refresh cookie visible across every subdomain (this is the whole SSO
  mechanism — see CLAUDE.md's Auth model)
- `HOST="127.0.0.1"` (core-api) — see the comment in `src/server.ts`;
  Nginx is the only thing that should reach this port
- `CORS_ORIGINS` (core-api) — comma-separated list of the real HTTPS
  origins, replacing the localhost defaults:
  `https://unstucklabs.com,https://admin.unstucklabs.com,https://unstuck-daily.unstucklabs.com,https://habitflow.unstucklabs.com,https://fishcast.unstucklabs.com`
- `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` — generate fresh with
  `npx web-push generate-vapid-keys`, don't reuse the dev pair
- `OPENROUTER_API_KEY`, `HABITFLOW_OPENROUTER_API_KEY`,
  `FISHCAST_OPENROUTER_API_KEY`, `OPENWEATHERMAP_API_KEY` — real
  production keys
- `apps/store/.env` and `apps/admin/.env` — `NEXT_PUBLIC_API_URL` should
  point at `https://api.unstucklabs.com`
- `apps/<mini-app>/.env.production` — `VITE_API_URL=https://api.unstucklabs.com`,
  `VITE_STORE_URL=https://unstucklabs.com`, plus
  `VITE_VAPID_PUBLIC_KEY` (unstuck-daily/habitflow only) matching the
  production VAPID public key above

None of these files are committed (see `.gitignore`) — this step has to
be repeated by hand (or via your own secrets tooling) on every fresh
checkout.

## 5. Install, migrate, build

```bash
pnpm install --frozen-lockfile

# Production migration -- NOT `pnpm db:migrate` (that's `prisma migrate dev`,
# meant for local iteration and can prompt interactively). This applies
# already-generated migrations non-interactively.
pnpm --filter core-api exec prisma migrate deploy

# Optional, first deploy only -- seeds the admin user + product rows.
# Re-running later is safe (upserts by unique key) but you likely don't
# want the sample blog posts in production; check seed.ts before rerunning.
pnpm db:seed

pnpm build
```

`pnpm build` compiles core-api to `apps/core-api/dist/`, builds both
Next.js apps, and produces static `dist/` folders for all three mini-apps
— exactly what `ecosystem.config.js` and the Nginx static `root` paths
both expect.

## 6. Nginx

```bash
sudo mkdir -p /etc/nginx/snippets /var/www/certbot
sudo cp deploy/nginx/snippets/*.conf /etc/nginx/snippets/
sudo cp deploy/nginx/*.conf /etc/nginx/sites-available/
for f in deploy/nginx/*.conf; do
  sudo ln -sf "/etc/nginx/sites-available/$(basename "$f")" /etc/nginx/sites-enabled/
done
```

Each site config's HTTPS `server` block references a cert that doesn't
exist yet — Nginx won't start like this. Comment out (or temporarily
delete) the `listen 443` blocks for a first `nginx -t` + reload with
HTTP-only, **or** just run certbot first with `--nginx`, which edits the
files in place to add working `ssl_certificate` directives once it's
issued the cert. The second path is simpler:

```bash
sudo nginx -t   # will complain about missing certs -- expected right now
```

## 7. TLS certificates

One cert per domain (matches what each config file in `deploy/nginx/`
already references):

```bash
sudo certbot --nginx -d unstucklabs.com -d www.unstucklabs.com
sudo certbot --nginx -d admin.unstucklabs.com
sudo certbot --nginx -d api.unstucklabs.com
sudo certbot --nginx -d unstuck-daily.unstucklabs.com
sudo certbot --nginx -d habitflow.unstucklabs.com
sudo certbot --nginx -d fishcast.unstucklabs.com
```

Certbot auto-renews via its own systemd timer (`certbot.timer`) — nothing
further to set up.

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 8. PM2

```bash
cd /var/www/unstucklabs-v2
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # prints a systemd command -- copy/paste and run it as root
              # so the three processes survive a server reboot
```

Check everything's actually up:

```bash
pm2 status
pm2 logs core-api --lines 50
```

## 9. Verify

- `https://unstucklabs.com` loads the Store
- `https://admin.unstucklabs.com` loads the Admin login
- `https://api.unstucklabs.com/health` returns `{"status":"ok"}`
- `https://unstuck-daily.unstucklabs.com`, `https://habitflow.unstucklabs.com`,
  `https://fishcast.unstucklabs.com` each load their mini-app shell
- Log in on the Store, then open a mini-app in another tab — it should
  recognize the session without a second login (proves `COOKIE_DOMAIN` and
  CORS are both configured correctly)

## Redeploying after a change

```bash
cd /var/www/unstucklabs-v2
git pull
pnpm install --frozen-lockfile
pnpm --filter core-api exec prisma migrate deploy   # only if new migrations exist
pnpm build
pm2 reload ecosystem.config.js   # zero-downtime-ish restart of the 3 processes
```

The three mini-apps need no restart — Nginx just serves whatever's in
their `dist/` folder, so a fresh `pnpm build` is all they need.

## Known limitations

- **Single server, single process per app.** `push.scheduler.ts` assumes
  it's the only process ticking (see `ecosystem.config.js`'s comment on
  `core-api`) — don't raise `instances` above 1 without revisiting that
  assumption first.
- **No CI/CD pipeline yet.** Deploys are manual (`git pull` + rebuild on
  the box). Fine at this scale; revisit if deploy frequency picks up.
- **No blue/green or staging environment.** `pm2 reload` is close to
  zero-downtime for the Node processes, but there's no rollback beyond
  `git checkout <previous-commit>` + rebuild.
