/*
  Warnings:

  - The values [PENDING,COMPLETED,RETURNED] on the enum `MaintenanceStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `completedAt` on the `Maintenance` table. All the data in the column will be lost.
  - You are about to drop the column `cost` on the `Maintenance` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `Maintenance` table. All the data in the column will be lost.
  - Added the required column `customerId` to the `Maintenance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productName` to the `Maintenance` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MaintenanceHandler" AS ENUM ('IN_HOUSE', 'SPECIALIST_SUPPLIER', 'ORIGINAL_VENDOR');

-- AlterEnum
BEGIN;
CREATE TYPE "MaintenanceStatus_new" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'WAITING_FOR_PARTS', 'REPAIRED', 'DELIVERED', 'CANCELLED');
ALTER TABLE "Maintenance" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Maintenance" ALTER COLUMN "status" TYPE "MaintenanceStatus_new" USING ("status"::text::"MaintenanceStatus_new");
ALTER TYPE "MaintenanceStatus" RENAME TO "MaintenanceStatus_old";
ALTER TYPE "MaintenanceStatus_new" RENAME TO "MaintenanceStatus";
DROP TYPE "MaintenanceStatus_old";
ALTER TABLE "Maintenance" ALTER COLUMN "status" SET DEFAULT 'RECEIVED';
COMMIT;

-- DropForeignKey
ALTER TABLE "Maintenance" DROP CONSTRAINT "Maintenance_productId_fkey";

-- AlterTable
ALTER TABLE "Maintenance" DROP COLUMN "completedAt",
DROP COLUMN "cost",
DROP COLUMN "startedAt",
ADD COLUMN     "customerId" TEXT NOT NULL,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "handler" "MaintenanceHandler" NOT NULL DEFAULT 'IN_HOUSE',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "productBrand" TEXT,
ADD COLUMN     "productModel" TEXT,
ADD COLUMN     "productName" TEXT NOT NULL,
ADD COLUMN     "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "repairedAt" TIMESTAMP(3),
ADD COLUMN     "serviceFee" DECIMAL(65,30),
ADD COLUMN     "supplierId" TEXT,
ADD COLUMN     "vendorName" TEXT,
ALTER COLUMN "productId" DROP NOT NULL,
ALTER COLUMN "serialNumber" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'RECEIVED';

-- CreateIndex
CREATE INDEX "Maintenance_customerId_idx" ON "Maintenance"("customerId");

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
