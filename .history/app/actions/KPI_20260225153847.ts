"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperuser } from "@/lib/session";

export async function getKPIData() {
  await requireSuperuser();

  const users = await prisma.user.findMany({
    where:  { status: "ACTIVE", role: "USER" },
    select: { id: true, name: true, email: true, username: true, avatarUrl: true },
  });

  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const kpis = await Promise.all(users.map(async (user) => {
    const [allJobs, monthJobs] = await Promise.all([
      prisma.maintenance.findMany({
        where: { assignedUserId: user.id },
        select: {
          id: true, status: true, receivedAt: true,
          repairedAt: true, deliveredAt: true, createdAt: true,
        },
      }),
      prisma.maintenance.findMany({
        where: { assignedUserId: user.id, createdAt: { gte: monthStart } },
        select: {
          id: true, status: true, receivedAt: true,
          repairedAt: true, deliveredAt: true, createdAt: true,
        },
      }),
    ]);

    const closed = monthJobs.filter(j =>
      ["DELIVERED", "REPAIRED", "CANCELLED"].includes(j.status)
    );
    const active = allJobs.filter(j =>
      ["RECEIVED", "IN_PROGRESS", "WAITING_FOR_PARTS"].includes(j.status)
    );

    // SLA = jobs completed within 7 days
    const SLA_DAYS = 7;
    const jobsWithinSLA = closed.filter(j => {
      if (!j.repairedAt && !j.deliveredAt) return false;
      const end   = new Date(j.deliveredAt ?? j.repairedAt!);
      const start = new Date(j.receivedAt);
      const days  = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return days <= SLA_DAYS;
    });

    const onTimeRate    = closed.length > 0 ? (jobsWithinSLA.length / closed.length) * 100 : 0;
    const slaBreachRate = closed.length > 0 ? ((closed.length - jobsWithinSLA.length) / closed.length) * 100 : 0;
    const throughput    = monthJobs.length;

    // ART — average resolution time in days
    const resolvedJobs = closed.filter(j => j.repairedAt || j.deliveredAt);
    const avgResolutionTime = resolvedJobs.length > 0
      ? resolvedJobs.reduce((acc, j) => {
          const end   = new Date(j.deliveredAt ?? j.repairedAt!);
          const start = new Date(j.receivedAt);
          return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / resolvedJobs.length
      : 0;

    // FTF — jobs delivered without going back to IN_PROGRESS after REPAIRED
    const ftfRate = closed.length > 0
      ? (closed.filter(j => j.status === "DELIVERED" || j.status === "REPAIRED").length / closed.length) * 100
      : 0;

    // KPI Score calculation (based on document weights)
    const onTimeScore = Math.min((onTimeRate / 95) * 25,  25);  // weight 25%
    const slaScore    = Math.min(((5 - Math.min(slaBreachRate, 5)) / 5) * 5, 5); // weight 5%
    const throughputScore = throughput >= 10 ? 15 : (throughput / 10) * 15;      // weight 15%
    const artScore    = avgResolutionTime <= 7 ? 10 : Math.max(0, 10 - (avgResolutionTime - 7)); // weight 10%
    const ftfScore    = Math.min((ftfRate / 90) * 15, 15);       // weight 15%
    const totalScore  = Math.round(onTimeScore + slaScore + throughputScore + artScore + ftfScore);

    const band =
      totalScore >= 90 ? { label: "Excellent",         color: "text-green-600  bg-green-50"   } :
      totalScore >= 80 ? { label: "Very Good",          color: "text-blue-600   bg-blue-50"    } :
      totalScore >= 70 ? { label: "Needs Improvement",  color: "text-orange-600 bg-orange-50"  } :
                         { label: "Unacceptable",        color: "text-red-600    bg-red-50"     };

    return {
      user,
      stats: {
        totalJobs:          allJobs.length,
        activeJobs:         active.length,
        closedThisMonth:    closed.length,
        throughput,
        onTimeRate:         Math.round(onTimeRate),
        slaBreachRate:      Math.round(slaBreachRate),
        avgResolutionTime:  Math.round(avgResolutionTime * 10) / 10,
        ftfRate:            Math.round(ftfRate),
        totalScore,
        band,
      },
    };
  }));

  return kpis;
}