"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Total active products
  const totalProducts = await prisma.product.count({
    where: { deletedAt: null },
  });

  // All products for stock value + low stock
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
  });

  // Total stock value
  const totalStockValue = products.reduce((sum, p) => {
    return sum + Number(p.costPrice) * p.quantity;
  }, 0);

  // Low stock items
  const lowStockItems = products
    .filter((p) => p.quantity <= p.reorderLevel)
    .map((p) => ({
      id:           p.id,
      name:         p.name,
      sku:          p.sku,
      quantity:     p.quantity,
      reorderLevel: p.reorderLevel,
    }));

  // Monthly sales total
  const monthlySales = await prisma.invoice.aggregate({
    _sum: { total: true },
    where: {
      type:      "SALE",
      createdAt: { gte: startOfMonth },
    },
  });

  // Active maintenance items
  const maintenanceItems = await prisma.maintenance.findMany({
    where: {
      status: { in: ["RECEIVED", "IN_PROGRESS", "WAITING_FOR_PARTS", "REPAIRED"] },
    },
    include: {
      customer: { select: { name: true, phone: true } },
      product:  { select: { name: true, sku: true  } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Recent stock movements
  const recentMovements = await prisma.stockMovement.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      product: { select: { name: true } },
    },
  });

  return {
    totalProducts,
    totalStockValue,
    lowStockItems,
    monthlySales: Number(monthlySales._sum.total ?? 0),
    maintenanceItems: maintenanceItems.map((m) => ({
      id:          m.id,
      productName: m.productName,
      customer:    m.customer.name,
      status:      m.status,
      handler:     m.handler,
      serviceFee:  m.serviceFee ? Number(m.serviceFee) : null,
      createdAt:   m.createdAt.toISOString(),
    })),
    recentMovements: recentMovements.map((m) => ({
      id:          m.id,
      productName: m.product.name,
      type:        m.type,
      quantity:    m.quantity,
      reference:   m.reference,
      createdAt:   m.createdAt.toISOString(),
    })),
  };
}