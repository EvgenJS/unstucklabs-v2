// Lightweight response shapes mirroring core-api's JSON output. Deliberately
// not imported from @prisma/client -- the SDK is consumed by browser bundles
// (store, mini-apps) and must never pull in server-only Prisma types/deps.

export interface Product {
  id: string;
  slug: string;
  name: string;
  subdomain: string | null;
  description: string | null;
  pricingModel: "ONE_TIME" | "RECURRING" | "FREEMIUM";
  priceCents: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
}

export interface BlogPost extends BlogPostSummary {
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
  roles?: Array<"OWNER" | "EDITOR" | "SUPPORT">;
}

export interface Subscription {
  id: string;
  userId: string;
  productId: string;
  status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "EXPIRED" | "TRIALING";
  currentPeriodEnd: string | null;
  createdAt: string;
  product: Product;
}

export interface CheckoutSessionResult {
  redirectUrl: string;
  providerSessionId: string;
}
