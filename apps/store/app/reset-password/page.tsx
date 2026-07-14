"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input } from "@unstucklabs/ui";
import { useAuth } from "../../lib/auth-context";
import { getApiClient } from "../../lib/api";

function ResetPasswordForm() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (!token) {
      setError("This reset link is invalid or has expired.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.push("/account"), 1500);
    } catch {
      setError("This reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend(event: FormEvent) {
    event.preventDefault();
    setResendStatus("sending");
    try {
      await getApiClient().auth.forgotPassword(resendEmail);
    } catch {
      // Ignored -- same anti-enumeration shape as forgot-password itself.
    }
    setResendStatus("sent");
  }

  if (success) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Password reset</h1>
        <p className="mt-4 text-sm text-foreground/70">Taking you to your account…</p>
      </div>
    );
  }

  const linkIsInvalid = !token || (error && error.includes("invalid or has expired"));

  if (linkIsInvalid && error) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Link invalid or expired</h1>
        <p className="mt-4 text-sm text-foreground/70">Request a new reset link below.</p>
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
              {resendStatus === "sending" ? "Sending…" : "Send new reset link"}
            </Button>
          </form>
        )}
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-primary hover:text-primary/80">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-bold text-foreground">Reset password</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">
            New password
          </label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-1 text-xs text-foreground/50">At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-foreground">
            Confirm new password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
