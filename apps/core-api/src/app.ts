import Fastify, { type FastifyInstance } from "fastify";
import { prismaPlugin } from "./plugins/prisma.js";
import { cookiePlugin } from "./plugins/cookie.js";
import { corsPlugin } from "./plugins/cors.js";
import { rateLimitPlugin } from "./plugins/rate-limit.js";
import { authPlugin } from "./modules/auth/auth.plugin.js";
import { rbacPlugin } from "./modules/admin/rbac.plugin.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { productsRoutes } from "./modules/products/products.routes.js";
import { productsAdminRoutes } from "./modules/products/products.admin.routes.js";
import { subscriptionsRoutes } from "./modules/subscriptions/subscriptions.routes.js";
import { subscriptionsAdminRoutes } from "./modules/subscriptions/subscriptions.admin.routes.js";
import { paymentsRoutes } from "./modules/payments/payments.routes.js";
import { webhooksRoutes } from "./modules/payments/webhooks.routes.js";
import { waitlistRoutes } from "./modules/email/waitlist.routes.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  // Foundational plugins first -- everything else depends on these.
  await app.register(prismaPlugin);
  await app.register(cookiePlugin);
  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);
  await app.register(authPlugin);
  await app.register(rbacPlugin);

  app.get("/health", async () => {
    await app.prisma.$queryRaw`SELECT 1`;
    return { status: "ok" };
  });

  await app.register(authRoutes);
  await app.register(productsRoutes);
  await app.register(productsAdminRoutes);
  await app.register(subscriptionsRoutes);
  await app.register(subscriptionsAdminRoutes);
  await app.register(paymentsRoutes);
  await app.register(webhooksRoutes);
  await app.register(waitlistRoutes);

  return app;
}
