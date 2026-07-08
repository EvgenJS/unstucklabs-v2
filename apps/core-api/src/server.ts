import "dotenv/config";
import { buildApp } from "./app.js";
import { startPushScheduler } from "./modules/push/push.scheduler.js";

const port = Number(process.env.PORT ?? 3001);

buildApp()
  .then(async (app) => {
    await app.listen({ port, host: "0.0.0.0" });
    startPushScheduler(app);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
