import type { FastifyInstance } from "fastify";
import { createEmailService } from "../email/email.service.js";
import { renderEmailHtml } from "../email/email-template.js";
import { notifyAdmin } from "../notifications/admin-notify.js";

function customerReminderEmailHtml(productName: string, currentPeriodEnd: Date): string {
  return renderEmailHtml({
    preheader: "Your subscription is expiring soon.",
    heading: "Time to renew",
    bodyHtml: `
      <p style="margin: 0 0 12px;">Your ${productName} subscription is set to expire on ${currentPeriodEnd.toLocaleDateString("en-US")}.</p>
      <p style="margin: 0;">Reply to this email or reach out at hello@unstucklabs.store to renew and keep your access.</p>
    `,
  });
}

// In-process reminder scheduler, same "no new infra, single process only"
// shape as push.scheduler.ts -- checks ACTIVE subscriptions with a
// currentPeriodEnd approaching. Not manual-payments-specific by
// construction (any provider that sets currentPeriodEnd benefits), it just
// happens to be the only thing setting that field today (see
// manual-payments.routes.ts's computePeriodEnd). Notifies both the
// subscriber (renew before losing access) and the admin (so a Payoneer
// invoice actually gets sent) exactly once per period via
// renewalReminderSentAt, mirroring PushSubscription.lastReminderSentAt's
// cooldown pattern.
export function startRenewalReminderScheduler(app: FastifyInstance) {
  const intervalMs = Number(process.env.MANUAL_RENEWAL_CHECK_INTERVAL_MS ?? 60 * 60 * 1000);
  const reminderDaysBefore = Number(process.env.MANUAL_RENEWAL_REMINDER_DAYS_BEFORE ?? 3);

  const emailService = createEmailService();
  let running = false;

  async function tick() {
    if (running) return;
    running = true;
    try {
      const now = new Date();
      const reminderWindow = new Date(now.getTime() + reminderDaysBefore * 24 * 60 * 60 * 1000);

      const dueSoon = await app.prisma.subscription.findMany({
        where: {
          status: "ACTIVE",
          renewalReminderSentAt: null,
          currentPeriodEnd: { not: null, lte: reminderWindow },
        },
        include: { user: true, product: true },
      });

      for (const sub of dueSoon) {
        if (!sub.currentPeriodEnd) continue;
        try {
          await Promise.allSettled([
            emailService.sendTransactional(
              sub.user.email,
              `Your ${sub.product.name} subscription is expiring soon`,
              customerReminderEmailHtml(sub.product.name, sub.currentPeriodEnd),
            ),
            notifyAdmin(
              `Renewal due: ${sub.product.name}`,
              `${sub.user.email}'s ${sub.product.name} subscription (${sub.billingPeriod}) expires ` +
                `${sub.currentPeriodEnd.toLocaleDateString("en-US")} -- send a new Payoneer invoice.`,
            ),
          ]);
          await app.prisma.subscription
            .update({ where: { id: sub.id }, data: { renewalReminderSentAt: now } })
            .catch(() => {});
        } catch (err) {
          app.log.error({ err, subscriptionId: sub.id }, "Failed to send renewal reminder");
        }
      }
    } finally {
      running = false;
    }
  }

  const timer = setInterval(tick, intervalMs);
  return () => clearInterval(timer);
}
