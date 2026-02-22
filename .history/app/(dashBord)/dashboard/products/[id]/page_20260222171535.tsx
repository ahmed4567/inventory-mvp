"use client";

import { getProduct, updateProduct, softDeleteProduct } from "@/app/actions/products";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  name: string;
  sku: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    getProduct(params.id).then(setProduct);
  }, [params.id]);

  if (!product) return <div className="p-8 text-gray-500">Loading...</div>;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get("name") as string,
      sku: form.get("sku") as string,
      quantity: Number(form.get("quantity")),
      costPrice: Number(form.get("costPrice")),
      sellingPrice: Number(form.get("sellingPrice")),
      reorderLevel: Number(form.get("reorderLevel")),
    };

    const result = await updateProduct(params.id, data);

    if (result.error) {
      setErrors(result.error as Record<string, string[]>);
      setLoading(false);
    } else {
      router.push("/dashboard/products");
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await softDeleteProduct(params.id);
    router.push("/dashboard/products");
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit Product</h1>
        <p className="text-gray-500 mb-8">Update product details</p>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input name="name" type="text" defaultValue={product.name}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input name="sku" type="text" defaultValue={product.sku}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required />
              {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku[0]}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price ($)</label>
                <input name="costPrice" type="number" step="0.01" min="0"
                  defaultValue={Number(product.costPrice)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price ($)</label>
                <input name="sellingPrice" type="number" step="0.01" min="0"
                  defaultValue={Number(product.sellingPrice)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input name="quantity" type="number" min="0"
                  defaultValue={product.quantity}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                <input name="reorderLevel" type="number" min="0"
                  defaultValue={product.reorderLevel}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <div className="flex gap-3">
                <button type="submit" disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <Link href="/dashboard/products"
                  className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
                  Cancel
                </Link>
              </div>
              <button type="button" onClick={handleDelete}
                className="text-red-600 hover:text-red-800 font-medium text-sm">
                Delete Product
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}