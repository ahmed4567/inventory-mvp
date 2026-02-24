"use client";

import { signOut } from "next-auth/react";

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-96 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">
          Account Pending Approval
        </h1>
        <p className="text-gray-500 text-sm mb-2">
          Your account is currently awaiting approval from a superuser.
        </p>
        <p className="text-gray-400 text-xs mb-6">
          Please check back later or contact your administrator.
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-red-500 hover:text-red-700">
          Sign out
        </button>
      </div>
    </div>
  );
}