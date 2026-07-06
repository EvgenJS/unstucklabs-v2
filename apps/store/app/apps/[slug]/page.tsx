import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError } from "@unstucklabs/sdk";
import { getApiClient } from "../../../lib/api";
import { CheckoutButton } from "../../../components/CheckoutButton";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  try {
    const { product } = await getApiClient().products.get(slug);
    return product;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.description ?? undefined,
  };
}

function formatPrice(priceCents: number, currency: string, pricingModel: string) {
  const amount = (priceCents / 100).toLocaleString("en-US", { style: "currency", currency });
  return pricingModel === "RECURRING" ? `${amount}/mo` : amount;
}

export default async function AppDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
      <p className="mt-4 text-lg text-foreground/70">{product.description}</p>
      <p className="mt-6 text-2xl font-bold text-primary">
        {formatPrice(product.priceCents, product.currency, product.pricingModel)}
      </p>
      <div className="mt-8">
        <CheckoutButton productId={product.id} productSlug={product.slug} />
      </div>
    </div>
  );
}
