"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperuser } from "@/lib/session";

/* ============================= */
/* Constants */
/* ============================= */

const SLA_DAYS = 5;

const KPI_CONFIG = {
  onTimeTarget: 95,
  slaTarget: 5,
  throughputTarget: 10,
  artTarget: 7,
  ftfTarget: 90,
  weights: {
    onTime: 25,
    sla: 5,
    throughput: 15,
    art: 10,
    ftf: 15,
  },
} as const;

const STATUS = {
  closed: ["DELIVERED", "REPAIRED", "CANCELLED"],
  active: ["RECEIVED", "IN_PROGRESS", "WAITING_FOR_PARTS"],
} as const;

/* ============================= */
/* Helpers */
/* ============================= */

function diffDays(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / 86_400_000;
}

function calculateScore(metrics: {
  onTimeRate: number;
  slaBreachRate: number;
  throughput: number;
  avgResolutionTime: number;
  ftfRate: number;
}) {
  const { weights } = KPI_CONFIG;

  const onTimeScore = Math.min(
    (metrics.onTimeRate / KPI_CONFIG.onTimeTarget) * weights.onTime,
    weights.onTime
  );

  const slaScore = Math.min(
    ((KPI_CONFIG.slaTarget - Math.min(metrics.slaBreachRate, KPI_CONFIG.slaTarget)) /
      KPI_CONFIG.slaTarget) *
      weights.sla,
    weights.sla
  );

  const throughputScore =
    metrics.throughput >= KPI_CONFIG.throughputTarget
      ? weights.throughput
      : (metrics.throughput / KPI_CONFIG.throughputTarget) * weights.throughput;

  const artScore =
    metrics.avgResolutionTime <= KPI_CONFIG.artTarget
      ? weights.art
      : Math.max(0, weights.art - (metrics.avgResolutionTime - KPI_CONFIG.artTarget));

  const ftfScore = Math.min(
    (metrics.ftfRate / KPI_CONFIG.ftfTarget) * weights.ftf,
    weights.ftf
  );

  return Math.round(
    onTimeScore + slaScore + throughputScore + artScore + ftfScore
  );
}

function resolveBand(score: number) {
  if (score >= 90)
    return { label: "Excellent", color: "text-green-600 bg-green-50" };
  if (score >= 80)
    return { label: "Very Good", color: "text-blue-600 bg-blue-50" };
  if (score >= 70)
    return { label: "Needs Improvement", color: "text-orange-600 bg-orange-50" };

  return { label: "Unacceptable", color: "text-red-600 bg-red-50" };
}

/* ============================= */
/* Main Function */
/* ============================= */

export async function getKPIData() {
  await requireSuperuser();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Single transactional read
  const [users, allJobs] = await prisma.$transaction([
    prisma.user.findMany({
      where: { status: "ACTIVE", role: "USER" },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        avatarUrl: true,
      },
    }),
    prisma.maintenance.findMany({
      select: {
        id: true,
        assignedUserId: true,
        status: true,
        receivedAt: true,
        repairedAt: true,
        deliveredAt: true,
        createdAt: true,
      },
    }),
  ]);

  // Group jobs by user
  const jobsByUser = new Map<string, typeof allJobs>();

  for (const job of allJobs) {
    if (!jobsByUser.has(job.assignedUserId)) {
      jobsByUser.set(job.assignedUserId, []);
    }
    jobsByUser.get(job.assignedUserId)!.push(job);
  }

  return users.map(user => {
    const userJobs = jobsByUser.get(user.id) ?? [];

    const monthJobs = userJobs.filter(j => j.createdAt >= monthStart);
    const closed = monthJobs.filter(j => STATUS.closed.includes(j.status as any));
    const active = userJobs.filter(j => STATUS.active.includes(j.status as any));

    const resolvedJobs = closed.filter(j => j.repairedAt || j.deliveredAt);

    const jobsWithinSLA = resolvedJobs.filter(j => {
      const end = new Date(j.deliveredAt ?? j.repairedAt!);
      return diffDays(new Date(j.receivedAt), end) <= SLA_DAYS;
    });

    const onTimeRate =
      closed.length > 0 ? (jobsWithinSLA.length / closed.length) * 100 : 0;

    const slaBreachRate =
      closed.length > 0
        ? ((closed.length - jobsWithinSLA.length) / closed.length) * 100
        : 0;

    const throughput = monthJobs.length;

    const avgResolutionTime =
      resolvedJobs.length > 0
        ? resolvedJobs.reduce((acc, j) => {
            const end = new Date(j.deliveredAt ?? j.repairedAt!);
            return acc + diffDays(new Date(j.receivedAt), end);
          }, 0) / resolvedJobs.length
        : 0;

    const ftfRate =
      closed.length > 0
        ? (closed.filter(j =>
            ["DELIVERED", "REPAIRED"].includes(j.status)
          ).length /
            closed.length) *
          100
        : 0;

    const totalScore = calculateScore({
      onTimeRate,
      slaBreachRate,
      throughput,
      avgResolutionTime,
      ftfRate,
    });

    return {
      user,
      stats: {
        totalJobs: userJobs.length,
        activeJobs: active.length,
        closedThisMonth: closed.length,
        throughput,
        onTimeRate: Math.round(onTimeRate),
        slaBreachRate: Math.round(slaBreachRate),
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        ftfRate: Math.round(ftfRate),
        totalScore,
        band: resolveBand(totalScore),
      },
    };
  });
}