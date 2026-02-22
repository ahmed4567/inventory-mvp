export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 h-28">
            <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-5">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 h-48" />
        ))}
      </div>
    </div>
  );
}