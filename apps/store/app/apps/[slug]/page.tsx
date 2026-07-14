import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ApiError } from "@unstucklabs/sdk";
import { getApiClient } from "../../../lib/api";
import { stripMarkdown, toMetaDescription } from "../../../lib/markdown";
import { CheckoutButton } from "../../../components/CheckoutButton";

interface Props {
  params: Promise<{ slug: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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

  const coverUrl = product.media?.find((item) => item.type === "IMAGE")?.url;
  const images = coverUrl ? [`${API_URL}${coverUrl}`] : undefined;
  const description = product.description ? toMetaDescription(product.description) : undefined;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/apps/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images,
    },
  };
}

export default async function AppDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const media = product.media ?? [];

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ? stripMarkdown(product.description) : (product.tagline ?? undefined),
    image: media.filter((item) => item.type === "IMAGE").map((item) => `${API_URL}${item.url}`),
    brand: { "@type": "Brand", name: "UnstuckLabs" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/apps/${product.slug}`,
      priceCurrency: product.currency,
      price: (product.priceCents / 100).toFixed(2),
      availability: product.isActive ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>

      {media.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((item) =>
            item.type === "IMAGE" ? (
              <div key={item.id} className="relative h-32 w-full overflow-hidden rounded-lg">
                <Image
                  src={`${API_URL}${item.url}`}
                  alt={`${product.name} screenshot`}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
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
