/*
  Warnings:

  - The values [ASSIGNED_MAINTENANCE,SUPERUSER_MESSAGE] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `assignedToId` on the `Maintenance` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('NEW_REGISTRATION', 'PASSWORD_RESET_REQUEST', 'MAINTENANCE_ASSIGNED', 'MAINTENANCE_STATUS_CHANGED', 'ACCOUNT_APPROVED', 'MESSAGE');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Maintenance" DROP CONSTRAINT "Maintenance_assignedToId_fkey";

-- DropIndex
DROP INDEX "Maintenance_assignedToId_idx";

-- AlterTable
ALTER TABLE "Maintenance" DROP COLUMN "assignedToId",
ADD COLUMN     "assignedUserId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Maintenance_assignedUserId_idx" ON "Maintenance"("assignedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
