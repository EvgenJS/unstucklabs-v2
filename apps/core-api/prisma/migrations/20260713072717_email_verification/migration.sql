-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerificationExpires" TIMESTAMP(3),
ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;

-- Grandfather every pre-existing account (including the seeded admin) as
-- verified -- the new default (false) only applies to accounts created
-- after this migration.
UPDATE "users" SET "isEmailVerified" = true;
