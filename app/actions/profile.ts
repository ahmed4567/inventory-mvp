"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

const ProfileSchema = z.object({
  name:     z.string().min(1, "Name is required"),
  bio:      z.string().max(300, "Bio must be under 300 characters").optional(),
  avatarUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword:     z.string().min(6, "New password must be at least 6 characters"),
});

export async function getProfile() {
  const session = await getSession();
  if (!session) return null;
  const userId = (session.user as any).id;
  return prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true, name: true, email: true, username: true, bio: true, avatarUrl: true, role: true, createdAt: true },
  });
}

export async function updateProfile(data: unknown) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };
  const userId = (session.user as any).id;

  const validated = ProfileSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name:      validated.data.name,
      bio:       validated.data.bio       || null,
      avatarUrl: validated.data.avatarUrl || null,
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function changePassword(data: unknown) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };
  const userId = (session.user as any).id;

  const validated = PasswordSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  const match = await bcrypt.compare(validated.data.currentPassword, user.passwordHash);
  if (!match) return { error: "Current password is incorrect" };

  const passwordHash = await bcrypt.hash(validated.data.newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { success: true };
}