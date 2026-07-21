-- CreateEnum
CREATE TYPE "ManualPaymentRequestStatus" AS ENUM ('PENDING', 'FULFILLED', 'CANCELED');

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "renewalReminderSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "manual_payment_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "billingPeriod" "BillingPeriod" NOT NULL,
    "promoCode" TEXT,
    "status" "ManualPaymentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_payment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manual_payment_requests_userId_productId_idx" ON "manual_payment_requests"("userId", "productId");

-- AddForeignKey
ALTER TABLE "manual_payment_requests" ADD CONSTRAINT "manual_payment_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_payment_requests" ADD CONSTRAINT "manual_payment_requests_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
