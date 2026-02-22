import { z } from "zod";

export const InvoiceItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  unitPrice: z.number().positive("Unit price must be positive"),
});

export const InvoiceSchema = z.object({
  type: z.enum(["SALE", "PURCHASE"]),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  items: z.array(InvoiceItemSchema).min(1, "At least one item is required"),
}).refine((data) => {
  if (data.type === "SALE" && !data.customerId) return false;
  if (data.type === "PURCHASE" && !data.supplierId) return false;
  return true;
}, {
  message: "SALE requires a customer, PURCHASE requires a supplier",
});

export type InvoiceInput = z.infer<typeof InvoiceSchema>;