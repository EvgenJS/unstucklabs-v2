import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

// Idempotent: upserts by unique key, safe to run more than once.
async function main() {
  const product = await prisma.product.upsert({
    where: { slug: "unstuck-daily" },
    create: {
      slug: "unstuck-daily",
      name: "Unstuck Daily",
      subdomain: "unstuck-daily",
      description: "Break down big tasks into small, doable steps.",
      pricingModel: "RECURRING",
      priceCents: 700,
      annualPriceCents: 7000, // ~10 months for 12 -- standard annual-discount framing
      currency: "USD",
      isActive: true,
    },
    update: {},
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@unstucklabs.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "change-me-please";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
    },
    update: {},
  });

  await prisma.membership.upsert({
    where: { userId_role: { userId: admin.id, role: "OWNER" } },
    create: { userId: admin.id, role: "OWNER" },
    update: {},
  });

  const now = new Date();

  await prisma.blogPost.upsert({
    where: { slug: "why-we-built-unstuck-daily" },
    create: {
      slug: "why-we-built-unstuck-daily",
      title: "Why We Built Unstuck Daily",
      excerpt: "Most planners assume you already know how to start. We didn't, so we built one that doesn't.",
      content: "# Why We Built Unstuck Daily\n\nMost productivity tools assume the hard part is remembering what to do. For a lot of us, the hard part is starting at all...",
      status: "PUBLISHED",
      publishedAt: now,
      seoTitle: "Why We Built Unstuck Daily — A Planner for Getting Started",
      seoDescription: "The story behind Unstuck Daily and why traditional planners don't work for everyone.",
    },
    update: {},
  });

  await prisma.blogPost.upsert({
    where: { slug: "task-paralysis-and-how-to-break-it" },
    create: {
      slug: "task-paralysis-and-how-to-break-it",
      title: "Task Paralysis and How to Break It",
      excerpt: "Breaking a big task into 5-minute steps isn't a productivity hack, it's a different way of thinking about work.",
      content: "# Task Paralysis and How to Break It\n\nYou know what needs to get done. You just can't make yourself start...",
      status: "PUBLISHED",
      publishedAt: now,
      seoTitle: "Task Paralysis and How to Break It",
      seoDescription: "A practical look at why big tasks feel impossible to start, and what actually helps.",
    },
    update: {},
  });

  await prisma.blogPost.upsert({
    where: { slug: "draft-upcoming-post" },
    create: {
      slug: "draft-upcoming-post",
      title: "Upcoming Post (Draft)",
      excerpt: "Draft placeholder used to test that unpublished posts are excluded from public routes.",
      content: "Draft content, not publicly visible.",
      status: "DRAFT",
    },
    update: {},
  });

  console.log(`Seeded product "${product.slug}", admin user "${admin.email}" (OWNER), and 3 blog posts (2 published, 1 draft).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
