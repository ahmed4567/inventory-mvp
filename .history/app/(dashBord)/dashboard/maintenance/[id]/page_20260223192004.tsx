"use client";

import { use, useEffect, useState } from "react";
import {
  getMaintenance,
  updateMaintenanceStatus,
  updateServiceFee,
} from "@/app/actions/maintenance";
import { assignMaintenance } from "@/app/actions/maintenance";

import Link from "next/link";


const [users, setUsers]         = useState<{id:string; name:string|null; email:string}[]>([]);
const [assigning, setAssigning] = useState(false);
const statusColors: Record<string, string> = {
  RECEIVED:           "bg-yellow-100 text-yellow-700",
  IN_PROGRESS:        "bg-blue-100 text-blue-700",
  WAITING_FOR_PARTS:  "bg-orange-100 text-orange-700",
  REPAIRED:           "bg-green-100 text-green-700",
  DELIVERED:          "bg-gray-100 text-gray-600",
  CANCELLED:          "bg-red-100 text-red-600",
};

const handlerLabels: Record<string, string> = {
  IN_HOUSE:            "🔧 Our Workshop",
  SPECIALIST_SUPPLIER: "🏭 Specialist Supplier",
  ORIGINAL_VENDOR:     "🏷️ Original Vendor",
};

const timeline = ["RECEIVED", "IN_PROGRESS", "REPAIRED", "DELIVERED"];

type Item = Awaited<ReturnType<typeof getMaintenance>> & { 
  status: string;
  productName: string;
  productBrand?: string;
  productModel?: string;
  serialNumber?: string;
  issueDescription: string;
  notes?: string;
  customer: { name: string; phone?: string; email?: string };
  handler: string;
  supplier?: { name: string };
  vendorName?: string;
};

