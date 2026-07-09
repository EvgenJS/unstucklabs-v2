"use client";

import { useState, type FormEvent } from "react";
import { Button, Input } from "@unstucklabs/ui";
import { getApiClient } from "../lib/api";

interface WaitlistFormProps {
  source: string;
  className?: string;
  // "row" (default) puts the input and button side by side at the `sm`
  // breakpoint -- fine in wide contexts (hero, centered CTA), but inside a
  // narrow footer grid column it squeezes the email input down to a few
  // visible characters. "stacked" keeps input and button on separate lines
  // at every width.
  layout?: "row" | "stacked";
}

export function WaitlistForm({ source, className = "", layout = "row" }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    try {
      await getApiClient().waitlist.subscribe(email, source);
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return <p className={`font-medium text-primary ${className}`}>You&apos;re on the list — we&apos;ll be in touch.</p>;
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className={`flex flex-col gap-3 ${layout === "row" ? "sm:flex-row" : ""}`}>
        <label htmlFor={`waitlist-email-${source}`} className="sr-only">
          Email address
        </label>
        <Input
          id={`waitlist-email-${source}`}
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={layout === "row" ? "sm:flex-1" : ""}
        />
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Joining…" : "Join the waitlist"}
        </Button>
      </form>
      {status === "error" && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          Something went wrong, please try again.
        </p>
      )}
    </div>
  );
}
