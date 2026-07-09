import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ApiError } from "@unstucklabs/sdk";
import { getApiClient } from "../../../lib/api";
import { CheckoutButton } from "../../../components/CheckoutButton";

interface Props {
  params: Promise<{ slug: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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

export default async function AppDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const media = product.media ?? [];

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>

      {media.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((item) =>
            item.type === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={item.id}
                src={`${API_URL}${item.url}`}
                alt={`${product.name} screenshot`}
                className="h-32 w-full rounded-lg object-cover"
              />
            ) : (
              <video key={item.id} src={`${API_URL}${item.url}`} className="h-32 w-full rounded-lg object-cover" controls />
            )
          )}
        </div>
      )}

      {product.description && (
        <div className="prose prose-neutral mt-6 max-w-none prose-headings:font-bold prose-a:text-primary">
          <ReactMarkdown>{product.description}</ReactMarkdown>
        </div>
      )}

      <div className="mt-8">
        <CheckoutButton
          productId={product.id}
          productSlug={product.slug}
          priceCents={product.priceCents}
          annualPriceCents={product.annualPriceCents}
          currency={product.currency}
        />
      </div>
    </div>
  );
}
