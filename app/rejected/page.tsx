"use client";

import { signOut } from "next-auth/react";

export default function RejectedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-96 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">
          Account Not Approved
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Your account registration was not approved.
          Please contact your administrator for more information.
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