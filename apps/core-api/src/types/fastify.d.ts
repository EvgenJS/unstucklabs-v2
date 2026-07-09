import "fastify";
import type { Role, Product } from "@prisma/client";

declare module "fastify" {
  interface FastifyRequest {
    user?: { id: string };
    product?: Product;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (...roles: Role[]) => (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
    requireProductAccess: () => (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}
