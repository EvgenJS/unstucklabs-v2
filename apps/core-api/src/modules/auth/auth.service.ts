import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import { createEmailService } from "../email/email.service.js";

export class EmailAlreadyRegisteredError extends Error {}
export class InvalidCredentialsError extends Error {}
export class InvalidRefreshTokenError extends Error {}
export class EmailNotVerifiedError extends Error {}
export class InvalidVerificationTokenError extends Error {}

const STORE_URL = process.env.STORE_URL ?? "http://localhost:3000";
const VERIFICATION_TOKEN_HOURS = Number(process.env.EMAIL_VERIFICATION_TOKEN_HOURS ?? 24);

function verificationEmailHtml(verifyUrl: string): string {
  return `
    <p>Welcome to UnstuckLabs — one more step.</p>
    <p><a href="${verifyUrl}">Verify your email</a> to activate your account. This link expires in ${VERIFICATION_TOKEN_HOURS} hours.</p>
    <p>If you didn't create this account, you can ignore this email.</p>
  `;
}

export function createAuthService(prisma: PrismaClient) {
  const emailService = createEmailService();

  async function sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${STORE_URL}/verify-email?token=${token}`;
    await emailService.sendTransactional(email, "Verify your email", verificationEmailHtml(verifyUrl));
  }

  return {
    async register(email: string, password: string) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw new EmailAlreadyRegisteredError();

      const passwordHash = await hashPassword(password);
      const token = randomBytes(32).toString("hex");
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          emailVerificationToken: token,
          emailVerificationExpires: new Date(Date.now() + VERIFICATION_TOKEN_HOURS * 60 * 60 * 1000),
        },
      });

      await sendVerificationEmail(user.email, token);

      // Deliberately no accessToken/refreshToken -- registration no longer
      // implies a session. The caller (auth.routes.ts) skips setting the
      // refresh cookie when accessToken is null.
      return { user, accessToken: null as string | null };
    },

    async login(email: string, password: string) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new InvalidCredentialsError();

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) throw new InvalidCredentialsError();

      // Checked after the password, not before -- a wrong password should
      // never reveal (via a different error) that an email is merely
      // unverified rather than nonexistent.
      if (!user.isEmailVerified) throw new EmailNotVerifiedError();

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

    async verifyEmail(token: string) {
      const user = await prisma.user.findFirst({ where: { emailVerificationToken: token } });
      if (!user || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
        throw new InvalidVerificationTokenError();
      }

      const verified = await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
          lastSeenAt: new Date(),
        },
      });

      // Verifying auto-logs the user in -- one click from the email gets
      // them straight to a working session, same as v1's flow.
      return {
        user: verified,
        accessToken: signAccessToken(verified.id),
        refreshToken: signRefreshToken(verified.id),
      };
    },

    async resendVerification(email: string) {
      const user = await prisma.user.findUnique({ where: { email } });
      // Silent no-op if the account doesn't exist or is already verified --
      // the route always returns the same generic response either way, so
      // this endpoint can't be used to enumerate registered emails.
      if (!user || user.isEmailVerified) return;

      const token = randomBytes(32).toString("hex");
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: token,
          emailVerificationExpires: new Date(Date.now() + VERIFICATION_TOKEN_HOURS * 60 * 60 * 1000),
        },
      });

      await sendVerificationEmail(user.email, token);
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
