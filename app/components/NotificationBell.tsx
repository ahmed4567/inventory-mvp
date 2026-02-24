"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getMyNotifications,
  getMyUnreadCount,
  markNotificationRead,
  markAllMyNotificationsRead,
} from "@/app/actions/notifications";

type Notification = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: Date;
};

const typeIcon: Record<string, string> = {
  NEW_REGISTRATION:           "👤",
  PASSWORD_RESET_REQUEST:     "🔑",
  MAINTENANCE_ASSIGNED:       "🛠️",
  MAINTENANCE_STATUS_CHANGED: "🔄",
  ACCOUNT_APPROVED:           "✅",
  MESSAGE:                    "💬",
};

export default function NotificationBell() {
  const router                        = useRouter();
  const [open, setOpen]               = useState(false);
  const [count, setCount]             = useState(0);
  const [items, setItems]             = useState<Notification[]>([]);
  const [loading, setLoading]         = useState(false);
  const panelRef                      = useRef<HTMLDivElement>(null);

  async function refresh() {
    const unread = await getMyUnreadCount();
    setCount(unread);
  }

  async function loadNotifications() {
    setLoading(true);
    const data = await getMyNotifications();
    setItems(data as any);
    setLoading(false);
  }

  // Poll every 30 seconds
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load notifications when panel opens
  useEffect(() => {
    if (open) loadNotifications();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleNotificationClick(n: Notification) {
    if (!n.read) {
      await markNotificationRead(n.id);
      setItems((prev) => prev.map((i) => i.id === n.id ? { ...i, read: true } : i));
      setCount((c) => Math.max(0, c - 1));
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  }

  async function handleMarkAllRead() {
    await markAllMyNotificationsRead();
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    setCount(0);
  }

  // Don't render if no notifications ever
  if (count === 0 && items.length === 0 && !open) return null;

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-50">

      {/* Panel */}
      {open && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl
                        border border-gray-100 overflow-hidden mb-2">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
            {count > 0 && (
              <button onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {loading && (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                Loading...
              </div>
            )}
            {!loading && items.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                No notifications
              </div>
            )}
            {!loading && items.map((n) => (
              <button key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`w-full text-left px-4 py-3 flex gap-3 items-start
                            hover:bg-gray-50 transition ${!n.read ? "bg-blue-50" : ""}`}>
                <span className="text-lg flex-shrink-0 mt-0.5">
                  {typeIcon[n.type] ?? "🔔"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.read ? "text-gray-800 font-medium" : "text-gray-600"}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating bell button — only show if there are notifications */}
      {(count > 0 || open) && (
        <button
          onClick={() => setOpen(!open)}
          className="w-14 h-14 bg-[#1A56DB] hover:bg-[#1E429F] text-white rounded-full
                     shadow-lg flex items-center justify-center transition-all
                     hover:scale-105 active:scale-95 relative">
          <span className="text-2xl">🔔</span>
          {count > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold
                             rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      )}
    </div>
  );
}