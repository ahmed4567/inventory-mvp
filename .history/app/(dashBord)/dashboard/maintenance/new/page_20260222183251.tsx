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
          </div>

        </form>
      </div>
    </div>
  );
}