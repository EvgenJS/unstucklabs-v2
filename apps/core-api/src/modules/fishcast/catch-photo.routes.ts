import type { FastifyInstance } from "fastify";
import { saveUploadedFile } from "../../lib/storage.js";

const PRODUCT_SLUG = "fishcast";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

// Catch photo upload -- v1's Catch.photoUrl field existed in the schema but
// was completely dead (no upload UI, no upload code anywhere). This makes
// it real, reusing the same local-disk storage lib as product media
// (lib/storage.ts), scoped by userId rather than a product-owned entity
// since each photo belongs to one user's own catch entry, not a shared
// gallery. The client then includes the returned url in the catch entry it
// writes via the generic PUT /apps/:productSlug/data -- no gallery/listing
// table needed, unlike ProductMedia.
export async function fishcastCatchPhotoRoutes(fastify: FastifyInstance) {
  fastify.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);
    instance.addHook("preHandler", instance.requireProductAccess());

    instance.post("/apps/:productSlug/catch-photo", async (request, reply) => {
      if (request.product!.slug !== PRODUCT_SLUG) {
        return reply.code(404).send({ error: "Unknown app" });
      }

      const data = await request.file();
      if (!data) return reply.code(400).send({ error: "No file uploaded" });

      if (!ALLOWED_TYPES.includes(data.mimetype)) {
        return reply.code(400).send({ error: "Unsupported file type" });
      }

      const buffer = await data.toBuffer();
      if (buffer.byteLength > MAX_BYTES) {
        return reply.code(400).send({ error: `File too large (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB)` });
      }

      const { url } = await saveUploadedFile(buffer, data.filename, "catches", request.user!.id);

      return reply.code(201).send({ url });
    });
  });
}
