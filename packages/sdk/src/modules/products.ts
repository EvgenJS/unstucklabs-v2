import { apiRequest, type ApiClientConfig } from "../client";
import type { Product } from "../types";

export interface ProductInput {
  slug: string;
  name: string;
  subdomain?: string;
  description?: string;
  pricingModel: "ONE_TIME" | "RECURRING" | "FREEMIUM";
  priceCents: number;
  currency?: string;
}

export function createProductsModule(config: ApiClientConfig) {
  return {
    list() {
      return apiRequest<{ products: Product[] }>(config, "/products");
    },

    get(slug: string) {
      return apiRequest<{ product: Product }>(config, `/products/${slug}`);
    },

    admin: {
      list() {
        return apiRequest<{ products: Product[] }>(config, "/admin/products");
      },

      create(input: ProductInput) {
        return apiRequest<{ product: Product }>(config, "/admin/products", {
          method: "POST",
          body: JSON.stringify(input),
        });
      },

      update(id: string, input: Partial<ProductInput> & { isActive?: boolean }) {
        return apiRequest<{ product: Product }>(config, `/admin/products/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        });
      },

      remove(id: string) {
        return apiRequest<void>(config, `/admin/products/${id}`, { method: "DELETE" });
      },
    },
  };
}
