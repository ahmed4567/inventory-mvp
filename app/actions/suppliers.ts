"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const SupplierSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
});

export async function getSuppliers() {
  return prisma.supplier.findMany({ orderBy: { name: "asc" } });
}

export async function createSupplier(data: unknown) {
  const validated = SupplierSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const supplier = await prisma.supplier.create({ data: validated.data });
  revalidatePath("/dashboard/suppliers");
  return { success: true, supplier };
}