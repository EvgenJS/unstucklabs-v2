import type { PrismaClient } from "@prisma/client";
import type { WebhookEvent } from "../payments/payment-provider.interface.js";

// Normalizes a provider-agnostic WebhookEvent into a Subscription upsert.
// This is the ONLY place that translates payment events into subscription
// state -- so switching PaymentProvider (once WesternBid access lands)
// never requires touching subscription logic itself.
export function createSubscriptionsService(prisma: PrismaClient) {
  return {
    async createOrUpdateFromPaymentEvent(event: WebhookEvent) {
      if (!event.userId || !event.productId) {
        throw new Error(`Webhook event missing userId/productId: ${event.type}`);
      }

      const status =
        event.type === "purchase.completed" || event.type === "subscription.renewed"
          ? "ACTIVE"
          : event.type === "subscription.canceled"
            ? "CANCELED"
            : event.type === "refund.issued"
              ? "EXPIRED"
              : "ACTIVE";

      return prisma.subscription.upsert({
        where: {
          userId_productId: { userId: event.userId, productId: event.productId },
        },
        create: {
          userId: event.userId,
          productId: event.productId,
          status,
          provider: "westernbid",
          providerCustomerId: event.providerCustomerId,
          providerSubscriptionId: event.providerSubscriptionId,
          providerTransactionId: event.providerTransactionId,
          billingPeriod: event.billingPeriod ?? "MONTHLY",
        },
        update: {
          status,
          providerCustomerId: event.providerCustomerId,
          providerSubscriptionId: event.providerSubscriptionId,
          providerTransactionId: event.providerTransactionId,
          // Only set on renewal if the event actually carries billing
          // metadata -- a renewal webhook without it must not silently
          // reset an annual subscriber back to MONTHLY.
          ...(event.billingPeriod ? { billingPeriod: event.billingPeriod } : {}),
        },
      });
    },
  };
}
