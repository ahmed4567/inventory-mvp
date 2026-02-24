"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession, requireSuperuser } from "@/lib/session";
import {
  sendMaintenanceAssignedNotification,
  sendMaintenanceStatusNotification,
} from "@/app/actions/notifications";
import { z } from "zod";

const MaintenanceSchema = z.object({
  customerId:       z.string().min(1, "Customer is required"),
  productId:        z.string().optional(),
  productName:      z.string().min(1, "Product name is required"),
  productBrand:     z.string().optional(),
  productModel:     z.string().optional(),
  serialNumber:     z.string().optional(),
  issueDescription: z.string().min(1, "Issue description is required"),
  handler:          z.enum(["IN_HOUSE", "SPECIALIST_SUPPLIER", "ORIGINAL_VENDOR"]),
  supplierId:       z.string().optional(),
  vendorName:       z.string().optional(),
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
  const session = await getSession();
  if (!session) return [];

  const userId      = (session.user as any).id;
  const isSuperuser = (session.user as any).role === "SUPERUSER";

  const items = await prisma.maintenance.findMany({
    where: isSuperuser ? {} : {
      OR: [
        { assignedUserId: userId },
        { assignedUserId: null   },
      ],
    },
    include: {
      customer:     { select: { name: true, phone: true } },
      supplier:     { select: { name: true             } },
      product:      { select: { name: true, sku: true  } },
      assignedUser: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return items.map(serialize);
}

export async function getMaintenance(id: string) {
  const m = await prisma.maintenance.findUnique({
    where: { id },
    include: {
      customer:     { select: { name: true, phone: true, email: true } },
      supplier:     { select: { name: true             } },
      product:      { select: { name: true, sku: true  } },
      assignedUser: { select: { id: true, name: true, email: true } },
    },
  });
  if (!m) return null;
  return serialize(m);
}

export async function createMaintenance(data: unknown) {
  const session = await getSession();
  if (!session) return { error: { form: ["Unauthorized"] } };

  const validated = MaintenanceSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const d            = validated.data;
  const userId       = (session.user as any).id;
  const isSuperuser  = (session.user as any).role === "SUPERUSER";

  if (d.handler === "SPECIALIST_SUPPLIER" && !d.supplierId) {
    return { error: { supplierId: ["Please select a supplier"] } };
  }
  if (d.handler === "ORIGINAL_VENDOR" && !d.vendorName) {
    return { error: { vendorName: ["Please enter the vendor name"] } };
  }

  const item = await prisma.maintenance.create({
    data: {
      customerId:       d.customerId,
      productId:        d.productId        || null,
      productName:      d.productName,
      productBrand:     d.productBrand     || null,
      productModel:     d.productModel     || null,
      serialNumber:     d.serialNumber     || null,
      issueDescription: d.issueDescription,
      handler:          d.handler,
      supplierId:       d.supplierId       || null,
      vendorName:       d.vendorName       || null,
      serviceFee:       d.serviceFee       ?? null,
      notes:            d.notes            || null,
      status:           "RECEIVED",
      // Auto-assign to creator if normal user
      assignedUserId:   isSuperuser ? null : userId,
    },
  });

  // Notify the assigned user if superuser created and assigned
  if (isSuperuser && item.assignedUserId) {
    await sendMaintenanceAssignedNotification(
      item.assignedUserId,
      item.id,
      item.productName
    );
  }

  revalidatePath("/dashboard/maintenance");
  revalidatePath("/dashboard");
  return { success: true, id: item.id };
}

export async function assignMaintenance(jobId: string, userId: string | null) {
  await requireSuperuser();

  const job = await prisma.maintenance.findUniqueOrThrow({ where: { id: jobId } });

  await prisma.maintenance.update({
    where: { id: jobId },
    data:  { assignedUserId: userId },
  });

  if (userId) {
    await sendMaintenanceAssignedNotification(userId, jobId, job.productName);
  }

  revalidatePath("/dashboard/maintenance");
  revalidatePath(`/dashboard/maintenance/${jobId}`);
  return { success: true };
}

export async function updateMaintenanceStatus(
  id: string,
  newStatus: "IN_PROGRESS" | "WAITING_FOR_PARTS" | "REPAIRED" | "DELIVERED" | "CANCELLED"
) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const userId      = (session.user as any).id;
  const isSuperuser = (session.user as any).role === "SUPERUSER";

  const job = await prisma.maintenance.findUniqueOrThrow({ where: { id } });

  // Normal user can only update jobs assigned to them
  if (!isSuperuser && job.assignedUserId !== userId) {
    return { error: "You are not assigned to this job" };
  }

  const extra: any = {};
  if (newStatus === "REPAIRED")  extra.repairedAt  = new Date();
  if (newStatus === "DELIVERED") extra.deliveredAt = new Date();

  await prisma.maintenance.update({
    where: { id },
    data:  { status: newStatus, ...extra },
  });

  // Notify assigned user of status change (if someone else changed it)
  if (job.assignedUserId && job.assignedUserId !== userId) {
    await sendMaintenanceStatusNotification(
      job.assignedUserId,
      id,
      job.productName,
      newStatus
    );
  }

  revalidatePath("/dashboard/maintenance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateServiceFee(id: string, serviceFee: number) {
  await requireSuperuser();
  await prisma.maintenance.update({
    where: { id },
    data:  { serviceFee },
  });
  revalidatePath("/dashboard/maintenance");
  return { success: true };
}