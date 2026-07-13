"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input } from "@unstucklabs/ui";
import { useAuth } from "../../lib/auth-context";
import { getApiClient } from "../../lib/api";

type Status = "verifying" | "success" | "error";

function VerifyEmailContent() {
  const { verifyEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("verifying");
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    verifyEmail(token)
      .then(() => {
        setStatus("success");
        setTimeout(() => router.push("/account"), 1500);
      })
      .catch(() => setStatus("error"));
    // Only ever runs once per mount -- verifyEmail/router identity churn
    // shouldn't re-trigger a second verification attempt against the (by
    // then already-consumed) token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleResend(event: React.FormEvent) {
    event.preventDefault();
    setResendStatus("sending");
    try {
      await getApiClient().auth.resendVerification(resendEmail);
      setResendStatus("sent");
    } catch {
      setResendStatus("idle");
    }
  }

  if (status === "verifying") {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <p className="text-foreground/70">Verifying…</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Email verified</h1>
        <p className="mt-4 text-sm text-foreground/70">Taking you to your account…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16 text-center">
      <h1 className="text-2xl font-bold text-foreground">Link invalid or expired</h1>
      <p className="mt-4 text-sm text-foreground/70">Request a new verification link below.</p>
      {resendStatus === "sent" ? (
        <p className="mt-6 text-sm text-foreground/70">Check your inbox for a new link.</p>
      ) : (
        <form onSubmit={handleResend} className="mt-6 space-y-3">
          <Input
            type="email"
            required
            placeholder="you@example.com"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
          />
          <Button type="submit" disabled={resendStatus === "sending"} className="w-full">
            {resendStatus === "sending" ? "Sending…" : "Resend verification email"}
          </Button>
        </form>
      )}
      <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-primary hover:text-primary/80">
        Back to login
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
