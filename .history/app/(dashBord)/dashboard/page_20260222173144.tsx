import { getDashboardStats } from "@/app/actions/dashboard";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const statusColors: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED:   "bg-green-100 text-green-700",
  RETURNED:    "bg-gray-100 text-gray-600",
  CANCELLED:   "bg-red-100 text-red-600",
};

const movementColors: Record<string, string> = {
  SALE:            "text-red-600",
  PURCHASE:        "text-green-600",
  MAINTENANCE_OUT: "text-orange-500",
  MAINTENANCE_IN:  "text-blue-500",
  ADJUSTMENT:      "text-purple-500",
};

const movementLabel: Record<string, string> = {
  SALE:            "Sale",
  PURCHASE:        "Purchase",
  MAINTENANCE_OUT: "Maintenance Out",
  MAINTENANCE_IN:  "Maintenance In",
  ADJUSTMENT:      "Adjustment",
};

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const stats = await getDashboardStats();

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── HEADER ───────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Live overview of your inventory
        </p>
      </div>

      {/* ── STAT CARDS ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm font-medium text-gray-500">Total Products</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">
            {stats.totalProducts}
          </p>
          <Link href="/dashboard/products"
            className="text-xs text-blue-600 hover:underline mt-2 inline-block">
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm font-medium text-gray-500">Stock Value</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">
            ${stats.totalStockValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-2">Based on cost price</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm font-medium text-gray-500">Monthly Sales</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">
            ${stats.monthlySales.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>

        <div className={`rounded-xl shadow-sm border p-5 ${
          stats.lowStockItems.length > 0
            ? "bg-red-50 border-red-200"
            : "bg-white border-gray-100"
        }`}>
          <p className={`text-sm font-medium ${
            stats.lowStockItems.length > 0 ? "text-red-600" : "text-gray-500"
          }`}>
            Low Stock Alerts
          </p>
          <p className={`text-3xl font-bold mt-1 ${
            stats.lowStockItems.length > 0 ? "text-red-700" : "text-gray-800"
          }`}>
            {stats.lowStockItems.length}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {stats.lowStockItems.length === 0
              ? "All products stocked"
              : "Products need reordering"}
          </p>
        </div>
      </div>

      {/* ── ROW 2: LOW STOCK + MAINTENANCE ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Low Stock */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">⚠️ Low Stock Items</h2>
            <Link href="/dashboard/products"
              className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.lowStockItems.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">
                ✅ All products are well stocked
              </p>
            ) : (
              stats.lowStockItems.map((item) => (
                <div key={item.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{item.quantity} left</p>
                    <p className="text-xs text-gray-400">reorder at {item.reorderLevel}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Maintenance Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">🛠️ Active Maintenance</h2>
            <Link href="/dashboard/maintenance"
              className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.maintenanceItems.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">
                No active maintenance items
              </p>
            ) : (
              stats.maintenanceItems.map((item) => (
                <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      S/N: {item.serialNumber} · {item.issueDescription}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${statusColors[item.status]}`}>
                    {item.status.replace("_", " ")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── RECENT STOCK MOVEMENTS ────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">🔄 Recent Stock Movements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentMovements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                    No stock movements yet
                  </td>
                </tr>
              ) : (
                stats.recentMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">
                      {m.productName}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold ${movementColors[m.type]}`}>
                        {movementLabel[m.type]}
                      </span>
                    </td>
                    <td className={`px-5 py-3 text-sm font-bold ${
                      m.quantity > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 font-mono">
                      {m.reference ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">
                      {new Date(m.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}