export default function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }    = use(params);
  const [item, setItem]           = useState<Item | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error,   setError]       = useState("");
  const [editFee, setEditFee]     = useState(false);
  const [feeInput, setFeeInput]   = useState("");

  useEffect(() => {
    
    getMaintenance(id).then((data) => {
      if (data) {
        let status = "RECEIVED";
        if (data.deliveredAt) status = "DELIVERED";
        else if (data.repairedAt) status = "REPAIRED";
        setItem({ ...data, status } as Item);
      } else setItem(null);
    });
  }, [id]);

  function refresh() {
    getMaintenance(id).then((data) => {
      if (data) {
        let status = "RECEIVED";
        if (data.deliveredAt) status = "DELIVERED";
        else if (data.repairedAt) status = "REPAIRED";
        setItem({ ...data, status } as Item);
      } else setItem(null);
    });
  }

  if (!item) return null;

  const isClosed = ["DELIVERED", "CANCELLED"].includes(item.status);

  async function transition(
    newStatus: "IN_PROGRESS" | "WAITING_FOR_PARTS" | "REPAIRED" | "DELIVERED" | "CANCELLED"
  ) {
    setLoading(true);
    setError("");
    const result = await updateMaintenanceStatus(id, newStatus);
    if (!result.success) {
      setError("Failed to update status. Please try again.");
    } else {
      refresh();
    }
    setLoading(false);
  }

  async function saveFee() {
    await updateServiceFee(id, Number(feeInput));
    setEditFee(false);
    refresh();
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{item.productName}</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {[item.productBrand, item.productModel].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusColors[item.status]}`}>
          {item.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4 mb-5">

        {/* Customer */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer</p>
          <p className="text-sm font-semibold text-gray-800">{item.customer.name}</p>
          {item.customer.phone && <p className="text-xs text-gray-400 mt-0.5">{item.customer.phone}</p>}
          {item.customer.email && <p className="text-xs text-gray-400">{item.customer.email}</p>}
        </div>

        {/* Handler */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Handler</p>
          <p className="text-sm font-semibold text-gray-800">{handlerLabels[item.handler]}</p>
          {item.supplier  && <p className="text-xs text-gray-400 mt-0.5">{item.supplier.name}</p>}
          {item.vendorName && <p className="text-xs text-gray-400 mt-0.5">{item.vendorName}</p>}
        </div>

        {/* Serial / dates */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Details</p>
          {item.serialNumber && (
            <p className="text-sm text-gray-700 font-mono">S/N: {item.serialNumber}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Received: {new Date(item.receivedAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric"
            })}
          </p>
          {item.repairedAt && (
            <p className="text-xs text-gray-400">
              Repaired: {new Date(item.repairedAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric"
              })}
            </p>
          )}
          {item.deliveredAt && (
            <p className="text-xs text-gray-400">
              Delivered: {new Date(item.deliveredAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric"
              })}
            </p>
          )}
        </div>

        {/* Service fee */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Service Fee</p>
          {editFee ? (
            <div className="flex gap-2 items-center">
              <input
                type="number" step="0.01" min="0"
                value={feeInput}
                onChange={(e) => setFeeInput(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus />
              <button onClick={saveFee}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                Save
              </button>
              <button onClick={() => setEditFee(false)}
                className="text-xs text-gray-400 hover:text-gray-600">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-800">
                {item.serviceFee ? `$${Number(item.serviceFee).toFixed(2)}` : "—"}
              </p>
              {!isClosed && (
                <button
                  onClick={() => { setFeeInput(String(item.serviceFee ?? "")); setEditFee(true); }}
                  className="text-xs text-blue-600 hover:underline">
                  {item.serviceFee ? "Edit" : "Set fee"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Issue */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Issue Description</p>
        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{item.issueDescription}</p>
        {item.notes && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-2">Notes</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{item.notes}</p>
          </>
        )}
      </div>

      {/* Timeline */}
      {item.status !== "CANCELLED" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Progress</p>
          <div className="flex items-center">
            {timeline.map((step, i) => {
              const stepIndex = timeline.indexOf(item.status);
              const isDone    = i <= stepIndex;
              const isCurrent = step === item.status;
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      isCurrent ? "border-blue-500 bg-blue-500 text-white"
                      : isDone  ? "border-green-500 bg-green-500 text-white"
                      :           "border-gray-200 bg-white text-gray-400"
                    }`}>
                      {isDone && !isCurrent ? "✓" : i + 1}
                    </div>
                    <p className={`text-xs mt-1 text-center whitespace-nowrap ${
                      isCurrent ? "text-blue-600 font-semibold"
                      : isDone  ? "text-green-600"
                      :           "text-gray-400"
                    }`}>
                      {step.replace(/_/g, " ")}
                    </p>
                  </div>
                  {i < timeline.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 mb-4 ${
                      i < stepIndex ? "bg-green-400" : "bg-gray-200"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm mb-5">
          ⚠️ {error}
        </div>
      )}

      {/* Actions */}
      {!isClosed && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Update Status</p>
          <div className="flex flex-wrap gap-3">

            {item.status === "RECEIVED" && (
              <button onClick={() => transition("IN_PROGRESS")} disabled={loading}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                🔧 Start Repair
              </button>
            )}

            {item.status === "IN_PROGRESS" && (
              <>
                <button onClick={() => transition("WAITING_FOR_PARTS")} disabled={loading}
                  className="bg-orange-500 text-white px-5 py-2 rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50">
                  ⏳ Waiting for Parts
                </button>
                <button onClick={() => transition("REPAIRED")} disabled={loading}
                  className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
                  ✅ Mark as Repaired
                </button>
              </>
            )}

            {item.status === "WAITING_FOR_PARTS" && (
              <button onClick={() => transition("IN_PROGRESS")} disabled={loading}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                🔧 Resume Repair
              </button>
            )}

            {item.status === "REPAIRED" && (
              <button onClick={() => transition("DELIVERED")} disabled={loading}
                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
                📦 Mark as Delivered
              </button>
            )}

            <button onClick={() => {
              if (confirm("Cancel this maintenance job?")) transition("CANCELLED");
            }} disabled={loading}
              className="border border-red-300 text-red-600 px-5 py-2 rounded-lg hover:bg-red-50 font-medium disabled:opacity-50">
              Cancel Job
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            {item.status === "RECEIVED"          && "Start the repair when your team begins working on it."}
            {item.status === "IN_PROGRESS"        && "Mark waiting if you need parts. Mark repaired when done."}
            {item.status === "WAITING_FOR_PARTS"  && "Resume when the parts arrive."}
            {item.status === "REPAIRED"           && "Mark delivered when the customer picks up the item."}
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