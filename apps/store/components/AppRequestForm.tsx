"use client";

import { useState, type FormEvent } from "react";
import { Button, Input } from "@unstucklabs/ui";
import { getApiClient } from "../lib/api";

export function AppRequestForm({ className = "" }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    try {
      await getApiClient().appRequests.submit(email, description);
      setStatus("success");
      setEmail("");
      setDescription("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className={`font-medium text-primary ${className}`}>
        Thanks — we&apos;ll follow up if we build this.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-3 ${className}`}>
      <label htmlFor="app-request-description" className="sr-only">
        What do you need?
      </label>
      <textarea
        id="app-request-description"
        required
        placeholder="What do you need help getting unstuck with?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-border px-4 py-3 text-base transition-colors duration-200 ease-out focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <label htmlFor="app-request-email" className="sr-only">
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          id="app-request-email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="sm:flex-1"
        />
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Sending…" : "Suggest an app"}
        </Button>
      </div>
      {status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          Something went wrong, please try again.
        </p>
      )}
    </form>
  );
}
