"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Something went wrong</h2>
        <p className="text-gray-500 text-sm mb-4">{error.message}</p>
        <button onClick={reset}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm">
          Try Again
        </button>
      </div>
    </div>
  );
}