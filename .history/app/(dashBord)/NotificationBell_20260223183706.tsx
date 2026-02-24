"use client";

import { useEffect, useState } from "react";
import { getUnreadNotifications } from "@/app/actions/notifications";
import Link from "next/link";

export default function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    getUnreadNotifications().then((n) => setCount(n.length));
    const interval = setInterval(() => {
      getUnreadNotifications().then((n) => setCount(n.length));
    }, 30000); // poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <Link href="/dashboard/users"
      className="relative flex items-center justify-center w-8 h-8 rounded-lg
                 bg-white/10 hover:bg-white/20 transition">
      <span className="text-lg">🔔</span>
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs
                       rounded-full w-4 h-4 flex items-center justify-center font-bold">
        {count > 9 ? "9+" : count}
      </span>
    </Link>
  );
}