"use client";

import { useEffect, useState } from "react";
import { getInvoice } from "@/app/actions/invoices";
import { use } from "react";

type Invoice = Awaited<ReturnType<typeof getInvoice>>;

export default function PrintInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }            = use(params);
  const [invoice, setInvoice] = useState<Invoice>(null);

  useEffect(() => {
    getInvoice(id).then(setInvoice);
  }, [id]);

  useEffect(() => {
    if (invoice) {
      setTimeout(() => window.print(), 500);
    }
  }, [invoice]);

  if (!invoice) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400">Loading invoice...</p>
    </div>
  );

  const issuedDate = new Date(invoice.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  const total = invoice.items?.reduce((sum: number, item: any) =>
    sum + Number(item.unitPrice) * item.quantity, 0) ?? Number(invoice.total);

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          @page { margin: 15mm; }
        }
        body { font-family: 'Segoe UI', sans-serif; background: #f9fafb; }
      `}</style>

      {/* Print button — hidden on print */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-lg">
          🖨️ Print
        </button>
        <button onClick={() => window.close()}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium shadow-lg">
          ✕ Close
        </button>
      </div>

      {/* Invoice */}
      <div className="min-h-screen bg-white max-w-3xl mx-auto p-10 shadow-md my-8">

        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            {/* Brand */}
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center
                              text-white font-bold text-lg">
                📦
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Inventory MVP</h1>
                <p className="text-xs text-gray-400">Inventory & Service Management</p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-3xl font-bold text-blue-600">
              {invoice.type === "SALE" ? "INVOICE" : "PURCHASE ORDER"}
            </h2>
            <p className="text-gray-500 text-sm mt-1 font-mono">{invoice.invoiceNumber}</p>
            <p className="text-gray-400 text-xs mt-1">{issuedDate}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-300 rounded-full mb-8" />

        {/* Bill to / from */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              {invoice.type === "SALE" ? "Bill To" : "Order From"}
            </p>
            <p className="font-semibold text-gray-800 text-lg">
              {invoice.customer?.name ?? invoice.supplier?.name ?? "—"}
            </p>
            {invoice.customer?.email && (
              <p className="text-sm text-gray-500">{invoice.customer.email}</p>
            )}
            {invoice.customer?.phone && (
              <p className="text-sm text-gray-500">{invoice.customer.phone}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Status</p>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
  String(invoice.status) === "CONFIRMED"  ? "bg-green-100 text-green-700" :
  String(invoice.status) === "DRAFT"  ? "bg-blue-100  text-blue-700"  :
   String(invoice.status) === "CANCELLED"  ?  "bg-gray-100  text-gray-600"
}`}>
  {String(invoice.status)}
</span>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="text-left px-4 py-3 text-sm font-semibold rounded-tl-lg">#</th>
              <th className="text-left px-4 py-3 text-sm font-semibold">Item</th>
              <th className="text-center px-4 py-3 text-sm font-semibold">Qty</th>
              <th className="text-right px-4 py-3 text-sm font-semibold">Unit Price</th>
              <th className="text-right px-4 py-3 text-sm font-semibold rounded-tr-lg">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item: any, i: number) => (
              <tr key={item.id}
                className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-800">{item.product?.name ?? "Item"}</p>
                  {item.product?.sku && (
                    <p className="text-xs text-gray-400 font-mono">{item.product.sku}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-700">{item.quantity}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">
                  ${Number(item.unitPrice).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-800">
                  ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="text-sm font-medium text-gray-800">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">Tax (0%)</span>
              <span className="text-sm text-gray-500">$0.00</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-gray-900 mt-1">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-xl text-blue-600">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-px bg-gray-200 mb-6" />
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Notes</p>
            <p className="text-xs text-gray-500">Thank you for your business.</p>
          </div>
          <div className="text-right">
            <div className="w-40 border-t border-gray-400 mb-1 mt-8" />
            <p className="text-xs text-gray-400">Authorized Signature</p>
          </div>
        </div>

        {/* Brand footer */}
        <div className="mt-8 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            📦 Inventory MVP · Generated on {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </>
  );
}