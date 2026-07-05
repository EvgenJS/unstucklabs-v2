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

  console.log(`Seeded product "${product.slug}" and admin user "${admin.email}" (OWNER).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
