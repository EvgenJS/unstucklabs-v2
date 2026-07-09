import Fastify, { type FastifyInstance } from "fastify";
import { prismaPlugin } from "./plugins/prisma.js";
import { cookiePlugin } from "./plugins/cookie.js";
import { corsPlugin } from "./plugins/cors.js";
import { rateLimitPlugin } from "./plugins/rate-limit.js";
import { multipartPlugin } from "./plugins/multipart.js";
import { staticPlugin } from "./plugins/static.js";
import { authPlugin } from "./modules/auth/auth.plugin.js";
import { rbacPlugin } from "./modules/admin/rbac.plugin.js";
import { productAccessPlugin } from "./modules/subscriptions/access.plugin.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { productsRoutes } from "./modules/products/products.routes.js";
import { productsAdminRoutes } from "./modules/products/products.admin.routes.js";
import { subscriptionsRoutes } from "./modules/subscriptions/subscriptions.routes.js";
import { subscriptionsAdminRoutes } from "./modules/subscriptions/subscriptions.admin.routes.js";
import { paymentsRoutes } from "./modules/payments/payments.routes.js";
import { webhooksRoutes } from "./modules/payments/webhooks.routes.js";
import { waitlistRoutes } from "./modules/email/waitlist.routes.js";
import { blogRoutes } from "./modules/blog/blog.routes.js";
import { blogAdminRoutes } from "./modules/blog/blog.admin.routes.js";
import { appRequestsRoutes } from "./modules/app-requests/app-requests.routes.js";
import { contactRoutes } from "./modules/contact/contact.routes.js";
import { usersAdminRoutes } from "./modules/users/users.admin.routes.js";
import { productMediaAdminRoutes } from "./modules/products/product-media.admin.routes.js";
import { promoCodesAdminRoutes } from "./modules/promo-codes/promo-codes.admin.routes.js";
import { promoCodesRoutes } from "./modules/promo-codes/promo-codes.routes.js";
import { appUserDataRoutes } from "./modules/app-user-data/app-user-data.routes.js";
import { unstuckDailyAiRoutes } from "./modules/unstuck-daily/ai.routes.js";
import { pushRoutes } from "./modules/push/push.routes.js";
import { trialRoutes } from "./modules/subscriptions/trial.routes.js";
import { habitflowAiRoutes } from "./modules/habitflow/ai.routes.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  // Foundational plugins first -- everything else depends on these.
  await app.register(prismaPlugin);
  await app.register(cookiePlugin);
  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);
  await app.register(authPlugin);
  await app.register(rbacPlugin);
  await app.register(productAccessPlugin);
  await app.register(multipartPlugin);
  await app.register(staticPlugin);

  app.get("/health", async () => {
    await app.prisma.$queryRaw`SELECT 1`;
    return { status: "ok" };
  });

  await app.register(authRoutes);
  await app.register(productsRoutes);
  await app.register(productsAdminRoutes);
  await app.register(subscriptionsRoutes);
  await app.register(subscriptionsAdminRoutes);
  await app.register(trialRoutes);
  await app.register(paymentsRoutes);
  await app.register(webhooksRoutes);
  await app.register(waitlistRoutes);
  await app.register(blogRoutes);
  await app.register(blogAdminRoutes);
  await app.register(appRequestsRoutes);
  await app.register(contactRoutes);
  await app.register(usersAdminRoutes);
  await app.register(productMediaAdminRoutes);
  await app.register(promoCodesAdminRoutes);
  await app.register(promoCodesRoutes);
  await app.register(appUserDataRoutes);
  await app.register(unstuckDailyAiRoutes);
  await app.register(habitflowAiRoutes);
  await app.register(pushRoutes);

  return app;
}
