import type { FastifyInstance } from "fastify";
import { createPushService } from "./push.service.js";
import type { ReminderStrategy } from "./reminder-strategy.types.js";
import { unstuckDailyReminderStrategy } from "../unstuck-daily/reminder-strategy.js";
import { habitflowReminderStrategy } from "../habitflow/reminder-strategy.js";

const strategies: ReminderStrategy[] = [unstuckDailyReminderStrategy, habitflowReminderStrategy];

// In-process reminder scheduler -- no new external infra (no Redis/queue),
// consistent with the self-hosted PM2 deployment model in CLAUDE.md. Correct
// only when core-api runs as a single process (PM2 fork mode); clustering
// would run one interval per worker and double-send reminders.
//
// Generic across every product: each app contributes its own
// ReminderStrategy (see reminder-strategy.types.ts) deciding whether/what
// to remind a given user about, purely from that user's own AppUserData
// blob. The tick loop itself only knows how to fetch subscriptions, group
// by user, respect the shared per-subscription cooldown, and send --
// product-specific semantics (what "missed" means, how urgently to nudge)
// live entirely inside each strategy.
export function startPushScheduler(app: FastifyInstance) {
  const intervalMs = Number(process.env.PUSH_REMINDER_CHECK_INTERVAL_MS ?? 15 * 60 * 1000);
  const cooldownHours = Number(process.env.PUSH_REMINDER_COOLDOWN_HOURS ?? 20);

  const pushService = createPushService(app.prisma);
  let running = false;

  async function tickForStrategy(strategy: ReminderStrategy, now: Date) {
    const product = await app.prisma.product.findUnique({ where: { slug: strategy.productSlug } });
    if (!product) return;

    const subscriptions = await app.prisma.pushSubscription.findMany({
      where: { productId: product.id },
    });
    if (subscriptions.length === 0) return;

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
      const reminder = strategy.shouldRemind(appData?.data ?? {}, now);
      if (!reminder) continue;

      for (const sub of userSubs) {
        if (sub.lastReminderSentAt) {
          const sinceLastMs = now.getTime() - sub.lastReminderSentAt.getTime();
          if (sinceLastMs < cooldownHours * 60 * 60 * 1000) continue;
        }

        try {
          await pushService.send(sub, reminder);
          await app.prisma.pushSubscription
            .update({ where: { id: sub.id }, data: { lastReminderSentAt: new Date() } })
            .catch(() => {});
        } catch (err) {
          app.log.error(err, "Failed to send push reminder");
        }
      }
    }
  }

  async function tick() {
    if (running) return;
    running = true;
    const now = new Date();
    try {
      for (const strategy of strategies) {
        try {
          await tickForStrategy(strategy, now);
        } catch (err) {
          app.log.error({ err, productSlug: strategy.productSlug }, "Reminder strategy tick failed");
        }
      }
    } finally {
      running = false;
    }
  }

  const timer = setInterval(tick, intervalMs);
  return () => clearInterval(timer);
}
