"use client";

import { useState, useEffect } from "react";
import { getSuppliers, createSupplier } from "@/app/actions/suppliers";

type Supplier = { id: string; name: string; phone?: string | null; email?: string | null; address?: string | null; };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState<Record<string, string[]>>({});

  useEffect(() => {
    getSuppliers().then(setSuppliers);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const form = new FormData(e.currentTarget);
    const data = {
      name:    form.get("name")    as string,
      phone:   form.get("phone")   as string,
      email:   form.get("email")   as string,
      address: form.get("address") as string,
    };

    const result = await createSupplier(data);

    if (result.error) {
      setErrors(result.error as Record<string, string[]>);
      setLoading(false);
    } else {
      const updated = await getSuppliers();
      setSuppliers(updated);
      setShowForm(false);
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
          <p className="text-gray-500 text-sm mt-1">{suppliers.length} total suppliers</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
          {showForm ? "Cancel" : "+ Add Supplier"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">New Supplier</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input name="name" type="text" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input name="address" type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2 flex justify-end">
              <button type="submit" disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                {loading ? "Saving..." : "Save Supplier"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-12 text-gray-400">
                  No suppliers yet. Add your first supplier.
                </td>
              </tr>
            )}
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{s.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{s.phone ?? "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{s.email ?? "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{s.address ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}