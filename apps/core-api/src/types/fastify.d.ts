import "fastify";
import type { Role } from "@prisma/client";

declare module "fastify" {
  interface FastifyRequest {
    user?: { id: string };
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (...roles: Role[]) => (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}
