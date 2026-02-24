"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperuser } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getUnreadNotifications() {
  await requireSuperuser();
  return prisma.notification.findMany({
    where:   { read: false },
    include: { user: { select: { id: true, name: true, email: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllNotifications() {
  await requireSuperuser();
  return prisma.notification.findMany({
    include: { user: { select: { id: true, name: true, email: true, status: true } } },
    orderBy: { createdAt: "desc" },
    take:    50,
  });
}

export async function markNotificationRead(id: string) {
  await requireSuperuser();
  await prisma.notification.update({ where: { id }, data: { read: true } });
  revalidatePath("/dashboard");
}

export async function markAllRead() {
  await requireSuperuser();
  await prisma.notification.updateMany({ where: { read: false }, data: { read: true } });
  revalidatePath("/dashboard");
}