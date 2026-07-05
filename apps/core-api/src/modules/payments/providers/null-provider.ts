import { randomUUID } from "node:crypto";
import type { PaymentProvider, CheckoutSessionParams, CheckoutSessionResult, WebhookEvent } from "../payment-provider.interface.js";

// Local-dev stand-in used until the real WesternBid adapter can be built
// (blocked on WesternBid support-ticket API access). Lets Store/Admin/core-api
// development and testing proceed without a live payment provider --
// "checkout" instantly succeeds and returns a fake redirect URL.
export function createNullPaymentProvider(): PaymentProvider {
  return {
    name: "null",

    async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
      const providerSessionId = `null_${randomUUID()}`;
      return {
        redirectUrl: `${params.successUrl}?session=${providerSessionId}`,
        providerSessionId,
      };
    },

    async verifyAndParseWebhook(rawBody: Buffer): Promise<WebhookEvent> {
      const parsed = JSON.parse(rawBody.toString("utf-8"));
      return {
        type: parsed.type ?? "purchase.completed",
        userId: parsed.userId,
        productId: parsed.productId,
        providerTransactionId: `null_${randomUUID()}`,
        raw: parsed,
      };
    },
  };
}
