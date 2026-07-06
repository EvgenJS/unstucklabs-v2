import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Local-disk storage for product media (photos/videos), matching the
// self-hosted deployment model (see CLAUDE.md) -- Nginx or @fastify/static
// serves UPLOAD_DIR directly at the /uploads prefix. This is the one module
// a future S3-compatible storage migration would touch; nothing else in the
// app should know files live on disk.
const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./uploads");

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-100);
}

export async function saveUploadedFile(
  buffer: Buffer,
  originalFilename: string,
  productId: string
): Promise<{ url: string; absolutePath: string }> {
  const dir = path.join(UPLOAD_DIR, "products", productId);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}-${sanitizeFilename(originalFilename)}`;
  const absolutePath = path.join(dir, filename);
  await writeFile(absolutePath, buffer);

  return { url: `/uploads/products/${productId}/${filename}`, absolutePath };
}

export async function deleteUploadedFile(url: string): Promise<void> {
  // url is always "/uploads/..." as produced by saveUploadedFile above --
  // strip the /uploads prefix to get the path relative to UPLOAD_DIR.
  const relative = url.replace(/^\/uploads\//, "");
  const absolutePath = path.join(UPLOAD_DIR, relative);

  await unlink(absolutePath).catch(() => {
    // Already gone -- fine, we still want the DB row removed either way.
  });
}

export { UPLOAD_DIR };
