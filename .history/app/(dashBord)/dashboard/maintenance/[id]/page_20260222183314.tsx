"use client";

import { use, useEffect, useState } from "react";
import { getMaintenance, updateMaintenanceStatus } from "@/app/actions/maintenance";
import { useRouter } from "next/navigation";
import Link from "next/link";

type MaintenanceItem = {
  id: string; status: string; productId: string;
  serialNumber: string; issueDescription: string;
  cost: number | null; createdAt: string;
  startedAt: string | null; completedAt: string | null;
  product: { name: string; sku: string };
};

const statusColors: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED:   "bg-green-100 text-green-700",
  RETURNED:    "bg-gray-100 text-gray-600",
  CANCELLED:   "bg-red-100 text-red-600",
};

const timeline = ["PENDING", "IN_PROGRESS", "COMPLETED", "RETURNED"];

export default function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }    = use(params);
  const router    = useRouter();
  const [item, setItem]       = useState<MaintenanceItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => { getMaintenance(id).then(setItem); }, [id]);

  if (!item) return null;

  const isClosed = ["RETURNED", "CANCELLED"].includes(item.status);

  async function transition(newStatus: "IN_PROGRESS" | "COMPLETED" | "RETURNED" | "CANCELLED") {
    const confirmMessages: Record<string, string> = {
      IN_PROGRESS: "Send this item for repair? This will remove 1 unit from stock.",
      COMPLETED:   "Mark as repaired? Item is still out of stock until returned.",
      RETURNED:    "Return to stock? This will add 1 unit back to inventory.",
      CANCELLED:   "Cancel this maintenance item?",
    };

    if (!confirm(confirmMessages[newStatus])) return;

    setLoading(true);
    setError("");
    const result = await updateMaintenanceStatus(id, newStatus);

    if (result.error) {
      setError(result.error as string);
      setLoading(false);
    } else {
      getMaintenance(id).then(setItem);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{item.product.name}</h1>
          <p className="text-gray-400 font-mono text-sm mt-1">{item.product.sku}</p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusColors[item.status]}`}>
          {item.status.replace("_", " ")}
        </span>
      </div>

      {/* Details card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Serial Number</p>
            <p className="text-gray-800 font-mono mt-1">{item.serialNumber}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Repair Cost</p>
            <p className="text-gray-800 mt-1">
              {item.cost ? `$${item.cost.toFixed(2)}` : "Not set"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Logged On</p>
            <p className="text-gray-800 mt-1">
              {new Date(item.createdAt).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric"
              })}
            </p>
          </div>
          {item.startedAt && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sent for Repair</p>
              <p className="text-gray-800 mt-1">
                {new Date(item.startedAt).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric"
                })}
              </p>
            </div>
          )}
          {item.completedAt && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Repair Completed</p>
              <p className="text-gray-800 mt-1">
                {new Date(item.completedAt).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric"
                })}
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Issue Description</p>
          <p className="text-gray-800 bg-gray-50 rounded-lg p-3 text-sm">{item.issueDescription}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Progress</p>
        <div className="flex items-center gap-2">
          {timeline.map((step, i) => {
            const stepIndex    = timeline.indexOf(item.status);
            const isDone       = i <= stepIndex && !["CANCELLED"].includes(item.status);
            const isCurrent    = step === item.status;
            return (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    isCurrent
                      ? "border-blue-500 bg-blue-500 text-white"
                      : isDone
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-200 bg-white text-gray-400"
                  }`}>
                    {isDone && !isCurrent ? "✓" : i + 1}
                  </div>
                  <p className={`text-xs mt-1 text-center ${isCurrent ? "text-blue-600 font-semibold" : isDone ? "text-green-600" : "text-gray-400"}`}>
                    {step.replace("_", " ")}
                  </p>
                </div>
                {i < timeline.length - 1 && (
                  <div className={`h-0.5 flex-1 mb-4 ${isDone && i < stepIndex ? "bg-green-400" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm mb-5">
          ⚠️ {error}
        </div>
      )}

      {/* Action buttons */}
      {!isClosed && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Actions</p>
          <div className="flex flex-wrap gap-3">

            {item.status === "PENDING" && (
              <button onClick={() => transition("IN_PROGRESS")} disabled={loading}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                🔧 Send for Repair
              </button>
            )}

            {item.status === "IN_PROGRESS" && (
              <button onClick={() => transition("COMPLETED")} disabled={loading}
                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
                ✅ Mark as Repaired
              </button>
            )}

            {item.status === "COMPLETED" && (
              <button onClick={() => transition("RETURNED")} disabled={loading}
                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
                📦 Return to Stock
              </button>
            )}

            <button onClick={() => transition("CANCELLED")} disabled={loading}
              className="border border-red-300 text-red-600 px-5 py-2 rounded-lg hover:bg-red-50 font-medium disabled:opacity-50">
              Cancel
            </button>

          </div>

          {/* Helpful context per status */}
          <p className="text-xs text-gray-400 mt-3">
            {item.status === "PENDING"     && "Sending for repair will remove 1 unit from stock."}
            {item.status === "IN_PROGRESS" && "Item is currently out of stock. Mark repaired when fixed."}
            {item.status === "COMPLETED"   && "Item is repaired. Return to stock to add 1 unit back."}
          </p>
        </div>
      )}

      <Link href="/dashboard/maintenance"
        className="text-sm text-gray-500 hover:text-gray-700">
        ← Back to Maintenance
      </Link>
    </div>
  );
}