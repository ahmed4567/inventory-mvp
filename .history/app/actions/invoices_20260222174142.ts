"use server";

import { prisma } from "@/lib/prisma";
import { InvoiceSchema } from "@/lib/schemas/invoice";
import { generateInvoiceNumber } from "@/lib/invoiceNumber";
import { revalidatePath } from "next/cache";

export async function getInvoices(type?: "SALE" | "PURCHASE") {
  const invoices = await prisma.invoice.findMany({
    where: type ? { type } : undefined,
    include: {
      customer: { select: { name: true } },
      supplier: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return invoices.map((inv) => ({
    ...inv,
    total: Number(inv.total),
    createdAt: inv.createdAt.toISOString(),
    customer: inv.customer ?? null,
    supplier: inv.supplier ?? null,
  }));
}

export async function getInvoice(id: string) {
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      supplier: true,
      items: {
        include: { product: { select: { name: true, sku: true } } },
      },
    },
  });

  if (!inv) return null;

  return {
    ...inv,
    total: Number(inv.total),
    createdAt: inv.createdAt.toISOString(),
    items: inv.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
  };
}

export async function createInvoice(data: unknown) {
  const validated = InvoiceSchema.safeParse(data);

  if (!validated.success) {
    return { error: validated.error.flatten() };
  }

  const { type, customerId, supplierId, items } = validated.data;

  try {
    const invoice = await prisma.$transaction(async (tx) => {

      // ── STEP 1: Stock pre-flight check (SALE only) ──────
      if (type === "SALE") {
        for (const item of items) {
          const product = await tx.product.findUniqueOrThrow({
            where: { id: item.productId },
          });

          if (product.quantity < item.quantity) {
            throw new Error(
              `Insufficient stock for "${product.name}". ` +
              `Available: ${product.quantity}, Requested: ${item.quantity}`
            );
          }
        }
      }

      // ── STEP 2: Generate invoice number ─────────────────
      const invoiceNumber = await generateInvoiceNumber(type, tx);

      // ── STEP 3: Calculate total ──────────────────────────
      const total = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice, 0
      );

      // ── STEP 4: Create invoice ───────────────────────────
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          type,
          total,
          customerId: customerId || null,
          supplierId: supplierId || null,
        },
      });

      // ── STEP 5: Create invoice items ─────────────────────
      await tx.invoiceItem.createMany({
        data: items.map((item) => ({
          invoiceId: invoice.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        })),
      });

      // ── STEP 6: Update stock + log movements ─────────────
      for (const item of items) {
        const delta = type === "SALE" ? -item.quantity : item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: delta } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type,
            quantity: delta,
            reference: invoice.invoiceNumber,
          },
        });
      }

      return invoice;
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard");
    return { success: true, invoiceId: invoice.id };

  } catch (error: any) {
    return { error: { formErrors: [error.message], fieldErrors: {} } };
  }
}