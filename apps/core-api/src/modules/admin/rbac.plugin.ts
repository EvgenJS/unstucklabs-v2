import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Role } from "@prisma/client";

// Composable RBAC gate: `fastify.requireRole('OWNER', 'EDITOR')` returns a
// preHandler, meant to run AFTER `fastify.authenticate` so request.user is
// already set. Enforced server-side here (not just hidden in admin UI) --
// a SUPPORT-role user hitting an OWNER-only route directly still gets 403.
export const rbacPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorate("requireRole", (...roles: Role[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        return reply.code(401).send({ error: "Not authenticated" });
      }

      const memberships = await fastify.prisma.membership.findMany({
        where: { userId: request.user.id },
      });
      const hasRole = memberships.some((m) => roles.includes(m.role));

      if (!hasRole) {
        return reply.code(403).send({ error: "Insufficient role" });
      }
    };
  });
});
