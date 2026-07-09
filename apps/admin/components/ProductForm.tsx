"use client";

import { useState, type FormEvent } from "react";
import { Button, Input } from "@unstucklabs/ui";
import type { Product, ProductInput } from "@unstucklabs/sdk";

interface Props {
  initial?: Product;
  onSubmit: (input: ProductInput) => Promise<void>;
  onCancel: () => void;
}

export function ProductForm({ initial, onSubmit, onCancel }: Props) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [subdomain, setSubdomain] = useState(initial?.subdomain ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [pricingModel, setPricingModel] = useState<ProductInput["pricingModel"]>(
    initial?.pricingModel ?? "ONE_TIME"
  );
  const [priceCents, setPriceCents] = useState(String(initial ? initial.priceCents / 100 : ""));
  const [annualPriceCents, setAnnualPriceCents] = useState(
    initial?.annualPriceCents != null ? String(initial.annualPriceCents / 100) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        slug,
        name,
        subdomain: subdomain || undefined,
        tagline: tagline || undefined,
        description: description || undefined,
        pricingModel,
        priceCents: Math.round(Number(priceCents) * 100),
        annualPriceCents: annualPriceCents ? Math.round(Number(annualPriceCents) * 100) : null,
      });
    } catch {
      setError("Could not save -- check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-white p-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Name</label>
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Slug</label>
          <Input required value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Subdomain</label>
          <Input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Price (USD)</label>
          <Input
            type="number"
            step="0.01"
            required
            value={priceCents}
            onChange={(e) => setPriceCents(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Annual price (USD, optional)</label>
          <Input
            type="number"
            step="0.01"
            value={annualPriceCents}
            onChange={(e) => setAnnualPriceCents(e.target.value)}
            placeholder="Leave blank for no annual option"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Pricing model</label>
          <select
            value={pricingModel}
            onChange={(e) => setPricingModel(e.target.value as ProductInput["pricingModel"])}
            className="w-full rounded-lg border border-border px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ONE_TIME">One-time</option>
            <option value="RECURRING">Recurring</option>
            <option value="FREEMIUM">Freemium</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Tagline <span className="font-normal text-foreground/50">(short, shown on catalog/teaser cards)</span>
        </label>
        <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="An app for…" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Description <span className="font-normal text-foreground/50">(long-form, markdown, product page)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={10}
          className="w-full rounded-lg border border-border px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
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
