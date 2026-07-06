"use client";

import { useEffect, useState } from "react";
import { Card } from "@unstucklabs/ui";
import type { ContactMessage } from "@unstucklabs/sdk";
import { useAuth } from "../../../lib/auth-context";
import { getApiClient } from "../../../lib/api";

export default function ContactMessagesPage() {
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[] | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getApiClient(accessToken).contact.admin.list().then(({ messages }) => setMessages(messages));
  }, [accessToken]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Contact Messages</h1>

      <div className="mt-6 space-y-3">
        {messages === null ? (
          <p className="text-foreground/70">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-foreground/70">No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <Card key={msg.id}>
              <p className="font-semibold text-foreground">{msg.email}</p>
              <p className="mt-1 text-sm text-foreground/70">{msg.message}</p>
              <p className="mt-2 text-xs text-foreground/50">
                {new Date(msg.createdAt).toLocaleString("en-US")}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
