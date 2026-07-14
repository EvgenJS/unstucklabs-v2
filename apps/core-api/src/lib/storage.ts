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

// Every current caller passes an entityId that's already been validated --
// either a server-derived request.user.id, or a Prisma row id confirmed to
// exist via findUnique before this is ever called -- so none of them can
// contain "../" today. This check exists so that guarantee doesn't rest
// entirely on every future caller remembering to validate first: cuids are
// the only shape ever used for entityId in this app, so anything else is
// rejected outright rather than silently joined into a filesystem path.
const CUID_PATTERN = /^[a-z0-9]+$/i;

function assertSafeEntityId(entityId: string): void {
  if (!CUID_PATTERN.test(entityId)) {
    throw new Error(`Invalid entityId for file storage: ${entityId}`);
  }
}

export async function saveUploadedFile(
  buffer: Buffer,
  originalFilename: string,
  category: "products" | "blog" | "catches",
  entityId: string
): Promise<{ url: string; absolutePath: string }> {
  assertSafeEntityId(entityId);
  const dir = path.join(UPLOAD_DIR, category, entityId);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}-${sanitizeFilename(originalFilename)}`;
  const absolutePath = path.join(dir, filename);
  await writeFile(absolutePath, buffer);

  return { url: `/uploads/${category}/${entityId}/${filename}`, absolutePath };
}

export async function deleteUploadedFile(url: string): Promise<void> {
  // url is always "/uploads/..." as produced by saveUploadedFile above --
  // strip the /uploads prefix to get the path relative to UPLOAD_DIR. Every
  // current caller reads url back from a DB row it just wrote (never from
  // raw request input), but the resolved-path check below is a second,
  // independent guard against ever unlinking outside UPLOAD_DIR regardless
  // of where the string came from.
  const relative = url.replace(/^\/uploads\//, "");
  const absolutePath = path.resolve(UPLOAD_DIR, relative);

  if (!absolutePath.startsWith(UPLOAD_DIR + path.sep)) {
    throw new Error(`Refusing to delete a path outside UPLOAD_DIR: ${url}`);
  }

  await unlink(absolutePath).catch(() => {
    // Already gone -- fine, we still want the DB row removed either way.
  });
}

export { UPLOAD_DIR };
