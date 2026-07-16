import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createEmailService } from "../email/email.service.js";
import { renderEmailHtml } from "../email/email-template.js";

const createMessageSchema = z.object({
  email: z.string().email(),
  message: z.string().min(1).max(2000),
});

// Where the business actually reads incoming contact messages -- separate
// from EMAIL_FROM (the sending identity) since a future setup might send
// from one address but have a different person/inbox monitor it.
const CONTACT_NOTIFY_EMAIL = process.env.CONTACT_NOTIFY_EMAIL ?? "hello@unstucklabs.store";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function notificationEmailHtml(senderEmail: string, message: string): string {
  return renderEmailHtml({
    heading: "New contact message",
    bodyHtml: `
      <p style="margin: 0 0 12px;">From: ${escapeHtml(senderEmail)}</p>
      <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
    `,
    footerNote: "Sent from the unstucklabs.store contact form.",
  });
}

function confirmationEmailHtml(message: string): string {
  return renderEmailHtml({
    preheader: "We've got your message.",
    heading: "Thanks for reaching out",
    bodyHtml: `
      <p style="margin: 0 0 12px;">We've received your message and will get back to you soon. For your records, here's what you sent:</p>
      <p style="margin: 0; white-space: pre-wrap; color: #5f7d7a;">${escapeHtml(message)}</p>
    `,
  });
}

// Public capture for the /contact page -- general support/questions, kept
// separate from AppRequest (product ideas) and EmailSubscriber (marketing
// opt-in) since the intent behind reaching out is different.
export async function contactRoutes(fastify: FastifyInstance) {
  const emailService = createEmailService();

  fastify.post("/contact", async (request, reply) => {
    const body = createMessageSchema.parse(request.body);

    const message = await fastify.prisma.contactMessage.create({ data: body });

    // Best-effort: the message is already durably stored above, so a
    // transient email failure shouldn't turn into a 500 for the visitor --
    // it would just mean checking the admin panel instead of the inbox.
    try {
      await Promise.all([
        emailService.sendTransactional(
          CONTACT_NOTIFY_EMAIL,
          `New contact message from ${body.email}`,
          notificationEmailHtml(body.email, body.message),
        ),
        emailService.sendTransactional(body.email, "We've received your message", confirmationEmailHtml(body.message)),
      ]);
    } catch (err) {
      request.log.error(err, "Failed to send contact form notification/confirmation email");
    }

    return reply.code(201).send({ message: { id: message.id } });
  });

  fastify.register(async (instance) => {
    instance.addHook("preHandler", instance.authenticate);
    instance.addHook("preHandler", instance.requireRole("OWNER", "EDITOR", "SUPPORT"));

    instance.get("/admin/contact-messages", async () => {
      const messages = await instance.prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
      });
      return { messages };
    });
  });
}
