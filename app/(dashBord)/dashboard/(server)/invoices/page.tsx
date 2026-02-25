import { getInvoices } from "@/app/actions/invoices";
import Link from "next/link";

const typeColors: Record<string, string> = {
  SALE:     "bg-green-100 text-green-700",
  PURCHASE: "bg-blue-100 text-blue-700",
};

const statusColors: Record<string, string> = {
  CONFIRMED:  "bg-gray-100 text-gray-600",
  DRAFT:      "bg-yellow-100 text-yellow-700",
  CANCELLED:  "bg-red-100 text-red-600",
};

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
          <p className="text-gray-500 text-sm mt-1">{invoices.length} total invoices</p>
        </div>
        <Link href="/dashboard/invoices/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
          + New Invoice
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice #</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Party</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No invoices yet. Create your first invoice.
                </td>
              </tr>
            )}
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm font-semibold text-gray-800">
                  {inv.invoiceNumber}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${typeColors[inv.type]}`}>
                    {inv.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {inv.customer?.name ?? inv.supplier?.name ?? "—"}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                  ${inv.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[inv.status]}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {new Date(inv.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric"
                  })}
                </td>
                <td className="px-6 py-4">
                  <Link href={`/dashboard/invoices/${inv.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}