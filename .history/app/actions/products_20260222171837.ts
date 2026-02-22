"use server";

import { prisma } from "@/lib/prisma";
import { ProductSchema } from "@/lib/schemas/product";
import { revalidatePath } from "next/cache";

// ── GET ALL PRODUCTS ──────────────────────────────────────────
export async function getProducts(lowStockOnly = false) {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  const serialized = products.map((p) => ({
    ...p,
    costPrice: Number(p.costPrice),
    sellingPrice: Number(p.sellingPrice),
    createdAt: p.createdAt.toISOString(),
    deletedAt: p.deletedAt?.toISOString() ?? null,
  }));

  if (lowStockOnly) {
    return serialized.filter((p) => p.quantity <= p.reorderLevel);
  }

  return serialized;
}

// ── GET SINGLE PRODUCT ────────────────────────────────────────
export async function getProduct(id: string) {
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) return null;

  return {
    ...p,
    costPrice: Number(p.costPrice),
    sellingPrice: Number(p.sellingPrice),
    createdAt: p.createdAt.toISOString(),
    deletedAt: p.deletedAt?.toISOString() ?? null,
  };
}
// ── CREATE PRODUCT ────────────────────────────────────────────
export async function createProduct(data: unknown) {
  const validated = ProductSchema.safeParse(data);

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const existing = await prisma.product.findUnique({
    where: { sku: validated.data.sku },
  });

  if (existing) {
    return { error: { sku: ["SKU already exists"] } };
  }

  const product = await prisma.product.create({
    data: validated.data,
  });

  revalidatePath("/dashboard/products");
  return {
    success: true,
    product: {
      ...product,
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
      createdAt: product.createdAt.toISOString(),
      deletedAt: product.deletedAt?.toISOString() ?? null,
    },
  };
}

// ── UPDATE PRODUCT ────────────────────────────────────────────
export async function updateProduct(id: string, data: unknown) {
  const validated = ProductSchema.safeParse(data);

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const existing = await prisma.product.findFirst({
    where: {
      sku: validated.data.sku,
      NOT: { id },
    },
  });

  if (existing) {
    return { error: { sku: ["SKU already exists"] } };
  }

  const product = await prisma.product.update({
    where: { id },
    data: validated.data,
  });

  revalidatePath("/dashboard/products");
  return {
    success: true,
    product: {
      ...product,
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
      createdAt: product.createdAt.toISOString(),
      deletedAt: product.deletedAt?.toISOString() ?? null,
    },
  };
}

// ── SOFT DELETE ───────────────────────────────────────────────
export async function softDeleteProduct(id: string) {
  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/dashboard/products");
  return { success: true };
}

// ── GET LOW STOCK PRODUCTS ────────────────────────────────────
export async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
  });

  return products.filter((p) => p.quantity <= p.reorderLevel);
}

// ── VALIDATE STOCK ────────────────────────────────────────────
export async function validateStock(productId: string, requestedQty: number) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
  });

  if (product.quantity < requestedQty) {
    throw new Error(
      `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${requestedQty}`
    );
  }

  return product;
}