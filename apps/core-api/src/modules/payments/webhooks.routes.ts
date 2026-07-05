import type { FastifyInstance } from "fastify";
import { getActivePaymentProvider } from "./provider-factory.js";
import { createSubscriptionsService } from "../subscriptions/subscriptions.service.js";

// Registers its own raw-body content-type parser, scoped to this plugin's
// encapsulated context only (Fastify plugin encapsulation keeps this from
// affecting JSON parsing anywhere else in the app). Signature verification
// needs the exact raw bytes, not a re-serialized JSON object -- this mirrors
// a working pattern from v1's Paddle webhook handling (raw-body-before-json
// middleware ordering) so it works regardless of which provider is active.
export async function webhooksRoutes(fastify: FastifyInstance) {
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (_request, body, done) => {
      done(null, body);
    }
  );

  fastify.post("/webhooks/:provider", async (request, reply) => {
    const { provider: providerName } = request.params as { provider: string };
    const provider = getActivePaymentProvider();

    if (provider.name !== providerName) {
      return reply.code(404).send({ error: "Unknown payment provider" });
    }

    try {
      const event = await provider.verifyAndParseWebhook(
        request.body as Buffer,
        request.headers as Record<string, string>
      );

      const subscriptionsService = createSubscriptionsService(fastify.prisma);
      await subscriptionsService.createOrUpdateFromPaymentEvent(event);

      return reply.code(204).send();
    } catch (err) {
      request.log.error(err, "Webhook processing failed");
      return reply.code(400).send({ error: "Webhook verification failed" });
    }
  });
}
