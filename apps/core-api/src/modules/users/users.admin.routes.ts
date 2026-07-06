import type { FastifyInstance } from "fastify";
import { z } from "zod";

const membershipSchema = z.object({
  role: z.enum(["OWNER", "EDITOR", "SUPPORT"]),
});

// Admin user management -- OWNER/EDITOR/SUPPORT can all view (support needs
// this to look up a user's account), but granting/revoking an admin role is
// OWNER-only. Unlike Products/Subscriptions, this isn't split OWNER+EDITOR
// for writes -- creating another admin is a more sensitive action than
// editing a product or overriding a subscription.
export async function usersAdminRoutes(fastify: FastifyInstance) {
  fastify.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);
    instance.addHook("preHandler", instance.requireRole("OWNER", "EDITOR", "SUPPORT"));

    instance.get("/admin/users", async () => {
      const users = await instance.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          createdAt: true,
          lastSeenAt: true,
          memberships: { select: { role: true } },
          _count: { select: { subscriptions: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return { users };
    });

    instance.get("/admin/users/:id", async (request, reply) => {
      const { id } = request.params as { id: string };

      const user = await instance.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          createdAt: true,
          lastSeenAt: true,
          memberships: { select: { id: true, role: true } },
          subscriptions: { include: { product: true } },
        },
      });

      if (!user) return reply.code(404).send({ error: "User not found" });
      return { user };
    });

    instance.post(
      "/admin/users/:id/memberships",
      { preHandler: instance.requireRole("OWNER") },
      async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = membershipSchema.parse(request.body);

        const membership = await instance.prisma.membership.upsert({
          where: { userId_role: { userId: id, role: body.role } },
          create: { userId: id, role: body.role },
          update: {},
        });
        return reply.code(201).send({ membership });
      }
    );

    instance.delete(
      "/admin/users/:id/memberships/:role",
      { preHandler: instance.requireRole("OWNER") },
      async (request, reply) => {
        const { id, role } = request.params as { id: string; role: string };
        const parsedRole = membershipSchema.shape.role.parse(role);

        await instance.prisma.membership.delete({
          where: { userId_role: { userId: id, role: parsedRole } },
        });
        return reply.code(204).send();
      }
    );
  });
}
