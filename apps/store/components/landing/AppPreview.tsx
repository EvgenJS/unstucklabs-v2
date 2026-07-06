import Link from "next/link";
import { Card } from "@unstucklabs/ui";
import type { Product } from "@unstucklabs/sdk";
import { getApiClient } from "../../lib/api";

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
          {products.map((product) => (
            <Link key={product.id} href={`/apps/${product.slug}`}>
              <Card>
                <h3 className="font-semibold text-foreground">{product.name}</h3>
                <p className="mt-2 text-sm text-foreground/70">{product.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
