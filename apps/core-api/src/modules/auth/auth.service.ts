import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import { createEmailService } from "../email/email.service.js";
import { renderEmailHtml } from "../email/email-template.js";

export class EmailAlreadyRegisteredError extends Error {}
export class InvalidCredentialsError extends Error {}
export class InvalidRefreshTokenError extends Error {}
export class EmailNotVerifiedError extends Error {}
export class InvalidVerificationTokenError extends Error {}
export class InvalidResetTokenError extends Error {}

const STORE_URL = process.env.STORE_URL ?? "http://localhost:3000";
const VERIFICATION_TOKEN_HOURS = Number(process.env.EMAIL_VERIFICATION_TOKEN_HOURS ?? 24);
const PASSWORD_RESET_TOKEN_HOURS = Number(process.env.PASSWORD_RESET_TOKEN_HOURS ?? 1);

function verificationEmailHtml(verifyUrl: string): string {
  return renderEmailHtml({
    preheader: "One click and you're in.",
    heading: "Welcome to UnstuckLabs",
    bodyHtml: `
      <p style="margin: 0 0 12px;">You're one step away from getting unstuck. Verify your email to activate your account.</p>
      <p style="margin: 0;">This link expires in ${VERIFICATION_TOKEN_HOURS} hours. If you didn't create this account, you can safely ignore this email.</p>
    `,
    ctaText: "Verify your email",
    ctaUrl: verifyUrl,
  });
}

function passwordResetEmailHtml(resetUrl: string): string {
  return renderEmailHtml({
    preheader: "Reset your UnstuckLabs password.",
    heading: "Reset your password",
    bodyHtml: `
      <p style="margin: 0 0 12px;">Someone requested a password reset for your UnstuckLabs account.</p>
      <p style="margin: 0;">This link expires in ${PASSWORD_RESET_TOKEN_HOURS} hour${PASSWORD_RESET_TOKEN_HOURS === 1 ? "" : "s"}. If you didn't request this, you can ignore this email — your password won't change.</p>
    `,
    ctaText: "Reset your password",
    ctaUrl: resetUrl,
  });
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
        refreshToken: signRefreshToken(user.id, user.tokenVersion),
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
        refreshToken: signRefreshToken(verified.id, verified.tokenVersion),
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

    async forgotPassword(email: string) {
      const user = await prisma.user.findUnique({ where: { email } });
      // Silent no-op if the account doesn't exist -- same anti-enumeration
      // shape as resendVerification above, the route always returns the
      // same generic response either way.
      if (!user) return;

      const token = randomBytes(32).toString("hex");
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: token,
          passwordResetExpires: new Date(Date.now() + PASSWORD_RESET_TOKEN_HOURS * 60 * 60 * 1000),
        },
      });

      const resetUrl = `${STORE_URL}/reset-password?token=${token}`;
      await emailService.sendTransactional(user.email, "Reset your password", passwordResetEmailHtml(resetUrl));
    },

    async resetPassword(token: string, newPassword: string) {
      const user = await prisma.user.findFirst({ where: { passwordResetToken: token } });
      if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        throw new InvalidResetTokenError();
      }

      const passwordHash = await hashPassword(newPassword);
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpires: null,
          // A password reset is exactly the moment any existing session
          // (including one an attacker might already hold) should stop
          // working -- same tokenVersion bump as an explicit logout.
          tokenVersion: { increment: 1 },
          lastSeenAt: new Date(),
        },
      });

      // Resetting auto-logs the user in -- one click from the email gets
      // them straight to a working session, same UX as verifyEmail above.
      return {
        user: updated,
        accessToken: signAccessToken(updated.id),
        refreshToken: signRefreshToken(updated.id, updated.tokenVersion),
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

      // Rejects a token that's structurally valid (correct signature, not
      // expired) but was issued before the user's last logout -- the
      // server-side revocation check. See schema.prisma's tokenVersion
      // comment.
      if (payload.tokenVersion !== user.tokenVersion) {
        throw new InvalidRefreshTokenError();
      }

      return {
        user,
        accessToken: signAccessToken(user.id),
        refreshToken: signRefreshToken(user.id, user.tokenVersion),
      };
    },

    // Best-effort: called with whatever refresh token cookie is present,
    // even an expired/near-expired one, since the whole point is to make
    // sure that exact token (and any other copy of it) stops working. If
    // the token doesn't verify at all, there's no session to invalidate --
    // the route clears the cookie either way.
    async invalidateSessions(refreshToken: string) {
      let payload;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch {
        return;
      }

      await prisma.user.update({
        where: { id: payload.sub },
        data: { tokenVersion: { increment: 1 } },
      });
    },

    async me(userId: string) {
      return prisma.user.findUnique({
        where: { id: userId },
        include: { memberships: true },
      });
    },
  };
}
