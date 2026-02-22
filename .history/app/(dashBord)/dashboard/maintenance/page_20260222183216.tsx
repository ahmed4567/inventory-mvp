import { getMaintenanceItems } from "@/app/actions/maintenance";
import Link from "next/link";

const statusColors: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED:   "bg-green-100 text-green-700",
  RETURNED:    "bg-gray-100 text-gray-600",
  CANCELLED:   "bg-red-100 text-red-600",
};

export default async function MaintenancePage() {
  const items = await getMaintenanceItems();

  const active    = items.filter((i) => ["PENDING","IN_PROGRESS","COMPLETED"].includes(i.status));
  const completed = items.filter((i) => ["RETURNED","CANCELLED"].includes(i.status));

  return (
    <div className="max-w-5xl mx-auto">

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Maintenance</h1>
          <p className="text-gray-500 text-sm mt-1">
            {active.length} active · {completed.length} closed
          </p>
        </div>
        <Link href="/dashboard/maintenance/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
          + New Item
        </Link>
      </div>

      {/* Active items */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Active
      </h2>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Serial No.</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Issue</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {active.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  No active maintenance items
                </td>
              </tr>
            )}
            {active.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-800">{item.product.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{item.product.sku}</p>
                </td>
                <td className="px-5 py-3 text-sm font-mono text-gray-600">{item.serialNumber}</td>
                <td className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">{item.issueDescription}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[item.status]}`}>
                    {item.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric"
                  })}
                </td>
                <td className="px-5 py-3">
                  <Link href={`/dashboard/maintenance/${item.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Closed items */}
      {completed.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Closed
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Serial No.</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Issue</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {completed.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 opacity-70">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-800">{item.product.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{item.product.sku}</p>
                    </td>
                    <td className="px-5 py-3 text-sm font-mono text-gray-600">{item.serialNumber}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">{item.issueDescription}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[item.status]}`}>
                        {item.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/maintenance/${item.id}`}
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
    </div>
  );
}