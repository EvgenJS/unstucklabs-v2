import "dotenv/config";
import { buildApp } from "./app.js";
import { startPushScheduler } from "./modules/push/push.scheduler.js";

const port = Number(process.env.PORT ?? 3001);
// Defaults to all interfaces for local dev convenience. In production, set
// HOST=127.0.0.1 (see deploy/DEPLOYMENT.md) -- Nginx reverse-proxies this
// port, and there's no reason for it to be reachable directly from outside.
const host = process.env.HOST ?? "0.0.0.0";

buildApp()
  .then(async (app) => {
    await app.listen({ port, host });
    startPushScheduler(app);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
