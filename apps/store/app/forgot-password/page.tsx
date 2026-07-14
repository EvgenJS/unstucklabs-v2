"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Input } from "@unstucklabs/ui";
import { getApiClient } from "../../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    try {
      await getApiClient().auth.forgotPassword(email);
    } catch {
      // Deliberately ignored -- the backend always returns the same
      // generic response regardless of outcome (anti-enumeration), so
      // there's nothing meaningfully different to show on failure either.
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Check your inbox</h1>
        <p className="mt-4 text-sm text-foreground/70">
          If an account exists for <span className="font-medium text-foreground">{email}</span>, we&apos;ve sent a
          password reset link.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-primary hover:text-primary/80">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-bold text-foreground">Forgot password</h1>
      <p className="mt-2 text-sm text-foreground/70">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
            Email
          </label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" disabled={status === "sending"} className="w-full">
          {status === "sending" ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-foreground/70">
        <Link href="/login" className="font-semibold text-primary hover:text-primary/80">
          Back to login
        </Link>
      </p>
    </div>
  );
}
