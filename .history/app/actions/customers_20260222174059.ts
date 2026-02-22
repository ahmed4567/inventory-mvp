"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
});

export async function getCustomers() {
  return prisma.customer.findMany({ orderBy: { name: "asc" } });
}

export async function createCustomer(data: unknown) {
  const validated = CustomerSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const customer = await prisma.customer.create({ data: validated.data });
  revalidatePath("/dashboard/customers");
  return { success: true, customer };
}