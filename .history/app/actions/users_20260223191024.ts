"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperuser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

const CreateUserSchema = z.object({
  email:    z.string().email("Invalid email"),
  name:     z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role:     z.enum(["SUPERUSER", "USER"]),
});

const RegisterSchema = z.object({
  email:    z.string().email("Invalid email"),
  name:     z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function getUsers() {
  await requireSuperuser();
  return prisma.user.findMany({
    select: {
      id:        true,
      email:     true,
      name:      true,
      role:      true,
      status:    true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingUsers() {
  await requireSuperuser();
  return prisma.user.findMany({
    where:   { status: "PENDING" },
    select:  { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

// Public — no auth required
export async function registerUser(data: unknown) {
  const validated = RegisterSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const existing = await prisma.user.findUnique({
    where: { email: validated.data.email },
  });
  if (existing) return { error: { email: ["Email already registered"] } };

  const passwordHash = await bcrypt.hash(validated.data.password, 12);
  const newUser = await prisma.user.create({
    data: {
      email:        validated.data.email,
      name:         validated.data.name,
      passwordHash,
      role:         "USER",
      status:       "PENDING",
    },
  });

  await sendNewRegistrationNotification(
    newUser.id,
    newUser.name ?? newUser.email,
    newUser.email
  );

  return { success: true };
}


export async function createUser(data: unknown) {
  await requireSuperuser();

  const validated = CreateUserSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const existing = await prisma.user.findUnique({
    where: { email: validated.data.email },
  });
  if (existing) {
    return { error: { email: ["Email already exists"] } };
  }

  const passwordHash = await bcrypt.hash(validated.data.password, 12);

  await prisma.user.create({
    data: {
      email:        validated.data.email,
      name:         validated.data.name,
      passwordHash,
      role:         validated.data.role,
      status:       "ACTIVE",
    },
  });

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function approveUser(id: string, role: "SUPERUSER" | "USER") {
  await requireSuperuser();

  await prisma.user.update({
    where: { id },
    data:  { status: "ACTIVE", role },
  });

  // Mark registration notifications as read
  await prisma.notification.updateMany({
    where: { recipientId: id, type: "NEW_REGISTRATION" },
    data:  { read: true },
  });

  // Notify the approved user
  await sendAccountApprovedNotification(id);

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "No account found with that email" };

  await sendPasswordResetNotification(
    user.id,
    user.name ?? user.email,
    user.email
  );

  return { success: true };
}

export async function rejectUser(id: string) {
  await requireSuperuser();

  await prisma.user.update({
    where: { id },
    data:  { status: "REJECTED" },
  });

  await prisma.notification.updateMany({
    where: { userId: id },
    data:  { read: true },
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateUserRole(id: string, role: "SUPERUSER" | "USER") {
  await requireSuperuser();
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function resetUserPassword(id: string) {
  await requireSuperuser();

  const tempPassword = Math.random().toString(36).slice(-8);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.update({
    where: { id },
    data:  { passwordHash },
  });

  await prisma.notification.updateMany({
    where: { userId: id, type: "PASSWORD_RESET_REQUEST" },
    data:  { read: true },
  });

  revalidatePath("/dashboard/users");
  return { success: true, tempPassword };
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "No account found with that email" };

  const superusers = await prisma.user.findMany({
    where: { role: "SUPERUSER", status: "ACTIVE" },
  });

  await prisma.notification.createMany({
    data: superusers.map((su) => ({
      type:    "PASSWORD_RESET_REQUEST" as const,
      message: `Password reset requested by: ${user.name ?? user.email} (${user.email})`,
      userId:  user.id,
    })),
  });

  return { success: true };
}

export async function deleteUser(id: string) {
  const session = await requireSuperuser();
  if ((session.user as any).id === id) {
    return { error: "You cannot delete your own account" };
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/dashboard/users");
  return { success: true };
}