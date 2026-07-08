import { apiRequest, type ApiClientConfig } from "../client";

// Generic per-mini-app data store -- every mini-app (Unstuck Daily and
// whatever comes after it) reads/writes one JSON blob per user+product here
// instead of getting its own relational tables. The SDK deliberately keeps
// `data` as `unknown` -- each mini-app owns and validates its own shape.
export function createAppUserDataModule(config: ApiClientConfig) {
  return {
    get(productSlug: string) {
      return apiRequest<{ data: unknown }>(config, `/apps/${productSlug}/data`);
    },

    put(productSlug: string, data: unknown) {
      return apiRequest<{ data: unknown }>(config, `/apps/${productSlug}/data`, {
        method: "PUT",
        body: JSON.stringify({ data }),
      });
    },
  };
}
