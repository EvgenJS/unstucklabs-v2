import type { ApiClientConfig } from "./client";
import { createAuthModule } from "./modules/auth";
import { createProductsModule } from "./modules/products";
import { createBlogModule } from "./modules/blog";
export type { ProductInput } from "./modules/products";
export type { BlogPostInput } from "./modules/blog";
import { createSubscriptionsModule } from "./modules/subscriptions";
import { createPaymentsModule } from "./modules/payments";
import { createWaitlistModule } from "./modules/waitlist";
import { createAppRequestsModule } from "./modules/app-requests";
import { createContactModule } from "./modules/contact";
import { createUsersModule } from "./modules/users";
import { createPromoCodesModule } from "./modules/promo-codes";
export type { PromoCodeInput, PromoCodeValidation } from "./modules/promo-codes";
import { createAppUserDataModule } from "./modules/app-user-data";
import { createPushModule } from "./modules/push";
export type { PushSubscriptionKeys } from "./modules/push";
import { createUnstuckDailyModule } from "./modules/unstuck-daily";
export type { TaskBreakdown, Resource } from "./modules/unstuck-daily";
import { createHabitFlowModule } from "./modules/habitflow";
export type { HabitCoachInputHabit, HabitCoachResult, RecoveryDaySuggestion } from "./modules/habitflow";
import { createFishCastModule } from "./modules/fishcast";
export type { FishSpecies, WaterType, Units, ForecastInput, ForecastResult, GeocodeResult } from "./modules/fishcast";

export * from "./types";
export { ApiError } from "./client";
export type { ApiClientConfig } from "./client";

// The single entry point every frontend (store, admin, mini-apps) uses to
// talk to core-api -- nothing else should hand-roll fetch calls to it.
export function createApiClient(config: ApiClientConfig) {
  return {
    auth: createAuthModule(config),
    products: createProductsModule(config),
    blog: createBlogModule(config),
    subscriptions: createSubscriptionsModule(config),
    payments: createPaymentsModule(config),
    waitlist: createWaitlistModule(config),
    appRequests: createAppRequestsModule(config),
    contact: createContactModule(config),
    users: createUsersModule(config),
    promoCodes: createPromoCodesModule(config),
    appUserData: createAppUserDataModule(config),
    push: createPushModule(config),
    unstuckDaily: createUnstuckDailyModule(config),
    habitflow: createHabitFlowModule(config),
    fishcast: createFishCastModule(config),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
