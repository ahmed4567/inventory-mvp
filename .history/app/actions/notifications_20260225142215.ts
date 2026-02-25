"use server";

import { prisma } from "@/lib/prisma";
import { getSession, requireSuperuser } from "@/lib/session";
import { revalidatePath } from "next/cache";

// ── helpers ──────────────────────────────────────────────────────
async function notifyUser(
  recipientId: string,
  type: string,
  message: string,
  link?: string
) {
  await prisma.notification.create({
    data: {
      type:        type as any,
      message,
      recipientId,
      link:        link ?? null,
    },
  });
}

async function notifySuperusers(
  type: string,
  message: string,
  link?: string
) {
  const superusers = await prisma.user.findMany({
    where: { role: "SUPERUSER", status: "ACTIVE" },
    select: { id: true },
  });
  if (superusers.length === 0) return;
  await prisma.notification.createMany({
    data: superusers.map((su) => ({
      type:        type as any,
      message,
      recipientId: su.id,
      link:        link ?? null,
    })),
  });
}

// ── public exports ────────────────────────────────────────────────
export async function getMyNotifications() {
  const session = await getSession();
  if (!session) return [];

  const userId = (session.user as any).id;

  return prisma.notification.findMany({
    where:   { recipientId: userId },
    orderBy: { createdAt: "desc" },
    take:    50,
  });
}

export async function getMyUnreadCount() {
  const session = await getSession();
  if (!session) return 0;

  const userId = (session.user as any).id;

  return prisma.notification.count({
    where: { recipientId: userId, read: false },
  });
}

export async function markNotificationRead(id: string) {
  const session = await getSession();
  if (!session) return;
  const userId = (session.user as any).id;
  await prisma.notification.updateMany({
    where: { id, recipientId: userId },
    data:  { read: true },
  });
  revalidatePath("/dashboard");
}

export async function markAllMyNotificationsRead() {
  const session = await getSession();
  if (!session) return;
  const userId = (session.user as any).id;
  await prisma.notification.updateMany({
    where: { recipientId: userId, read: false },
    data:  { read: true },
  });
  revalidatePath("/dashboard");
  return { success: true };
}

// ── notification senders (called from other actions) ──────────────
export async function sendNewRegistrationNotification(newUserId: string, name: string, email: string) {
  await notifySuperusers(
    "NEW_REGISTRATION",
    `New user registered: ${name} (${email}) — awaiting approval.`,
    "/dashboard/users"
  );
}

export async function sendPasswordResetNotification(userId: string, name: string, email: string) {
  await notifySuperusers(
    "PASSWORD_RESET_REQUEST",
    `Password reset requested by: ${name} (${email})`,
    "/dashboard/users"
  );
}

export async function sendAccountApprovedNotification(userId: string) {
  await notifyUser(
    userId,
    "ACCOUNT_APPROVED",
    "Your account has been approved. Welcome to the system!",
    "/dashboard"
  );
}

export async function sendMaintenanceAssignedNotification(
  userId: string,
  jobId: string,
  productName: string
) {
  await notifyUser(
    userId,
    "MAINTENANCE_ASSIGNED",
    `You have been assigned a maintenance job: ${productName}`,
    `/dashboard/maintenance/${jobId}`
  );
}

export async function sendMaintenanceStatusNotification(
  userId: string,
  jobId: string,
  productName: string,
  newStatus: string
) {
  await notifyUser(
    userId,
    "MAINTENANCE_STATUS_CHANGED",
    `Maintenance job "${productName}" status updated to: ${newStatus.replace(/_/g, " ")}`,
    `/dashboard/maintenance/${jobId}`
  );
}

export async function sendMessageNotification(
  userId: string,
  message: string
) {
  await requireSuperuser();
  await notifyUser(userId, "MESSAGE", message, "/dashboard");
  revalidatePath("/dashboard");
  return { success: true };
}

// ── superuser: get all notifications ─────────────────────────────
export async function getAllNotifications() {
  await requireSuperuser();
  return prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take:    100,
  });
}
export async function getUnreadNotifications() {
  const session = await getSession();
  if (!session) return [];

  const userId = (session.user as any).id;

  return prisma.notification.findMany({
    where:   { recipientId: userId, read: false },
    orderBy: { createdAt: "desc" },
  });
}