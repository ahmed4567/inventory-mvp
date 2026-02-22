import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <p className="text-8xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist.</p>
        <Link href="/dashboard"
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}