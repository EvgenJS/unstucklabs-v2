"use client";

import { useRef, useState } from "react";
import type { ProductMedia } from "@unstucklabs/sdk";
import { useAuth } from "../lib/auth-context";
import { getApiClient } from "../lib/api";

interface Props {
  productId: string;
  media: ProductMedia[];
  onChange: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function ProductMediaManager({ productId, media, onChange }: Props) {
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
      await getApiClient(accessToken).products.admin.uploadMedia(productId, file);
      onChange();
    } catch {
      setError("Upload failed -- check the file is a JPEG/PNG/WebP image or MP4/WebM video under the size limit.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(mediaId: string) {
    if (!accessToken) return;
    await getApiClient(accessToken).products.admin.deleteMedia(productId, mediaId);
    onChange();
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h3 className="font-semibold text-foreground">Media</h3>
      <p className="mt-1 text-sm text-foreground/70">
        Screenshots and demo videos shown on this app&apos;s Store page.
      </p>

      {media.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {media.map((item) => (
            <div key={item.id} className="relative">
              {item.type === "IMAGE" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${API_URL}${item.url}`}
                  alt=""
                  className="h-24 w-full rounded-lg object-cover"
                />
              ) : (
                <video src={`${API_URL}${item.url}`} className="h-24 w-full rounded-lg object-cover" muted />
              )}
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute right-1 top-1 cursor-pointer rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-destructive shadow"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
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
