import { apiRequest, type ApiClientConfig } from "../client";
import type { ManualPaymentRequest } from "../types";

export function createManualPaymentsModule(config: ApiClientConfig) {
  return {
    request(productSlug: string, billingPeriod: "MONTHLY" | "ANNUAL", promoCode?: string) {
      return apiRequest<{ manualPaymentRequest: ManualPaymentRequest }>(
        config,
        `/apps/${productSlug}/manual-payment-request`,
        { method: "POST", body: JSON.stringify({ billingPeriod, promoCode }) },
      );
    },

    admin: {
      list() {
        return apiRequest<{ manualPaymentRequests: ManualPaymentRequest[] }>(
          config,
          "/admin/manual-payment-requests",
        );
      },

      fulfill(id: string) {
        return apiRequest<{ manualPaymentRequest: ManualPaymentRequest }>(
          config,
          `/admin/manual-payment-requests/${id}`,
          { method: "PATCH", body: JSON.stringify({ status: "FULFILLED" }) },
        );
      },

      cancel(id: string) {
        return apiRequest<{ manualPaymentRequest: ManualPaymentRequest }>(
          config,
          `/admin/manual-payment-requests/${id}`,
          { method: "PATCH", body: JSON.stringify({ status: "CANCELED" }) },
        );
      },
    },
  };
}
