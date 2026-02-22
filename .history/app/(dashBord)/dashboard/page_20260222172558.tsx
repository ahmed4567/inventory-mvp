import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500">Total Products</h2>
          <p className="text-3xl font-bold text-gray-800 mt-1">0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500">Stock Value</h2>
          <p className="text-3xl font-bold text-gray-800 mt-1">$0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500">Monthly Sales</h2>
          <p className="text-3xl font-bold text-gray-800 mt-1">$0</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Low Stock Alerts</h2>
          <p className="text-gray-400 text-sm">No alerts at the moment.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <p className="text-gray-400 text-sm">No recent activity.</p>
        </div>
      </div>
    </div>
  );
}