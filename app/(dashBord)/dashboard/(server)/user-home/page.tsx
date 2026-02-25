"use client";

import { useEffect, useState, useMemo } from "react";
import { getUserDashboardData } from "@/app/actions/userDashboard";
import Link from "next/link";

const statusColors: Record<string, string> = {
  RECEIVED:          "bg-yellow-100 text-yellow-700",
  IN_PROGRESS:       "bg-blue-100 text-blue-700",
  WAITING_FOR_PARTS: "bg-orange-100 text-orange-700",
  REPAIRED:          "bg-green-100 text-green-700",
  DELIVERED:         "bg-gray-100 text-gray-600",
  CANCELLED:         "bg-red-100 text-red-600",
};

type DashData = Awaited<ReturnType<typeof getUserDashboardData>>;

export default function UserHomePage() {
  const [data,          setData]          = useState<DashData>(null);
  const [loading,       setLoading]       = useState(true);
  const [statusFilter,  setStatusFilter]  = useState("ALL");
  const [sortBy,        setSortBy]        = useState<"createdAt" | "status" | "customerName">("createdAt");
  const [sortDir,       setSortDir]       = useState<"asc" | "desc">("desc");
  const [search,        setSearch]        = useState("");
  const [activeTab,     setActiveTab]     = useState<"jobs" | "products">("jobs");

  useEffect(() => {
    getUserDashboardData().then(d => { setData(d); setLoading(false); });
  }, []);

  const filteredJobs = useMemo(() => {
    if (!data?.jobs) return [];
    let jobs = [...data.jobs];

    if (statusFilter !== "ALL") jobs = jobs.filter(j => j.status === statusFilter);
    if (search) jobs = jobs.filter(j =>
      j.productName.toLowerCase().includes(search.toLowerCase()) ||
      j.customerName.toLowerCase().includes(search.toLowerCase())
    );

    jobs.sort((a, b) => {
      let valA = a[sortBy as keyof typeof a] as string;
      let valB = b[sortBy as keyof typeof b] as string;
      return sortDir === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    return jobs;
  }, [data, statusFilter, search, sortBy, sortDir]);

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  }

  function SortIcon({ col }: { col: typeof sortBy }) {
    if (sortBy !== col) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-blue-500 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>
  );

  if (!data) return null;

  const { stats, products } = data;

  return (
    <div className="max-w-6xl mx-auto">

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "My Jobs",      value: stats.totalJobs,     icon: "🛠️", color: "bg-blue-50   text-blue-700"   },
          { label: "Active",       value: stats.activeJobs,    icon: "⚡", color: "bg-yellow-50 text-yellow-700" },
          { label: "Completed",    value: stats.completedJobs, icon: "✅", color: "bg-green-50  text-green-700"  },
          { label: "Waiting Parts",value: stats.urgentJobs,    icon: "⏳", color: "bg-orange-50 text-orange-700" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className={`text-2xl w-10 h-10 rounded-lg flex items-center justify-center ${stat.color} mb-3`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-5 w-fit">
        <button onClick={() => setActiveTab("jobs")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === "jobs" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}>
          🛠️ My Jobs ({data.jobs.length})
        </button>
        <button onClick={() => setActiveTab("products")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === "products" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}>
          📦 Products ({products.length})
        </button>
      </div>

      {/* Jobs Tab */}
      {activeTab === "jobs" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="text" placeholder="Search jobs or customers..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48
                         focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ALL">All Statuses</option>
              <option value="RECEIVED">Received</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_PARTS">Waiting for Parts</option>
              <option value="REPAIRED">Repaired</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Product
                  </th>
                  <th onClick={() => toggleSort("customerName")}
                    className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-700">
                    Customer <SortIcon col="customerName" />
                  </th>
                  <th onClick={() => toggleSort("status")}
                    className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-700">
                    Status <SortIcon col="status" />
                  </th>
                  <th onClick={() => toggleSort("createdAt")}
                    className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-700">
                    Received <SortIcon col="createdAt" />
                  </th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredJobs.length === 0 && (
                  <tr key="empty">
                    <td colSpan={5} className="text-center py-16">
                      <p className="text-4xl mb-2">🛠️</p>
                      <p className="text-gray-400 text-sm">No jobs match your filters</p>
                    </td>
                  </tr>
                )}
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-800">{job.productName}</p>
                      <p className="text-xs text-gray-400">
                        {[job.productBrand, job.productModel].filter(Boolean).join(" · ")}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-gray-700">{job.customerName}</p>
                      {job.customerPhone && (
                        <p className="text-xs text-gray-400">{job.customerPhone}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[job.status]}`}>
                        {job.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">
                      {new Date(job.receivedAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric"
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/maintenance/${job.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Products Tab */}
      {activeTab === "products" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.length === 0 && (
                <tr key="empty">
                  <td colSpan={4} className="text-center py-12 text-gray-400">No products yet</td>
                </tr>
              )}
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{p.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-400 font-mono">{p.sku}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{p.quantity} units</td>
                  <td className="px-5 py-3">
                    {p.lowStock ? (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-600">
                        ⚠ Low Stock
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                        ✓ In Stock
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}