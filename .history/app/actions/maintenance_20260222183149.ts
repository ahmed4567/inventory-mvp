"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const MaintenanceSchema = z.object({
  productId:        z.string().min(1, "Product is required"),
  serialNumber:     z.string().min(1, "Serial number is required"),
  issueDescription: z.string().min(1, "Issue description is required"),
  cost:             z.number().optional(),
});

export async function getMaintenanceItems() {
  const items = await prisma.maintenance.findMany({
    include: { product: { select: { name: true, sku: true } } },
    orderBy: { createdAt: "desc" },
  });

  return items.map((m) => ({
    ...m,
    cost:        m.cost ? Number(m.cost) : null,
    createdAt:   m.createdAt.toISOString(),
    startedAt:   m.startedAt?.toISOString()   ?? null,
    completedAt: m.completedAt?.toISOString() ?? null,
    product: { name: m.product.name, sku: m.product.sku },
  }));
}

export async function getMaintenance(id: string) {
  const m = await prisma.maintenance.findUnique({
    where: { id },
    include: { product: { select: { name: true, sku: true } } },
  });
  if (!m) return null;
  return {
    ...m,
    cost:        m.cost ? Number(m.cost) : null,
    createdAt:   m.createdAt.toISOString(),
    startedAt:   m.startedAt?.toISOString()   ?? null,
    completedAt: m.completedAt?.toISOString() ?? null,
    product: { name: m.product.name, sku: m.product.sku },
  };
}

export async function createMaintenance(data: unknown) {
  const validated = MaintenanceSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const item = await prisma.maintenance.create({
    data: {
      productId:        validated.data.productId,
      serialNumber:     validated.data.serialNumber,
      issueDescription: validated.data.issueDescription,
      cost:             validated.data.cost ?? null,
      status:           "PENDING",
    },
  });

  revalidatePath("/dashboard/maintenance");
  revalidatePath("/dashboard");
  return { success: true, id: item.id };
}

export async function updateMaintenanceStatus(
  id: string,
  newStatus: "IN_PROGRESS" | "COMPLETED" | "RETURNED" | "CANCELLED"
) {
  const maintenance = await prisma.maintenance.findUniqueOrThrow({ where: { id } });

  try {
    await prisma.$transaction(async (tx) => {

      // PENDING → IN_PROGRESS: remove from stock
      if (maintenance.status === "PENDING" && newStatus === "IN_PROGRESS") {
        const product = await tx.product.findUniqueOrThrow({
          where: { id: maintenance.productId },
        });

        if (product.quantity < 1) {
          throw new Error(`Insufficient stock for "${product.name}" to send for maintenance.`);
        }

        await tx.product.update({
          where: { id: maintenance.productId },
          data: { quantity: { decrement: 1 } },
        });

        await tx.stockMovement.create({
          data: {
            productId: maintenance.productId,
            type:      "MAINTENANCE_OUT",
            quantity:  -1,
            reference: `MAINT-${id.slice(0, 8).toUpperCase()}`,
          },
        });

        await tx.maintenance.update({
          where: { id },
          data: { status: "IN_PROGRESS", startedAt: new Date() },
        });
      }

      // IN_PROGRESS → COMPLETED: item repaired, not yet returned
      else if (maintenance.status === "IN_PROGRESS" && newStatus === "COMPLETED") {
        await tx.maintenance.update({
          where: { id },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
      }

      // COMPLETED → RETURNED: add back to stock
      else if (maintenance.status === "COMPLETED" && newStatus === "RETURNED") {
        await tx.product.update({
          where: { id: maintenance.productId },
          data: { quantity: { increment: 1 } },
        });

        await tx.stockMovement.create({
          data: {
            productId: maintenance.productId,
            type:      "MAINTENANCE_IN",
            quantity:  +1,
            reference: `MAINT-${id.slice(0, 8).toUpperCase()}`,
          },
        });

        await tx.maintenance.update({
          where: { id },
          data: { status: "RETURNED" },
        });
      }

      // CANCELLED from PENDING: no stock change
      else if (maintenance.status === "PENDING" && newStatus === "CANCELLED") {
        await tx.maintenance.update({
          where: { id },
          data: { status: "CANCELLED" },
        });
      }

      // CANCELLED from IN_PROGRESS: item lost/scrapped — log adjustment
      else if (maintenance.status === "IN_PROGRESS" && newStatus === "CANCELLED") {
        await tx.stockMovement.create({
          data: {
            productId: maintenance.productId,
            type:      "ADJUSTMENT",
            quantity:  0,
            reference: `MAINT-CANCELLED-${id.slice(0, 8).toUpperCase()}`,
          },
        });

        await tx.maintenance.update({
          where: { id },
          data: { status: "CANCELLED" },
        });
      }

      else {
        throw new Error(`Invalid transition: ${maintenance.status} → ${newStatus}`);
      }
    });

    revalidatePath("/dashboard/maintenance");
    revalidatePath("/dashboard");
    return { success: true };

  } catch (error: any) {
    return { error: error.message };
  }
}