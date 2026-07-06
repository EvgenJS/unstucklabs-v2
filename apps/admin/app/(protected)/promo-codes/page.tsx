"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@unstucklabs/ui";
import type { Product, PromoCode, PromoCodeInput } from "@unstucklabs/sdk";
import { useAuth } from "../../../lib/auth-context";
import { getApiClient } from "../../../lib/api";
import { PromoCodeForm } from "../../../components/PromoCodeForm";

export default function PromoCodesPage() {
  const { accessToken } = useAuth();
  const [promoCodes, setPromoCodes] = useState<PromoCode[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [creating, setCreating] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  async function refresh() {
    if (!accessToken) return;
    try {
      const [{ promoCodes }, { products }] = await Promise.all([
        getApiClient(accessToken).promoCodes.admin.list(),
        getApiClient(accessToken).products.admin.list(),
      ]);
      setPromoCodes(promoCodes);
      setProducts(products);
    } catch {
      // Promo codes are pricing-related, gated the same as Products (no
      // SUPPORT read access) -- Sidebar hides this link for SUPPORT-only
      // users, but handle a direct link gracefully too.
      setForbidden(true);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function handleCreate(input: PromoCodeInput) {
    if (!accessToken) return;
    await getApiClient(accessToken).promoCodes.admin.create(input);
    setCreating(false);
    await refresh();
  }

  async function toggleActive(promoCode: PromoCode) {
    if (!accessToken) return;
    await getApiClient(accessToken).promoCodes.admin.update(promoCode.id, { isActive: !promoCode.isActive });
    await refresh();
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    if (!confirm("Delete this promo code? This cannot be undone.")) return;
    await getApiClient(accessToken).promoCodes.admin.remove(id);
    await refresh();
  }

  if (forbidden) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground">Promo Codes</h1>
        <p className="mt-4 text-foreground/70">You don&apos;t have access to view promo codes.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Promo Codes</h1>
        {!creating && products.length > 0 && <Button onClick={() => setCreating(true)}>New promo code</Button>}
      </div>

      {creating && (
        <div className="mt-6">
          <PromoCodeForm products={products} onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {promoCodes === null ? (
          <p className="text-foreground/70">Loading…</p>
        ) : promoCodes.length === 0 ? (
          <p className="text-foreground/70">No promo codes yet.</p>
        ) : (
          promoCodes.map((promoCode) => (
            <Card key={promoCode.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">
                  {promoCode.code}{" "}
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground/60">
                    {promoCode.isActive ? "Active" : "Inactive"}
                  </span>
                </p>
                <p className="text-sm text-foreground/70">
                  {promoCode.product?.name} · -{promoCode.discountPercent}% ·{" "}
                  {promoCode.usedCount}
                  {promoCode.maxUses !== null ? `/${promoCode.maxUses}` : ""} used
                  {promoCode.expiresAt
                    ? ` · expires ${new Date(promoCode.expiresAt).toLocaleDateString("en-US")}`
                    : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => toggleActive(promoCode)}>
                  {promoCode.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="secondary" onClick={() => handleDelete(promoCode.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
