import Link from "next/link";
import type { Product } from "@unstucklabs/sdk";
import { getApiClient } from "../../lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Matches the 3:2 aspect ratio the marketing banners are generated at
// (2528x1696) -- keeps the whole banner visible (headline, tagline, CTA)
// instead of cropping it into a short rectangle.
const COVER_ASPECT = "aspect-[3/2]";

export async function AppPreview() {
  let products: Product[] = [];

  try {
    const { products: fetched } = await getApiClient().products.list();
    products = fetched.slice(0, 4);
  } catch {
    products = [];
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">The apps</h2>
        <Link href="/apps" className="text-sm font-semibold text-primary hover:text-primary/80">
          See all apps →
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-6 text-foreground/70">More tools are on the way — join the waitlist above to hear first.</p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {products.map((product) => {
            const cover = product.media?.find((item) => item.type === "IMAGE");
            return (
              <Link
                key={product.id}
                href={`/apps/${product.slug}`}
                className="block overflow-hidden rounded-xl bg-white shadow-md transition-shadow duration-200 ease-out hover:shadow-lg"
              >
                {cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${API_URL}${cover.url}`}
                    alt={`${product.name} cover`}
                    className={`${COVER_ASPECT} w-full object-cover`}
                  />
                )}
                <div className="p-4">
                  <h3 className="text-center font-semibold text-foreground">{product.name}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
