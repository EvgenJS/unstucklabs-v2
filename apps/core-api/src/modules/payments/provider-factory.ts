import type { PaymentProvider } from "./payment-provider.interface.js";
import { createNullPaymentProvider } from "./providers/null-provider.js";

// Only the null provider exists until WesternBid API access is granted (see
// docs/ROADMAP.md External Blocking Dependencies). Add a "westernbid" case
// here once providers/westernbid-provider.ts exists -- nothing else in the
// app needs to change.
export function getActivePaymentProvider(): PaymentProvider {
  const configured = process.env.PAYMENT_PROVIDER ?? "null";

  switch (configured) {
    case "null":
      return createNullPaymentProvider();
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER: ${configured}`);
  }
}
