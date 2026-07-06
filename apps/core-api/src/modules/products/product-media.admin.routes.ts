import type { FastifyInstance } from "fastify";
import { saveUploadedFile, deleteUploadedFile } from "../../lib/storage.js";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB

// Photo/video uploads for a product's gallery. Gated the same as
// products.admin.routes.ts (OWNER/EDITOR) -- media is a pricing/catalog
// concern, not something SUPPORT manages.
export async function productMediaAdminRoutes(fastify: FastifyInstance) {
  fastify.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);
    instance.addHook("preHandler", instance.requireRole("OWNER", "EDITOR"));

    instance.post("/admin/products/:id/media", async (request, reply) => {
      const { id: productId } = request.params as { id: string };

      const product = await instance.prisma.product.findUnique({ where: { id: productId } });
      if (!product) return reply.code(404).send({ error: "Product not found" });

      const data = await request.file();
      if (!data) return reply.code(400).send({ error: "No file uploaded" });

      const isImage = ALLOWED_IMAGE_TYPES.includes(data.mimetype);
      const isVideo = ALLOWED_VIDEO_TYPES.includes(data.mimetype);
      if (!isImage && !isVideo) {
        return reply.code(400).send({ error: "Unsupported file type" });
      }

      const buffer = await data.toBuffer();
      const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
      if (buffer.byteLength > maxBytes) {
        return reply.code(400).send({ error: `File too large (max ${Math.round(maxBytes / 1024 / 1024)}MB)` });
      }

      const { url } = await saveUploadedFile(buffer, data.filename, productId);

      const lastMedia = await instance.prisma.productMedia.findFirst({
        where: { productId },
        orderBy: { position: "desc" },
      });

      const media = await instance.prisma.productMedia.create({
        data: {
          productId,
          url,
          type: isImage ? "IMAGE" : "VIDEO",
          position: (lastMedia?.position ?? -1) + 1,
        },
      });

      return reply.code(201).send({ media });
    });

    instance.delete("/admin/products/:id/media/:mediaId", async (request, reply) => {
      const { mediaId } = request.params as { id: string; mediaId: string };

      const media = await instance.prisma.productMedia.findUnique({ where: { id: mediaId } });
      if (!media) return reply.code(404).send({ error: "Media not found" });

      await deleteUploadedFile(media.url);
      await instance.prisma.productMedia.delete({ where: { id: mediaId } });

      return reply.code(204).send();
    });
  });
}
