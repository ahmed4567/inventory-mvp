"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createMaintenance } from "@/app/actions/maintenance";
import { getProducts } from "@/app/actions/products";
import Link from "next/link";

type Product = { id: string; name: string; sku: string; quantity: number; reorderLevel: number; };

export default function NewMaintenancePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [errors, setErrors]     = useState<Record<string, string[]>>({});
  const [loading, setLoading]   = useState(false);

  useEffect(() => { getProducts().then(setProducts); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const form = new FormData(e.currentTarget);
    const data = {
      productId:        form.get("productId")        as string,
      serialNumber:     form.get("serialNumber")     as string,
      issueDescription: form.get("issueDescription") as string,
      cost:             form.get("cost") ? Number(form.get("cost")) : undefined,
    };

    const result = await createMaintenance(data);

    if (result.error) {
      setErrors(result.error as Record<string, string[]>);
      setLoading(false);
    } else {
      router.push("/dashboard/maintenance");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">New Maintenance Item</h1>
      <p className="text-gray-500 text-sm mb-6">Log an item that needs repair or servicing</p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
            <select name="productId" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select a product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Stock: {p.quantity}
                </option>
              ))}
            </select>
            {errors.productId && <p className="text-red-500 text-xs mt-1">{errors.productId[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number *</label>
            <input name="serialNumber" type="text" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. SN-123456" />
            {errors.serialNumber && <p className="text-red-500 text-xs mt-1">{errors.serialNumber[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description *</label>
            <textarea name="issueDescription" required rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the problem..." />
            {errors.issueDescription && <p className="text-red-500 text-xs mt-1">{errors.issueDescription[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repair Cost ($) <span className="text-gray-400 font-normal">— optional</span>
            </label>
            <input name="cost" type="number" step="0.01" min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
              {loading ? "Saving..." : "Log Item"}
            </button>
            <Link href="/dashboard/maintenance"
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
              Cancel
            </Link>
          </div>"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createMaintenance } from "@/app/actions/maintenance";
import { getProducts } from "@/app/actions/products";
import { getCustomers } from "@/app/actions/customers";
import { getSuppliers } from "@/app/actions/suppliers";
import Link from "next/link";

type Product  = { id: string; name: string; sku: string; quantity: number; reorderLevel: number; };
type Customer = { id: string; name: string; phone?: string | null; };
type Supplier = { id: string; name: string; };

export default function NewMaintenancePage() {
  const router = useRouter();

  const [products,  setProducts]  = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [errors,    setErrors]    = useState<Record<string, string[]>>({});
  const [loading,   setLoading]   = useState(false);

  // Form state
  const [handler,       setHandler]       = useState<"IN_HOUSE"|"SPECIALIST_SUPPLIER"|"ORIGINAL_VENDOR">("IN_HOUSE");
  const [useExisting,   setUseExisting]   = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");

  useEffect(() => {
    getProducts().then(setProducts);
    getCustomers().then(setCustomers);
    getSuppliers().then(setSuppliers);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const form = new FormData(e.currentTarget);

    // Auto-fill productName from catalog if existing product selected
    let productName = form.get("productName") as string;
    let productId   = undefined;
    if (useExisting && selectedProduct) {
      const p = products.find((p) => p.id === selectedProduct);
      productName = p?.name ?? productName;
      productId   = selectedProduct;
    }

    const data = {
      customerId:       form.get("customerId")       as string,
      productId,
      productName,
      productBrand:     form.get("productBrand")     as string || undefined,
      productModel:     form.get("productModel")     as string || undefined,
      serialNumber:     form.get("serialNumber")     as string || undefined,
      issueDescription: form.get("issueDescription") as string,
      handler,
      supplierId:       form.get("supplierId")       as string || undefined,
      vendorName:       form.get("vendorName")       as string || undefined,
      serviceFee:       form.get("serviceFee") ? Number(form.get("serviceFee")) : undefined,
      notes:            form.get("notes")            as string || undefined,
    };

    const result = await createMaintenance(data);

    if (result.error) {
      setErrors(result.error as Record<string, string[]>);
      setLoading(false);
    } else {
      router.push(`/dashboard/maintenance/${result.id}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">New Maintenance Job</h1>
      <p className="text-gray-500 text-sm mb-6">Log a customer product for repair or servicing</p>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── CUSTOMER ──────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Customer</h2>
          <select name="customerId" required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.phone ? ` — ${c.phone}` : ""}
              </option>
            ))}
          </select>
          {errors.customerId && <p className="text-red-500 text-xs mt-1">{errors.customerId[0]}</p>}
          {customers.length === 0 && (
            <p className="text-orange-500 text-xs mt-2">
              No customers yet.{" "}
              <Link href="/dashboard/customers" className="underline">Add one first →</Link>
            </p>
          )}
        </div>

        {/* ── PRODUCT ───────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Product</h2>

          {/* Toggle: catalog vs custom */}
          <div className="flex gap-3 mb-4">
            <button type="button"
              onClick={() => { setUseExisting(false); setSelectedProduct(""); }}
              className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition ${
                !useExisting
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-500"
              }`}>
              Custom Product
            </button>
            <button type="button"
              onClick={() => setUseExisting(true)}
              className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition ${
                useExisting
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-500"
              }`}>
              From Our Catalog
            </button>
          </div>

          {useExisting ? (
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              required={useExisting}>
              <option value="">Select product from catalog...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          ) : (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input name="productName" type="text" required={!useExisting}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Laptop, Printer, Air Conditioner" />
              {errors.productName && <p className="text-red-500 text-xs mt-1">{errors.productName[0]}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input name="productBrand" type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Samsung, HP" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input name="productModel" type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Galaxy S21" />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
            <input name="serialNumber" type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional" />
          </div>
        </div>

        {/* ── ISSUE ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Issue</h2>
          <textarea name="issueDescription" required rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the problem the customer reported..." />
          {errors.issueDescription && <p className="text-red-500 text-xs mt-1">{errors.issueDescription[0]}</p>}
        </div>

        {/* ── HANDLER ───────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Who handles the repair?</h2>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {([
              ["IN_HOUSE",            "🔧", "Our Workshop"],
              ["SPECIALIST_SUPPLIER", "🏭", "Specialist"],
              ["ORIGINAL_VENDOR",     "🏷️", "Vendor"],
            ] as const).map(([val, icon, label]) => (
              <button key={val} type="button"
                onClick={() => setHandler(val)}
                className={`py-3 rounded-lg border-2 text-sm font-medium transition flex flex-col items-center gap-1 ${
                  handler === val
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}>
                <span className="text-xl">{icon}</span>
                {label}
              </button>
            ))}
          </div>

          {/* Specialist supplier */}
          {handler === "SPECIALIST_SUPPLIER" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Supplier *</label>
              <select name="supplierId"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.supplierId && <p className="text-red-500 text-xs mt-1">{errors.supplierId[0]}</p>}
            </div>
          )}

          {/* Original vendor */}
          {handler === "ORIGINAL_VENDOR" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor / Manufacturer Name *</label>
              <input name="vendorName" type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Apple Support, Dell Service Center" />
              {errors.vendorName && <p className="text-red-500 text-xs mt-1">{errors.vendorName[0]}</p>}
            </div>
          )}
        </div>

        {/* ── SERVICE FEE & NOTES ───────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Service Fee & Notes</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Fee ($) <span className="text-gray-400 font-normal">— can be set later</span>
            </label>
            <input name="serviceFee" type="number" step="0.01" min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
            <textarea name="notes" rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes..." />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
            {loading ? "Saving..." : "Create Job"}
          </button>
          <Link href="/dashboard/maintenance"
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
            Cancel
          </Link>
        </div>

      </form>
    </div>
  );
}

        </form>
      </div>
    </div>
  );
}