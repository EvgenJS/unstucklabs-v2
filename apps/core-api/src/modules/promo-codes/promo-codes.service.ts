import type { PrismaClient } from "@prisma/client";

export type PromoCodeValidationResult =
  | { valid: true; promoCode: { id: string; discountPercent: number } }
  | { valid: false; reason: string };

// Read-only check -- used by both the public /promo-codes/validate endpoint
// (so the Store can show the discounted price before checkout) and the
// checkout endpoint itself (which re-validates server-side rather than
// trusting a client-computed discount, then calls redeemPromoCode below).
export async function validatePromoCode(
  prisma: PrismaClient,
  params: { productId: string; code: string; userId: string }
): Promise<PromoCodeValidationResult> {
  const promoCode = await prisma.promoCode.findUnique({
    where: { code: params.code.toUpperCase() },
  });

  if (!promoCode || promoCode.productId !== params.productId) {
    return { valid: false, reason: "Invalid promo code" };
  }
  if (!promoCode.isActive) {
    return { valid: false, reason: "This promo code is no longer active" };
  }
  if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
    return { valid: false, reason: "This promo code has expired" };
  }
  if (promoCode.maxUses !== null && promoCode.usedCount >= promoCode.maxUses) {
    return { valid: false, reason: "This promo code has reached its usage limit" };
  }

  const existingRedemption = await prisma.promoCodeRedemption.findUnique({
    where: { promoCodeId_userId: { promoCodeId: promoCode.id, userId: params.userId } },
  });
  if (existingRedemption) {
    return { valid: false, reason: "You've already used this promo code" };
  }

  return { valid: true, promoCode: { id: promoCode.id, discountPercent: promoCode.discountPercent } };
}

// Atomically consumes one use: increments usedCount only if still under
// maxUses, and records the per-user redemption, all inside one transaction
// so a maxUses race or a duplicate-user race both roll back cleanly instead
// of leaving usedCount incremented with no matching redemption (or vice
// versa). Called at checkout-session creation time -- see docs/ROADMAP.md
// for why this isn't deferred to webhook confirmation.
export async function redeemPromoCode(prisma: PrismaClient, promoCodeId: string, userId: string): Promise<boolean> {
  const promoCode = await prisma.promoCode.findUnique({ where: { id: promoCodeId } });
  if (!promoCode) return false;

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.promoCode.updateMany({
        where: {
          id: promoCodeId,
          ...(promoCode.maxUses !== null ? { usedCount: { lt: promoCode.maxUses } } : {}),
        },
        data: { usedCount: { increment: 1 } },
      });

      if (updated.count === 0) {
        throw new Error("MAX_USES_REACHED");
      }

      await tx.promoCodeRedemption.create({ data: { promoCodeId, userId } });
    });
    return true;
  } catch {
    return false;
  }
}
