import type { Metadata } from "next";
import Link from "next/link";
import { getApiClient } from "../../lib/api";

// Live catalog data -- not statically prerendered. We self-host on a
// persistently-running Node server (no serverless/ISR infra, see
// CLAUDE.md), so request-time rendering is the natural fit; it also avoids
// needing core-api reachable at build time (CI builds without a backend).
export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const metadata: Metadata = {
  title: "Apps",
  description: "Browse every UnstuckLabs tool — small, focused, and sold on its own.",
};

function formatPrice(priceCents: number, currency: string, pricingModel: string) {
  const amount = (priceCents / 100).toLocaleString("en-US", { style: "currency", currency });
  return pricingModel === "RECURRING" ? `${amount}/mo` : amount;
}

export default async function AppsPage() {
  const { products } = await getApiClient().products.list();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold text-foreground">Apps</h1>
      <p className="mt-2 text-foreground/70">Every tool is sold on its own — pick the one that solves your problem.</p>

      {products.length === 0 ? (
        <p className="mt-10 text-foreground/70">No apps are live yet — check back soon.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {products.map((product) => {
            const cover = product.media?.find((item) => item.type === "IMAGE");
            return (
              <Link
                key={product.id}
                href={`/apps/${product.slug}`}
                className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-md transition-shadow duration-200 ease-out hover:shadow-lg"
              >
                {cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${API_URL}${cover.url}`}
                    alt={`${product.name} cover`}
                    className="h-40 w-full object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="font-semibold text-foreground">{product.name}</h2>
                  <p className="mt-2 flex-1 text-sm text-foreground/70">{product.description}</p>
                  <p className="mt-4 font-semibold text-primary">
                    {formatPrice(product.priceCents, product.currency, product.pricingModel)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
