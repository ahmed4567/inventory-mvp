"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/app/actions/users";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form  = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const result = await requestPasswordReset(email);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md w-96 text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Request Sent</h1>
          <p className="text-gray-500 text-sm mb-6">
            A superuser has been notified of your password reset request.
            They will reset your password and share your temporary password with you directly.
          </p>
          <Link href="/login" className="text-blue-600 hover:underline text-sm">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-96">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">
          Forgot Password
        </h1>
        <p className="text-center text-gray-400 text-sm mb-6">
          We'll notify a superuser to reset your password
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
            {loading ? "Sending..." : "Send Reset Request"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/login" className="text-blue-600 hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}