"use client";

import { useRef, useState } from "react";
import { useAuth } from "../lib/auth-context";
import { getApiClient } from "../lib/api";

interface Props {
  postId: string;
  coverImageUrl: string | null;
  onChange: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function resolveCoverUrl(url: string): string {
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

export function BlogCoverManager({ postId, coverImageUrl, onChange }: Props) {
  const { accessToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !accessToken) return;

    setUploading(true);
    setError(null);
    try {
      await getApiClient(accessToken).blog.admin.uploadCover(postId, file);
      onChange();
    } catch {
      setError("Upload failed -- check the file is a JPEG/PNG/WebP image under 10MB.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!accessToken) return;
    await getApiClient(accessToken).blog.admin.deleteCover(postId);
    onChange();
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h3 className="font-semibold text-foreground">Cover image</h3>
      <p className="mt-1 text-sm text-foreground/70">
        Shown above the post on the Store and used for social sharing previews.
      </p>

      {coverImageUrl && (
        <div className="relative mt-4 w-full max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveCoverUrl(coverImageUrl)}
            alt=""
            className="h-40 w-full rounded-lg object-cover"
          />
          <button
            onClick={handleRemove}
            className="absolute right-1 top-1 cursor-pointer rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-destructive shadow"
          >
            Remove
          </button>
        </div>
      )}

      <div className="mt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelected}
          disabled={uploading}
          className="text-sm"
        />
        {uploading && <p className="mt-2 text-sm text-foreground/70">Uploading…</p>}
        {error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
