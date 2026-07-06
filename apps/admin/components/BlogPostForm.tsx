"use client";

import { useState, type FormEvent } from "react";
import { Button, Input } from "@unstucklabs/ui";
import type { BlogPost, BlogPostInput } from "@unstucklabs/sdk";

interface Props {
  initial?: BlogPost;
  onSubmit: (input: BlogPostInput) => Promise<void>;
  onCancel: () => void;
}

export function BlogPostForm({ initial, onSubmit, onCancel }: Props) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        slug,
        title,
        excerpt,
        content,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
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
          <label className="mb-1 block text-sm font-medium text-foreground">Title</label>
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Slug</label>
          <Input required value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Excerpt</label>
        <textarea
          required
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Content (Markdown)</label>
        <textarea
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="w-full rounded-lg border border-border px-4 py-3 font-mono text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">SEO title (optional)</label>
          <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">SEO description (optional)</label>
          <Input value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
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
