"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createInvoice } from "@/app/actions/invoices";
import { getProducts } from "@/app/actions/products";
import { getCustomers } from "@/app/actions/customers";
import { getSuppliers } from "@/app/actions/suppliers";
import Link from "next/link";

type Product  = { id: string; name: string; sku: string; quantity: number; costPrice: number; sellingPrice: number; reorderLevel: number; };
type Customer = { id: string; name: string; };
type Supplier = { id: string; name: string; };
type LineItem = { productId: string; quantity: number; unitPrice: number; };

export default function NewInvoicePage() {
  const router = useRouter();
  const [type, setType]           = useState<"SALE" | "PURCHASE">("SALE");
  const [customerId, setCustomerId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems]         = useState<LineItem[]>([{ productId: "", quantity: 1, unitPrice: 0 }]);
  const [products, setProducts]   = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    getProducts().then(setProducts);
    getCustomers().then(setCustomers);
    getSuppliers().then(setSuppliers);
  }, []);

  function addItem() {
    setItems([...items, { productId: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill unit price when product is selected
    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[index].unitPrice = type === "SALE"
          ? product.sellingPrice
          : product.costPrice;
      }
    }
    setItems(updated);
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await createInvoice({
      type,
      customerId: type === "SALE" ? customerId : undefined,
      supplierId: type === "PURCHASE" ? supplierId : undefined,
      items: items.map((i) => ({
        ...i,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
      })),
    });

    if (result.error) {
      const errs = result.error as any;
      setError(errs.formErrors?.[0] ?? "Something went wrong");
      setLoading(false);
    } else {
      router.push(`/dashboard/invoices/${result.invoiceId}`);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">New Invoice</h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── TYPE SELECTOR ─────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Invoice Type</h2>
          <div className="flex gap-4">
            {(["SALE", "PURCHASE"] as const).map((t) => (
              <button key={t} type="button"
                onClick={() => { setType(t); setCustomerId(""); setSupplierId(""); }}
                className={`flex-1 py-3 rounded-lg border-2 font-semibold transition ${
                  type === t
                    ? t === "SALE"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}>
                {t === "SALE" ? "🧾 Sale" : "🛒 Purchase"}
              </button>
            ))}
          </div>
        </div>

        {/* ── CUSTOMER / SUPPLIER ───────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-4">
            {type === "SALE" ? "Customer" : "Supplier"}
          </h2>
          {type === "SALE" ? (
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required>
              <option value="">Select a customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          ) : (
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required>
              <option value="">Select a supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          {customers.length === 0 && type === "SALE" && (
            <p className="text-sm text-orange-500 mt-2">
              No customers yet.{" "}
              <Link href="/dashboard/customers" className="underline">Add one first →</Link>
            </p>
          )}
          {suppliers.length === 0 && type === "PURCHASE" && (
            <p className="text-sm text-orange-500 mt-2">
              No suppliers yet.{" "}
              <Link href="/dashboard/suppliers" className="underline">Add one first →</Link>
            </p>
          )}
        </div>

        {/* ── LINE ITEMS ────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Items</h2>

          <div className="space-y-3">
            {items.map((item, index) => {
              const selectedProduct = products.find((p) => p.id === item.productId);
              const isLow = selectedProduct && type === "SALE" &&
                item.quantity > selectedProduct.quantity;

              return (
                <div key={index} className="flex gap-3 items-start">

                  {/* Product selector */}
                  <div className="flex-1">
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, "productId", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      required>
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — Stock: {p.quantity}
                        </option>
                      ))}
                    </select>
                    {isLow && (
                      <p className="text-red-500 text-xs mt-1">
                        ⚠️ Only {selectedProduct!.quantity} in stock
                      </p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="w-24">
                    <input
                      type="number" min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Qty"
                      required />
                  </div>

                  {/* Unit price */}
                  <div className="w-32">
                    <input
                      type="number" min="0" step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Price"
                      required />
                  </div>

                  {/* Subtotal */}
                  <div className="w-28 py-2 text-sm font-semibold text-gray-700 text-right">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </div>

                  {/* Remove */}
                  <button type="button" onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="py-2 text-red-400 hover:text-red-600 disabled:opacity-30 text-lg">
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <button type="button" onClick={addItem}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
            + Add Item
          </button>

          {/* Total */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-800">
                ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
            {loading ? "Creating..." : "Create Invoice"}
          </button>
          <Link href="/dashboard/invoices"
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
            Cancel
          </Link>
        </div>

      </form>
    </div>
  );
}