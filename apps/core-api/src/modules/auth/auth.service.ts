import type { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";

export class EmailAlreadyRegisteredError extends Error {}
export class InvalidCredentialsError extends Error {}
export class InvalidRefreshTokenError extends Error {}

export function createAuthService(prisma: PrismaClient) {
  return {
    async register(email: string, password: string) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw new EmailAlreadyRegisteredError();

      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: { email, passwordHash },
      });

      return {
        user,
        accessToken: signAccessToken(user.id),
        refreshToken: signRefreshToken(user.id),
      };
    },

    async login(email: string, password: string) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new InvalidCredentialsError();

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) throw new InvalidCredentialsError();

      await prisma.user.update({
        where: { id: user.id },
        data: { lastSeenAt: new Date() },
      });

      return {
        user,
        accessToken: signAccessToken(user.id),
        refreshToken: signRefreshToken(user.id),
      };
    },

    async refresh(refreshToken: string) {
      let payload;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch {
        throw new InvalidRefreshTokenError();
      }

      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new InvalidRefreshTokenError();

      return {
        user,
        accessToken: signAccessToken(user.id),
        refreshToken: signRefreshToken(user.id),
      };
    },

    async me(userId: string) {
      return prisma.user.findUnique({
        where: { id: userId },
        include: { memberships: true },
      });
    },
  };
}
