"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <p className="text-8xl font-bold text-gray-200 mb-4">500</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
        <p className="text-gray-500 mb-8">An unexpected error occurred. Please try again.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium">
            Try Again
          </button>
          <Link href="/dashboard"
            className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 font-medium">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}