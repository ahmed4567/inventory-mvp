import { getInvoice } from "@/app/actions/invoices";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 font-mono">
            {invoice.invoiceNumber}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date(invoice.createdAt).toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric"
            })}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
            invoice.type === "SALE"
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"
          }`}>
            {invoice.type}
          </span>
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
            {invoice.status}
          </span>
        </div>
      </div>

      {/* Party info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
          {invoice.type === "SALE" ? "Customer" : "Supplier"}
        </p>
        <p className="text-gray-800 font-medium">
          {invoice.customer?.name ?? invoice.supplier?.name ?? "—"}
        </p>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">SKU</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Qty</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-3 text-sm text-gray-800 font-medium">{item.product.name}</td>
                <td className="px-5 py-3 text-sm text-gray-400 font-mono">{item.product.sku}</td>
                <td className="px-5 py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                <td className="px-5 py-3 text-sm text-gray-600 text-right">
                  ${item.unitPrice.toFixed(2)}
                </td>
                <td className="px-5 py-3 text-sm font-semibold text-gray-800 text-right">
                  ${item.subtotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-gray-200">
            <tr>
              <td colSpan={4} className="px-5 py-4 text-right font-semibold text-gray-700">
                Total
              </td>
              <td className="px-5 py-4 text-right text-xl font-bold text-gray-800">
                ${invoice.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <Link href="/dashboard/invoices"
        className="text-sm text-gray-500 hover:text-gray-700">
        ← Back to Invoices
      </Link>
      <a href={`/dashboard/invoices/${id}/print`} target="_blank"
  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium text-sm">
  🖨️ Print Invoice
</a>
    </div>
  );
}