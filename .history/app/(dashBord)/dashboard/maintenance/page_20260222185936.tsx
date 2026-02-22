import { getMaintenanceItems } from "@/app/actions/maintenance";
import Link from "next/link";

const statusColors: Record<string, string> = {
  RECEIVED:           "bg-yellow-100 text-yellow-700",
  IN_PROGRESS:        "bg-blue-100 text-blue-700",
  WAITING_FOR_PARTS:  "bg-orange-100 text-orange-700",
  REPAIRED:           "bg-green-100 text-green-700",
  DELIVERED:          "bg-gray-100 text-gray-600",
  CANCELLED:          "bg-red-100 text-red-600",
};

const handlerLabels: Record<string, string> = {
  IN_HOUSE:            "🔧 In-House",
  SPECIALIST_SUPPLIER: "🏭 Specialist",
  ORIGINAL_VENDOR:     "🏷️ Vendor",
};

type Repair = {
  id: string;
  serviceFee: number | null;
  createdAt: string;
  receivedAt: string;
  repairedAt: string | null;
  deliveredAt: string | null;
};

export default async function MaintenancePage() {
  const items = await getMaintenanceItems();

  const repairs = items.map(r => ({ ...r, id: r._id || r.uuid }));

  const itemsWithStatus = repairs.map((i) => ({
    ...i,
    id: i.id,
    status: i.deliveredAt ? "DELIVERED" : i.repairedAt ? "REPAIRED" : i.receivedAt ? "IN_PROGRESS" : "RECEIVED",
  }));

  const active = itemsWithStatus.filter((i) =>
    ["RECEIVED", "IN_PROGRESS", "WAITING_FOR_PARTS", "REPAIRED"].includes(i.status)
  );
  const closed = itemsWithStatus.filter((i) =>
    ["DELIVERED", "CANCELLED"].includes(i.status)
  );

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Maintenance</h1>
          <p className="text-gray-500 text-sm mt-1">
            {active.length} active jobs · {closed.length} closed
          </p>
        </div>
        <Link href="/dashboard/maintenance/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
          + New Job
        </Link>
      </div>

      {/* Active jobs */}
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Active Jobs
      </h2>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Issue</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Handler</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Fee</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {active.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No active maintenance jobs
                </td>
              </tr>
            )}
            {active.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-800">{item.customer.name}</p>
                  <p className="text-xs text-gray-400">{item.customer.phone ?? ""}</p>
                </td>
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-800">{item.productName}</p>
                  <p className="text-xs text-gray-400">
                    {[item.productBrand, item.productModel].filter(Boolean).join(" · ")}
                  </p>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">
                  {item.issueDescription}
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">
                  {handlerLabels[item.handler]}
                  {item.supplier && (
                    <p className="text-xs text-gray-400">{item.supplier.name}</p>
                  )}
                  {item.vendorName && (
                    <p className="text-xs text-gray-400">{item.vendorName}</p>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[item.status]}`}>
                    {item.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm font-medium text-gray-700">
                  {item.serviceFee ? `$${Number(item.serviceFee).toFixed(2)}` : "—"}
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

      {/* Closed jobs */}
      {closed.length > 0 && (
        <>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Closed Jobs
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Handler</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Fee</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {closed.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 opacity-70">
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{item.customer.name}</td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-gray-700">{item.productName}</p>
                      <p className="text-xs text-gray-400">
                        {[item.productBrand, item.productModel].filter(Boolean).join(" · ")}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{handlerLabels[item.handler]}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[item.status]}`}>
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-700">
                      {item.serviceFee ? `$${Number(item.serviceFee).toFixed(2)}` : "—"}
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