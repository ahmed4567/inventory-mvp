"use client";

import { useState, useEffect } from "react";
import { getProducts } from "@/app/actions/products";
import Link from "next/link";

export default function MaintenancePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Maintenance</h1>
          <p className="text-gray-500 text-sm mt-1">Track items under repair</p>
        </div>
        <Link href="/dashboard/maintenance/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
          + New Maintenance
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
        <p className="text-4xl mb-3">🛠️</p>
        <p className="text-gray-500">Maintenance module coming next.</p>
      </div>
    </div>
  );
}