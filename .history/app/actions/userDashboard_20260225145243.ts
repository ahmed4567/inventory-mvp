"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function getUserDashboardData() {
  const session = await getSession();
  if (!session) return null;

  const userId      = (session.user as any).id;
  const isSuperuser = (session.user as any).role === "SUPERUSER";

  // If superuser, return null so they see the normal dashboard
  if (isSuperuser) return null;

  const [jobs, products] = await Promise.all([
    prisma.maintenance.findMany({
      where: { assignedUserId: userId },
      include: {
        customer: { select: { name: true, phone: true } },
        assignedUser: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where:   { deletedAt: null },
      select:  { id: true, name: true, sku: true, quantity: true, reorderLevel: true, sellingPrice: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalJobs     = jobs.length;
  const activeJobs    = jobs.filter(j => ["RECEIVED","IN_PROGRESS","WAITING_FOR_PARTS"].includes(j.status)).length;
  const completedJobs = jobs.filter(j => j.status === "REPAIRED" || j.status === "DELIVERED").length;
  const urgentJobs    = jobs.filter(j => j.status === "WAITING_FOR_PARTS").length;

  return {
    stats: { totalJobs, activeJobs, completedJobs, urgentJobs },
    jobs: jobs.map(j => ({
      id:               j.id,
      productName:      j.productName,
      productBrand:     j.productBrand,
      productModel:     j.productModel,
      customerName:     j.customer.name,
      customerPhone:    j.customer.phone,
      status:           j.status,
      handler:          j.handler,
      serviceFee:       j.serviceFee ? Number(j.serviceFee) : null,
      receivedAt:       j.receivedAt.toISOString(),
      createdAt:        j.createdAt.toISOString(),
    })),
    products: products.map(p => ({
      id:           p.id,
      name:         p.name,
      sku:          p.sku,
      quantity:     p.quantity,
      reorderLevel: p.reorderLevel,
      sellingPrice: Number(p.sellingPrice),
      lowStock:     p.quantity <= p.reorderLevel,
    })),
  };
}