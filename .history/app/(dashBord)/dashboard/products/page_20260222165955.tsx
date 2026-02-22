import { getProducts } from "@/app/actions/products";
import Link from "next/link";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Products</h1>
            <p className="text-gray-500 mt-1">{products.length} total products</p>
          </div>
          <Link
            href="/dashboard/products/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            + Add Product
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">SKU</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Qty</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Cost</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Price</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Reorder At</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No products yet. Add your first product.
                  </td>
                </tr>
              )}
              {products.map((p) => {
                const isLow = p.quantity <= p.reorderLevel;
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800">{p.name}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-sm">{p.sku}</td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${isLow ? "text-red-600" : "text-gray-800"}`}>
                        {p.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">${Number(p.costPrice).toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-600">${Number(p.sellingPrice).toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-600">{p.reorderLevel}</td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
                          Low Stock
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/products/${p.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}