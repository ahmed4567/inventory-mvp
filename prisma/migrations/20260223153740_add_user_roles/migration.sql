-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERUSER', 'USER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';
