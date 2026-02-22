import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  sku: z.string().min(1, "SKU is required").max(50),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  costPrice: z.number().positive("Cost price must be positive"),
  sellingPrice: z.number().positive("Selling price must be positive"),
  reorderLevel: z.number().int().min(0),
});

export type ProductInput = z.infer<typeof ProductSchema>;