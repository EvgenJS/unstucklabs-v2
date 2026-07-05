// Every payment-provider-specific detail lives behind this interface.
// WesternBid's exact webhook/checkout payload shape is not yet known (API
// key is pending a support ticket) -- nothing outside providers/*.ts should
// ever reference WesternBid specifics directly.

export interface CheckoutSessionParams {
  userId: string;
  productId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  redirectUrl: string;
  providerSessionId: string;
}

export type WebhookEventType =
  | "purchase.completed"
  | "subscription.canceled"
  | "subscription.renewed"
  | "refund.issued";

export interface WebhookEvent {
  type: WebhookEventType;
  userId?: string;
  productId?: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  providerTransactionId?: string;
  raw: unknown;
}

export interface PaymentProvider {
  name: string;
  createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult>;
  verifyAndParseWebhook(rawBody: Buffer, headers: Record<string, string>): Promise<WebhookEvent>;
}
