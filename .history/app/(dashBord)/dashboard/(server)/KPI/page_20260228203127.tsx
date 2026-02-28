"use client";

import { useEffect, useState } from "react";
import { getKPIData } from "@/app/actions/kpi";

type KPIData = Awaited<ReturnType<typeof getKPIData>>;

const KPI_METRICS = [
  { key: "onTimeRate",        label: "On-Time Rate",      target: "≥95%",  weight: "25%", unit: "%" },
  { key: "slaBreachRate",     label: "SLA Breach Rate",   target: "≤5%",   weight: "5%",  unit: "%" },
  { key: "throughput",        label: "Monthly Throughput", target: "≥10",   weight: "15%", unit: " jobs" },
  { key: "avgResolutionTime", label: "Avg Resolution",    target: "≤7d",   weight: "10%", unit: "d" },
  { key: "ftfRate",           label: "First-Time Fix",    target: "≥90%",  weight: "15%", unit: "%" },
];

export default function KPIDashboardPage() {
  const [data,        setData]        = useState<KPIData>([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState<string | null>(null);
  const [sortBy,      setSortBy]      = useState<"totalScore" | "throughput" | "onTimeRate">("totalScore");

  useEffect(() => {
    getKPIData().then(d => { setData(d); setLoading(false); });
  }, []);

  const sorted = [...data].sort((a, b) =>
    (b.stats[sortBy] as number) - (a.stats[sortBy] as number)
  );

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 bg-gray-200 rounded-xl" />
      {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
    </div>
  );

  const avgScore = data.length > 0
    ? Math.round(data.reduce((a, d) => a + d.stats.totalScore, 0) / data.length)
    : 0;

  const excellent = data.filter(d => d.stats.totalScore >= 90).length;
  const needsWork = data.filter(d => d.stats.totalScore < 70).length;

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Team KPI Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Technician performance — current month</p>
      </div>

      {/* Team summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Team Members",  value: data.length,  icon: "👥", color: "bg-blue-50   text-blue-700"   },
          { label: "Avg KPI Score", value: `${avgScore}`, icon: "📊", color: "bg-purple-50 text-purple-700" },
          { label: "Excellent",     value: excellent,    icon: "⭐", color: "bg-green-50  text-green-700"  },
          { label: "Needs Attention",value: needsWork,   icon: "⚠️", color: "bg-red-50    text-red-700"    },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className={`text-xl w-10 h-10 rounded-lg flex items-center justify-center ${stat.color} mb-3`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-gray-500">Sort by:</span>
        {(["totalScore", "throughput", "onTimeRate"] as const).map(s => (
          <button key={s} onClick={() => setSortBy(s)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
              sortBy === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {s === "totalScore" ? "KPI Score" : s === "throughput" ? "Throughput" : "On-Time Rate"}
          </button>
        ))}
      </div>

      {/* Technician cards */}
      <div className="space-y-4">
        {sorted.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-500">No active technicians yet</p>
          </div>
        )}
        {sorted.map(({ user, stats }) => {
          const isExpanded = selected === user.id;
          return (
            <div key={user.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Card header */}
              <button onClick={() => setSelected(isExpanded ? null : user.id)}
                className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition text-left">

                {/* Avatar */}
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt=""
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center
                                  text-white font-bold text-lg flex-shrink-0">
                    {(user.name ?? user.username)[0].toUpperCase()}
                  </div>
                )}

                {/* Name + band */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{user.name ?? user.username}</p>
                  <p className="text-sm text-gray-400">@{user.username}</p>
                </div>

                {/* Quick stats */}
                <div className="hidden md:flex items-center gap-6 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-800">{stats.totalJobs}</p>
                    <p className="text-xs text-gray-400">Total Jobs</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-800">{stats.throughput}</p>
                    <p className="text-xs text-gray-400">This Month</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-800">{stats.onTimeRate}%</p>
                    <p className="text-xs text-gray-400">On-Time</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-800">{stats.activeJobs}</p>
                    <p className="text-xs text-gray-400">Active</p>
                  </div>
                </div>

                {/* KPI Score */}
                <div className="text-right ml-4">
                  <div className={`text-2xl font-bold ${
                    stats.totalScore >= 90 ? "text-green-600"  :
                    stats.totalScore >= 80 ? "text-blue-600"   :
                    stats.totalScore >= 70 ? "text-orange-500" :
                                             "text-red-600"
                  }`}>
                    {stats.totalScore}
                    <span className="text-base font-normal text-gray-400">/100</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeof stats.band === 'object' ? stats.band.color : ''}`}>
                    {typeof stats.band === 'object' ? stats.band.label : stats.band}
                  </span>
                </div>

                <span className="text-gray-400 ml-2">{isExpanded ? "▲" : "▼"}</span>
              </button>

              {/* Score bar */}
              <div className="px-5 pb-3">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      stats.totalScore >= 90 ? "bg-green-500"  :
                      stats.totalScore >= 80 ? "bg-blue-500"   :
                      stats.totalScore >= 70 ? "bg-orange-400" :
                                               "bg-red-500"
                    }`}
                    style={{ width: `${stats.totalScore}%` }}
                  />
                </div>
              </div>

              {/* Expanded KPI breakdown */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    KPI Breakdown
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {KPI_METRICS.map(metric => {
  const value = stats[metric.key as keyof typeof stats];
  const displayValue = typeof value === "object" ? "" : value;
  return (
    <div key={metric.key}
      className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-lg font-bold text-gray-800">
        {displayValue}{metric.unit}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{metric.label}</p>
      <p className="text-xs text-gray-400">Target: {metric.target}</p>
      <p className="text-xs text-gray-400">Weight: {metric.weight}</p>
    </div>
  );
                    })}
                  </div>

                  {/* Governance rules */}
                  <div className="mt-4 space-y-1">
                    {stats.onTimeRate < 90 && (
                      <div className="bg-red-50 text-red-700 text-xs rounded-lg px-3 py-2">
                        ⚠️ On-time rate below 90% — performance review recommended
                      </div>
                    )}
                    {stats.slaBreachRate > 8 && (
                      <div className="bg-orange-50 text-orange-700 text-xs rounded-lg px-3 py-2">
                        ⚠️ SLA breach rate above 8% — quality audit triggered
                      </div>
                    )}
                    {stats.avgResolutionTime > 7 && (
                      <div className="bg-yellow-50 text-yellow-700 text-xs rounded-lg px-3 py-2">
                        ⚠️ Average resolution time exceeds 7 days — review workload
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Performance Bands
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { range: "90–100", label: "Excellent",        color: "bg-green-100  text-green-700"  },
            { range: "80–89",  label: "Very Good",         color: "bg-blue-100   text-blue-700"   },
            { range: "70–79",  label: "Needs Improvement", color: "bg-orange-100 text-orange-700" },
            { range: "<70",    label: "Unacceptable",      color: "bg-red-100    text-red-700"    },
          ].map(b => (
            <div key={b.range} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${b.color}`}>
              {b.range} — {b.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}