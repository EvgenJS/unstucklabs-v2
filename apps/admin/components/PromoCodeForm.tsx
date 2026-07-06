"use client";

import { useState, type FormEvent } from "react";
import { Button, Input } from "@unstucklabs/ui";
import type { Product, PromoCodeInput } from "@unstucklabs/sdk";

interface Props {
  products: Product[];
  onSubmit: (input: PromoCodeInput) => Promise<void>;
  onCancel: () => void;
}

export function PromoCodeForm({ products, onSubmit, onCancel }: Props) {
  const [code, setCode] = useState("");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        code,
        productId,
        discountPercent: Number(discountPercent),
        maxUses: maxUses ? Number(maxUses) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
    } catch {
      setError("Could not save -- check the fields and try again (codes must be unique).");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-white p-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Code</label>
          <Input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Product</label>
          <select
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded-lg border border-border px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Discount %</label>
          <Input
            type="number"
            min={1}
            max={100}
            required
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Max uses (optional)</label>
          <Input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Expires (optional)</label>
          <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
