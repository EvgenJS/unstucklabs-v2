"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@unstucklabs/ui";
import type { Product, ProductInput } from "@unstucklabs/sdk";
import { useAuth } from "../../../lib/auth-context";
import { getApiClient } from "../../../lib/api";
import { ProductForm } from "../../../components/ProductForm";

function formatPrice(priceCents: number, currency: string) {
  return (priceCents / 100).toLocaleString("en-US", { style: "currency", currency });
}

export default function ProductsPage() {
  const { accessToken, user } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [forbidden, setForbidden] = useState(false);

  // Mirrors core-api's requireRole("OWNER", "EDITOR") gate on the write
  // routes -- this only controls whether the buttons are shown; the actual
  // enforcement is server-side, so a SUPPORT user hitting the API directly
  // still gets 403.
  const canEdit = user?.roles?.some((r) => r === "OWNER" || r === "EDITOR");

  async function refresh() {
    if (!accessToken) return;
    try {
      const { products } = await getApiClient(accessToken).products.admin.list();
      setProducts(products);
    } catch {
      // Products admin routes have no SUPPORT read access (unlike
      // Blog/Subscriptions/Users) -- the Sidebar hides this link for
      // SUPPORT-only users, but handle a direct/deep link gracefully too.
      setForbidden(true);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function handleCreate(input: ProductInput) {
    if (!accessToken) return;
    await getApiClient(accessToken).products.admin.create(input);
    setEditing(null);
    await refresh();
  }

  async function handleUpdate(id: string, input: ProductInput) {
    if (!accessToken) return;
    await getApiClient(accessToken).products.admin.update(id, input);
    setEditing(null);
    await refresh();
  }

  async function toggleActive(product: Product) {
    if (!accessToken) return;
    await getApiClient(accessToken).products.admin.update(product.id, { isActive: !product.isActive });
    await refresh();
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await getApiClient(accessToken).products.admin.remove(id);
    await refresh();
  }

  if (forbidden) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <p className="mt-4 text-foreground/70">You don&apos;t have access to view products.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        {canEdit && editing === null && <Button onClick={() => setEditing("new")}>New product</Button>}
      </div>

      {editing === "new" && (
        <div className="mt-6">
          <ProductForm onSubmit={handleCreate} onCancel={() => setEditing(null)} />
        </div>
      )}
      {editing && editing !== "new" && (
        <div className="mt-6">
          <ProductForm
            initial={editing}
            onSubmit={(input) => handleUpdate(editing.id, input)}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {products === null ? (
          <p className="text-foreground/70">Loading…</p>
        ) : products.length === 0 ? (
          <p className="text-foreground/70">No products yet.</p>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">
                  {product.name}{" "}
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground/60">
                    {product.isActive ? "Active" : "Inactive"}
                  </span>
                </p>
                <p className="text-sm text-foreground/70">
                  {product.slug} · {formatPrice(product.priceCents, product.currency)}
                  {product.pricingModel === "RECURRING" ? "/mo" : ""}
                </p>
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setEditing(product)}>
                    Edit
                  </Button>
                  <Button variant="secondary" onClick={() => toggleActive(product)}>
                    {product.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="secondary" onClick={() => handleDelete(product.id)}>
                    Delete
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
