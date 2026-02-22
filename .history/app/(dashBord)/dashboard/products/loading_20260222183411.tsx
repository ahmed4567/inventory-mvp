export default function ProductsLoading() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="flex justify-between mb-6">
        <div className="h-8 bg-gray-200 rounded w-32" />
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-12 bg-gray-50 border-b border-gray-100" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-4 px-6 py-4 border-b border-gray-50">
            <div className="h-4 bg-gray-200 rounded flex-1" />
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-12" />
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}