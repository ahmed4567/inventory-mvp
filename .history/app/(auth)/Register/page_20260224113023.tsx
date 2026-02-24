"use client";

import { useState } from "react";
import { registerUser } from "@/app/actions/users";
import Link from "next/link";

export default function RegisterPage() {
  const [errors,  setErrors]  = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const form = new FormData(e.currentTarget);
    const result = await registerUser({
      name:     form.get("name")     as string,
      username: form.get("username") as string,
      email:    form.get("email")    as string,
      password: form.get("password") as string,
    });

    if (result.error) {
      setErrors(result.error as Record<string, string[]>);
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md w-96 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Registration Submitted</h1>
          <p className="text-gray-500 text-sm mb-6">
            Your account is pending approval by a superuser.
            You will be able to log in once your account is approved.
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
          Create Account
        </h1>
        <p className="text-center text-gray-400 text-sm mb-6">
          Your account will need superuser approval
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input name="name" type="text" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2
                         focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
            <input name="username" type="text" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Letters, numbers and underscores only" />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input name="email" type="email" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2
                         focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input name="password" type="password" required minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2
                         focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg
                       hover:bg-blue-700 font-medium disabled:opacity-50">
            {loading ? "Submitting..." : "Register"}
          </button>

        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}