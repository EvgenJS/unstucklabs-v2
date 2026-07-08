import { apiRequest, type ApiClientConfig } from "../client";
import type { CheckoutSessionResult } from "../types";

export function createPaymentsModule(config: ApiClientConfig) {
  return {
    createCheckoutSession(params: {
      productId: string;
      successUrl: string;
      cancelUrl: string;
      promoCode?: string;
      billingPeriod?: "MONTHLY" | "ANNUAL";
    }) {
      return apiRequest<CheckoutSessionResult>(config, "/checkout/session", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
  };
}
