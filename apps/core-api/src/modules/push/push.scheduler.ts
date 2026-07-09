import type { FastifyInstance } from "fastify";
import { createPushService } from "./push.service.js";

const PRODUCT_SLUG = "unstuck-daily";

interface UnstuckDailyCurrentTask {
  title: string;
  status: "active" | "completed" | "abandoned";
}

interface UnstuckDailyData {
  currentTask?: UnstuckDailyCurrentTask | null;
  lastActivityAt?: string;
}

// In-process reminder scheduler -- no new external infra (no Redis/queue),
// consistent with the self-hosted PM2 deployment model in CLAUDE.md. Correct
// only when core-api runs as a single process (PM2 fork mode); clustering
// would run one interval per worker and double-send reminders.
export function startPushScheduler(app: FastifyInstance) {
  const intervalMs = Number(process.env.PUSH_REMINDER_CHECK_INTERVAL_MS ?? 15 * 60 * 1000);
  const thresholdHours = Number(process.env.PUSH_REMINDER_THRESHOLD_HOURS ?? 4);
  const cooldownHours = Number(process.env.PUSH_REMINDER_COOLDOWN_HOURS ?? 20);

  const pushService = createPushService(app.prisma);
  let running = false;

  async function tick() {
    if (running) return;
    running = true;
    try {
      const product = await app.prisma.product.findUnique({ where: { slug: PRODUCT_SLUG } });
      if (!product) return;

      const subscriptions = await app.prisma.pushSubscription.findMany({
        where: { productId: product.id },
      });
      if (subscriptions.length === 0) return;

      const now = Date.now();
      const byUser = new Map<string, typeof subscriptions>();
      for (const sub of subscriptions) {
        const list = byUser.get(sub.userId) ?? [];
        list.push(sub);
        byUser.set(sub.userId, list);
      }

      for (const [userId, userSubs] of byUser) {
        const appData = await app.prisma.appUserData.findUnique({
          where: { userId_productId: { userId, productId: product.id } },
        });
        const data = (appData?.data ?? {}) as UnstuckDailyData;
        const task = data.currentTask;
        if (!task || task.status !== "active" || !data.lastActivityAt) continue;

        const idleMs = now - new Date(data.lastActivityAt).getTime();
        if (idleMs < thresholdHours * 60 * 60 * 1000) continue;

        for (const sub of userSubs) {
          if (sub.lastReminderSentAt) {
            const sinceLastMs = now - sub.lastReminderSentAt.getTime();
            if (sinceLastMs < cooldownHours * 60 * 60 * 1000) continue;
          }

          try {
            await pushService.send(sub, {
              title: "Still there? \u{1F44B}",
              body: `Your task "${task.title}" is right where you left it — no rush.`,
              url: "/",
            });
            await app.prisma.pushSubscription
              .update({ where: { id: sub.id }, data: { lastReminderSentAt: new Date() } })
              .catch(() => {});
          } catch (err) {
            app.log.error(err, "Failed to send push reminder");
          }
        }
      }
    } catch (err) {
      app.log.error(err, "Push reminder scheduler tick failed");
    } finally {
      running = false;
    }
  }

  const timer = setInterval(tick, intervalMs);
  return () => clearInterval(timer);
}
