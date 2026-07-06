import { apiRequest, type ApiClientConfig } from "../client";
import type { PromoCode } from "../types";

export interface PromoCodeInput {
  code: string;
  productId: string;
  discountPercent: number;
  maxUses?: number;
  expiresAt?: string;
}

export interface PromoCodeValidation {
  valid: boolean;
  reason?: string;
  discountPercent?: number;
  discountedPriceCents?: number;
}

export function createPromoCodesModule(config: ApiClientConfig) {
  return {
    validate(productId: string, code: string) {
      return apiRequest<PromoCodeValidation>(config, "/promo-codes/validate", {
        method: "POST",
        body: JSON.stringify({ productId, code }),
      });
    },

    admin: {
      list(productId?: string) {
        const qs = productId ? `?productId=${productId}` : "";
        return apiRequest<{ promoCodes: PromoCode[] }>(config, `/admin/promo-codes${qs}`);
      },

      create(input: PromoCodeInput) {
        return apiRequest<{ promoCode: PromoCode }>(config, "/admin/promo-codes", {
          method: "POST",
          body: JSON.stringify(input),
        });
      },

      update(
        id: string,
        input: Partial<Pick<PromoCodeInput, "discountPercent" | "maxUses" | "expiresAt">> & { isActive?: boolean }
      ) {
        return apiRequest<{ promoCode: PromoCode }>(config, `/admin/promo-codes/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        });
      },

      remove(id: string) {
        return apiRequest<void>(config, `/admin/promo-codes/${id}`, { method: "DELETE" });
      },
    },
  };
}
