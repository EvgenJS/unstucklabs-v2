"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@unstucklabs/ui";
import { useAuth } from "../lib/auth-context";
import { getApiClient } from "../lib/api";

interface Props {
  productId: string;
  productSlug: string;
  priceCents: number;
  annualPriceCents?: number | null;
  currency: string;
}

function formatPrice(priceCents: number, currency: string) {
  return (priceCents / 100).toLocaleString("en-US", { style: "currency", currency });
}

export function CheckoutButton({ productId, productSlug, priceCents, annualPriceCents, currency }: Props) {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [billingPeriod, setBillingPeriod] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountedPriceCents: number } | null>(null);
  const [promoStatus, setPromoStatus] = useState<"idle" | "checking" | "error">("idle");
  const [promoError, setPromoError] = useState<string | null>(null);

  const activePriceCents = billingPeriod === "ANNUAL" && annualPriceCents ? annualPriceCents : priceCents;

  if (loading) return null;

  if (!user) {
    return (
      <Button onClick={() => router.push(`/login?redirect=/apps/${productSlug}`)}>Log in to get started</Button>
    );
  }

  async function handleApplyPromo() {
    if (!promoInput.trim()) return;
    setPromoStatus("checking");
    setPromoError(null);
    try {
      const result = await getApiClient(accessToken ?? undefined).promoCodes.validate(productId, promoInput.trim());
      if (result.valid && result.discountedPriceCents !== undefined) {
        setAppliedPromo({ code: promoInput.trim(), discountedPriceCents: result.discountedPriceCents });
        setPromoStatus("idle");
      } else {
        setAppliedPromo(null);
        setPromoError(result.reason ?? "Invalid promo code");
        setPromoStatus("error");
      }
    } catch {
      setAppliedPromo(null);
      setPromoError("Could not check that code, please try again.");
      setPromoStatus("error");
    }
  }

  async function handleCheckout() {
    setStatus("loading");
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const { redirectUrl } = await getApiClient(accessToken ?? undefined).payments.createCheckoutSession({
        productId,
        successUrl: `${siteUrl}/account`,
        cancelUrl: `${siteUrl}/apps/${productSlug}`,
        promoCode: appliedPromo?.code,
        billingPeriod,
      });
      window.location.href = redirectUrl;
    } catch {
      setStatus("error");
    }
  }

  function selectBillingPeriod(period: "MONTHLY" | "ANNUAL") {
    setBillingPeriod(period);
    setAppliedPromo(null);
  }

  return (
    <div>
      {annualPriceCents && (
        <div className="mb-4 inline-flex rounded-lg border border-border p-1">
          <button
            type="button"
            onClick={() => selectBillingPeriod("MONTHLY")}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              billingPeriod === "MONTHLY" ? "bg-primary text-on-primary" : "text-foreground/70"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => selectBillingPeriod("ANNUAL")}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              billingPeriod === "ANNUAL" ? "bg-primary text-on-primary" : "text-foreground/70"
            }`}
          >
            Annual — save {Math.round((1 - annualPriceCents / (priceCents * 12)) * 100)}%
          </button>
        </div>
      )}

      <p className="mb-4 text-lg font-semibold text-foreground">
        {formatPrice(activePriceCents, currency)}
        {billingPeriod === "ANNUAL" ? "/yr" : "/mo"}
      </p>

      {appliedPromo && (
        <p className="mb-3 text-sm text-foreground/70">
          <span className="line-through">{formatPrice(activePriceCents, currency)}</span>{" "}
          <span className="font-semibold text-primary">{formatPrice(appliedPromo.discountedPriceCents, currency)}</span>{" "}
          with code {appliedPromo.code}
        </p>
      )}

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Promo code"
          value={promoInput}
          onChange={(e) => setPromoInput(e.target.value)}
          className="max-w-[200px]"
        />
        <Button type="button" variant="secondary" onClick={handleApplyPromo} disabled={promoStatus === "checking"}>
          {promoStatus === "checking" ? "Checking…" : "Apply"}
        </Button>
      </div>
      {promoError && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {promoError}
        </p>
      )}

      <Button onClick={handleCheckout} disabled={status === "loading"}>
        {status === "loading" ? "Redirecting…" : "Get started"}
      </Button>
      {status === "error" && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          Something went wrong, please try again.
        </p>
      )}
    </div>
  );
}
