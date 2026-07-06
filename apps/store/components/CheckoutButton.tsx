"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@unstucklabs/ui";
import { useAuth } from "../lib/auth-context";
import { getApiClient } from "../lib/api";

export function CheckoutButton({ productId, productSlug }: { productId: string; productSlug: string }) {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  if (loading) return null;

  if (!user) {
    return (
      <Button onClick={() => router.push(`/login?redirect=/apps/${productSlug}`)}>Log in to get started</Button>
    );
  }

  async function handleCheckout() {
    setStatus("loading");
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const { redirectUrl } = await getApiClient(accessToken ?? undefined).payments.createCheckoutSession({
        productId,
        successUrl: `${siteUrl}/account`,
        cancelUrl: `${siteUrl}/apps/${productSlug}`,
      });
      window.location.href = redirectUrl;
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
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
