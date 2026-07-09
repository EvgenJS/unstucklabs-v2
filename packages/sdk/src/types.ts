// Lightweight response shapes mirroring core-api's JSON output. Deliberately
// not imported from @prisma/client -- the SDK is consumed by browser bundles
// (store, mini-apps) and must never pull in server-only Prisma types/deps.

export interface ProductMedia {
  id: string;
  productId: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  position: number;
  createdAt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subdomain: string | null;
  description: string | null;
  pricingModel: "ONE_TIME" | "RECURRING" | "FREEMIUM";
  priceCents: number;
  annualPriceCents: number | null;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  media?: ProductMedia[];
}

export interface PromoCode {
  id: string;
  code: string;
  productId: string;
  product?: Product;
  discountPercent: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
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
  billingPeriod: "MONTHLY" | "ANNUAL";
  createdAt: string;
  product: Product;
  user?: { id: string; email: string };
}

export interface CheckoutSessionResult {
  redirectUrl: string;
  providerSessionId: string;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  createdAt: string;
  lastSeenAt: string;
  memberships: Array<{ role: "OWNER" | "EDITOR" | "SUPPORT" }>;
  _count: { subscriptions: number };
}

export interface AdminUserDetail {
  id: string;
  email: string;
  createdAt: string;
  lastSeenAt: string;
  memberships: Array<{ id: string; role: "OWNER" | "EDITOR" | "SUPPORT" }>;
  subscriptions: Subscription[];
}

export interface AppRequest {
  id: string;
  email: string;
  description: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  email: string;
  message: string;
  createdAt: string;
}
