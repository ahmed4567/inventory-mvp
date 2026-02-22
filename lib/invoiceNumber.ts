import { PrismaClient } from "@prisma/client";

export async function generateInvoiceNumber(
  type: "SALE" | "PURCHASE",
  tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
) {
  const prefix = type === "SALE" ? "INV" : "PO";
  const year = new Date().getFullYear();

  const count = await tx.invoice.count({ where: { type } });
  const number = String(count + 1).padStart(5, "0");

  return `${prefix}-${year}-${number}`;
}