import { apiRequest, type ApiClientConfig } from "../client";
import type { Product } from "../types";

export function createProductsModule(config: ApiClientConfig) {
  return {
    list() {
      return apiRequest<{ products: Product[] }>(config, "/products");
    },

    get(slug: string) {
      return apiRequest<{ product: Product }>(config, `/products/${slug}`);
    },
  };
}
