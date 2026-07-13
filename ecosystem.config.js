// PM2 process definitions for the self-hosted deployment (see
// deploy/DEPLOYMENT.md). Only the three long-running Node processes are
// listed here -- the three mini-apps (unstuck-daily, habitflow, fishcast)
// are static Vite builds served directly by Nginx, not PM2 processes.
//
// Usage (from the repo root, after `pnpm build`):
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup   # one-time, prints a systemd command to run as root
module.exports = {
  apps: [
    {
      name: "core-api",
      cwd: "apps/core-api",
      script: "dist/server.js",
      // Single instance, fork mode -- push.scheduler.ts runs an in-process
      // setInterval that assumes it's the only process ticking. Cluster
      // mode (or instances > 1) would double-send push reminders. Documented
      // in docs/ROADMAP.md alongside the scheduler itself.
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "store",
      cwd: "apps/store",
      script: "node_modules/.bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "admin",
      cwd: "apps/admin",
      script: "node_modules/.bin/next",
      args: "start -p 3002 -H 127.0.0.1",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
