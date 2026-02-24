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

export async function getUsers() {
  await requireSuperuser();
  return prisma.user.findMany({
    select: {
      id:        true,
      email:     true,
      name:      true,
      role:      true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
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
    },
  });

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function updateUserRole(id: string, role: "SUPERUSER" | "USER") {
  await requireSuperuser();
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function deleteUser(id: string) {
  await requireSuperuser();

  // Prevent deleting yourself
  const session = await requireSuperuser();
  if ((session.user as any).id === id) {
    return { error: "You cannot delete your own account" };
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/dashboard/users");
  return { success: true };
}