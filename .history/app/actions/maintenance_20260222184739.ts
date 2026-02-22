"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const MaintenanceSchema = z.object({
  customerId:       z.string().min(1, "Customer is required"),
  // Product — one of these must be filled
  productId:        z.string().optional(),
  productName:      z.string().min(1, "Product name is required"),
  productBrand:     z.string().optional(),
  productModel:     z.string().optional(),
  serialNumber:     z.string().optional(),
  // Issue
  issueDescription: z.string().min(1, "Issue description is required"),
  // Handler
  handler:          z.enum(["IN_HOUSE", "SPECIALIST_SUPPLIER", "ORIGINAL_VENDOR"]),
  supplierId:       z.string().optional(),
  vendorName:       z.string().optional(),
  // Financials
  serviceFee:       z.number().positive().optional(),
  notes:            z.string().optional(),
});

function serialize(m: any) {
  return {
    ...m,
    serviceFee:  m.serviceFee  ? Number(m.serviceFee)  : null,
    createdAt:   m.createdAt.toISOString(),
    receivedAt:  m.receivedAt.toISOString(),
    repairedAt:  m.repairedAt?.toISOString()  ?? null,
    deliveredAt: m.deliveredAt?.toISOString() ?? null,
  };
}

export async function getMaintenanceItems() {
  const items = await prisma.maintenance.findMany({
    include: {
      customer: { select: { name: true, phone: true } },
      supplier: { select: { name: true } },
      product:  { select: { name: true, sku: true  } },
    },
    orderBy: { createdAt: "desc" },
  });
  return items.map(serialize);
}

export async function getMaintenance(id: string) {
  const m = await prisma.maintenance.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true, phone: true, email: true } },
      supplier: { select: { name: true } },
      product:  { select: { name: true, sku: true } },
    },
  });
  if (!m) return null;
  return serialize(m);
}

export async function createMaintenance(data: unknown) {
  const validated = MaintenanceSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const d = validated.data;

  // Validate handler-specific fields
  if (d.handler === "SPECIALIST_SUPPLIER" && !d.supplierId) {
    return { error: { supplierId: ["Please select a supplier"] } };
  }
  if (d.handler === "ORIGINAL_VENDOR" && !d.vendorName) {
    return { error: { vendorName: ["Please enter the vendor name"] } };
  }

  const item = await prisma.maintenance.create({
    data: {
      customerId:       d.customerId,
      productId:        d.productId   || null,
      productName:      d.productName,
      productBrand:     d.productBrand  || null,
      productModel:     d.productModel  || null,
      serialNumber:     d.serialNumber  || null,
      issueDescription: d.issueDescription,
      handler:          d.handler,
      supplierId:       d.supplierId  || null,
      vendorName:       d.vendorName  || null,
      serviceFee:       d.serviceFee  ?? null,
      notes:            d.notes       || null,
      status:           "RECEIVED",
    },
  });

  revalidatePath("/dashboard/maintenance");
  revalidatePath("/dashboard");
  return { success: true, id: item.id };
}

export async function updateMaintenanceStatus(
  id: string,
  newStatus: "IN_PROGRESS" | "WAITING_FOR_PARTS" | "REPAIRED" | "DELIVERED" | "CANCELLED",
  notes?: string
) {
  const extra: any = {};
  if (newStatus === "REPAIRED")   extra.repairedAt  = new Date();
  if (newStatus === "DELIVERED")  extra.deliveredAt = new Date();
  if (notes) extra.notes = notes;

  await prisma.maintenance.update({
    where: { id },
    data: { status: newStatus, ...extra },
  });

  revalidatePath("/dashboard/maintenance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateServiceFee(id: string, serviceFee: number) {
  await prisma.maintenance.update({
    where: { id },
    data: { serviceFee },
  });
  revalidatePath("/dashboard/maintenance");
  return { success: true };
}