import { randomUUID, createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentProvider, CheckoutSessionParams, CheckoutSessionResult, WebhookEvent } from "../payment-provider.interface.js";

// Local-dev stand-in used until the real WesternBid adapter can be built
// (blocked on WesternBid support-ticket API access). Lets Store/Admin/core-api
// development and testing proceed without a live payment provider --
// "checkout" instantly succeeds and returns a fake redirect URL. The
// checkout flow itself (payments.routes.ts) grants access directly for this
// provider, so nothing in this app calls its webhook endpoint anymore --
// but POST /webhooks/null is still publicly routable, so it must not trust
// an unsigned body. Requires an HMAC-SHA256 signature of the raw body,
// keyed by WEBHOOK_SECRET, in the x-webhook-signature header -- the same
// shape a real provider's signature check would take, so this also serves
// as the template for the eventual WesternBid implementation.
function getWebhookSecret(): string {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) throw new Error("WEBHOOK_SECRET is not set");
  return secret;
}

export function createNullPaymentProvider(): PaymentProvider {
  return {
    name: "null",

    async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
      const providerSessionId = `null_${randomUUID()}`;
      return {
        redirectUrl: `${params.successUrl}?session=${providerSessionId}&amount=${params.priceCents}&billingPeriod=${params.billingPeriod ?? "MONTHLY"}`,
        providerSessionId,
      };
    },

    async verifyAndParseWebhook(rawBody: Buffer, headers: Record<string, string>): Promise<WebhookEvent> {
      const signature = headers["x-webhook-signature"];
      const expected = createHmac("sha256", getWebhookSecret()).update(rawBody).digest("hex");

      const signatureBuffer = Buffer.from(signature ?? "", "hex");
      const expectedBuffer = Buffer.from(expected, "hex");
      const valid =
        signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer);

      if (!valid) {
        throw new Error("Invalid webhook signature");
      }

      const parsed = JSON.parse(rawBody.toString("utf-8"));
      return {
        type: parsed.type ?? "purchase.completed",
        userId: parsed.userId,
        productId: parsed.productId,
        providerTransactionId: `null_${randomUUID()}`,
        // Deliberately NOT defaulted to "MONTHLY" here -- subscriptions.service.ts
        // needs to distinguish "no billing metadata on this event" (renewal,
        // leave the existing billingPeriod alone) from "this event says
        // MONTHLY" (new checkout). Defaulting here would make every renewal
        // silently reset an annual subscriber back to monthly.
        billingPeriod: parsed.billingPeriod,
        raw: parsed,
      };
    },
  };
}
