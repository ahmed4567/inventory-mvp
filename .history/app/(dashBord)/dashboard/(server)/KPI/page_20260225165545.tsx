"use client";

import { useEffect, useMemo, useState } from "react";
import { getKPIData } from "@/app/actions/kpi";

/* ============================= */
/* Types */
/* ============================= */

type KPIData = Awaited<ReturnType<typeof getKPIData>>;
type Technician = KPIData[number];
type Stats = Technician["stats"];

type SortKey = "totalScore" | "throughput" | "onTimeRate";

/* ============================= */
/* Constants */
/* ============================= */

const KPI_METRICS: ReadonlyArray<{
  key: keyof Stats;
  label: string;
  target: string;
  weight: string;
  unit: string;
}> = [
  { key: "onTimeRate", label: "On-Time Rate", target: "≥95%", weight: "25%", unit: "%" },
  { key: "slaBreachRate", label: "SLA Breach Rate", target: "≤5%", weight: "5%", unit: "%" },
  { key: "throughput", label: "Monthly Throughput", target: "≥10", weight: "15%", unit: " jobs" },
  { key: "avgResolutionTime", label: "Avg Resolution", target: "≤7d", weight: "10%", unit: "d" },
  { key: "ftfRate", label: "First-Time Fix", target: "≥90%", weight: "15%", unit: "%" },
];

const SCORE_THRESHOLDS = {
  excellent: 90,
  veryGood: 80,
  acceptable: 70,
} as const;

/* ============================= */
/* Helpers */
/* ============================= */

function resolveScoreColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.excellent) return "text-green-600";
  if (score >= SCORE_THRESHOLDS.veryGood) return "text-blue-600";
  if (score >= SCORE_THRESHOLDS.acceptable) return "text-orange-500";
  return "text-red-600";
}

function resolveBarColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.excellent) return "bg-green-500";
  if (score >= SCORE_THRESHOLDS.veryGood) return "bg-blue-500";
  if (score >= SCORE_THRESHOLDS.acceptable) return "bg-orange-400";
  return "bg-red-500";
}

/* ============================= */
/* Main Component */
/* ============================= */

export default function KPIDashboardPage() {
  const [data, setData] = useState<KPIData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("totalScore");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const result = await getKPIData();
        if (mounted) setData(result);
      } catch (err) {
        if (mounted) setError("Failed to load KPI data");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const sortedData = useMemo(() => {
    return [...data].sort(
      (a, b) => Number(b.stats[sortBy]) - Number(a.stats[sortBy])
    );
  }, [data, sortBy]);

  const teamSummary = useMemo(() => {
    if (!data.length) {
      return { avgScore: 0, excellent: 0, needsWork: 0 };
    }

    const avgScore = Math.round(
      data.reduce((sum, d) => sum + d.stats.totalScore, 0) / data.length
    );

    return {
      avgScore,
      excellent: data.filter(d => d.stats.totalScore >= 90).length,
      needsWork: data.filter(d => d.stats.totalScore < 70).length,
    };
  }, [data]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="max-w-6xl mx-auto">
      <Header />
      <TeamSummary
        count={data.length}
        avgScore={teamSummary.avgScore}
        excellent={teamSummary.excellent}
        needsWork={teamSummary.needsWork}
      />
      <SortControls sortBy={sortBy} setSortBy={setSortBy} />

      <div className="space-y-4">
        {sortedData.length === 0 ? (
          <EmptyState />
        ) : (
          sortedData.map(item => (
            <TechnicianCard
              key={item.user.id}
              technician={item}
              expanded={selectedId === item.user.id}
              onToggle={() =>
                setSelectedId(prev =>
                  prev === item.user.id ? null : item.user.id
                )
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ============================= */
/* Subcomponents */
/* ============================= */

function TechnicianCard({
  technician,
  expanded,
  onToggle,
}: {
  technician: Technician;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { user, stats } = technician;
  const displayName = user.name ?? user.username ?? "N/A";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition text-left"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={displayName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            {initial}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800">{displayName}</p>
          <p className="text-sm text-gray-400">@{user.username}</p>
        </div>

        <div className="text-right">
          <div className={`text-2xl font-bold ${resolveScoreColor(stats.totalScore)}`}>
            {stats.totalScore}
            <span className="text-base font-normal text-gray-400">/100</span>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stats.band.color}`}>
            {stats.band.label}
          </span>
        </div>
      </button>

      <div className="px-5 pb-3">
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${resolveBarColor(stats.totalScore)}`}
            style={{ width: `${stats.totalScore}%` }}
          />
        </div>
      </div>

      {expanded && (
        <div className="border-t px-5 py-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {KPI_METRICS.map(metric => (
              <div key={metric.key} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">
                  {stats[metric.key]}
                  {metric.unit}
                </p>
                <p className="text-xs text-gray-500">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================= */
/* UI States */
/* ============================= */

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 bg-gray-200 rounded-xl" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-xl" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-6 bg-red-50 text-red-700 rounded-xl">
      {message}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-12 text-center text-gray-500">
      No active technicians yet
    </div>
  );
}

function Header() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-800">Team KPI Dashboard</h1>
      <p className="text-gray-500 text-sm mt-1">
        Technician performance — current month
      </p>
    </div>
  );
}

function TeamSummary({
  count,
  avgScore,
  excellent,
  needsWork,
}: {
  count: number;
  avgScore: number;
  excellent: number;
  needsWork: number;
}) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatCard label="Team Members" value={count} />
      <StatCard label="Avg KPI Score" value={avgScore} />
      <StatCard label="Excellent" value={excellent} />
      <StatCard label="Needs Attention" value={needsWork} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function SortControls({
  sortBy,
  setSortBy,
}: {
  sortBy: SortKey;
  setSortBy: (key: SortKey) => void;
}) {
  const options: { key: SortKey; label: string }[] = [
    { key: "totalScore", label: "KPI Score" },
    { key: "throughput", label: "Throughput" },
    { key: "onTimeRate", label: "On-Time Rate" },
  ];

  return (
    <div className="flex items-center gap-3 mb-4">
      {options.map(option => (
        <button
          key={option.key}
          onClick={() => setSortBy(option.key)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
            sortBy === option.key
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}