"use client";
 import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
 import NotificationBell from "@/app/components/NotificationBell";

 
const allNavItems = [
  { href: "/dashboard",             icon: "📊", label: "Dashboard",   superOnly: false },
  { href: "/dashboard/products",    icon: "📦", label: "Products",    superOnly: false },
  { href: "/dashboard/invoices",    icon: "🧾", label: "Invoices",    superOnly: false },
  { href: "/dashboard/maintenance", icon: "🛠️", label: "Maintenance", superOnly: false },
  { href: "/dashboard/customers",   icon: "👥", label: "Customers",   superOnly: true  },
  { href: "/dashboard/suppliers",   icon: "🚚", label: "Suppliers",   superOnly: true  },
  { href: "/dashboard/users",       icon: "🔐", label: "Users",       superOnly: true  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
const { data: session } = useSession();
const role = (session?.user as any)?.role;

const navItems = allNavItems.filter(
  (item) => !item.superOnly || role === "SUPERUSER"
);
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* ── SIDEBAR ────────────────────────────────────────── */}
      <aside className={`
        flex flex-col bg-[#1E2761] text-white transition-all duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-64"}
      `}>

        {/* Logo + collapse button */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
 
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight truncate">
              📦 Inventory
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition ml-auto"
            title={collapsed ? "Expand" : "Collapse"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {collapsed
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
              }
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
  const isActive = pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(item.href));
  const isUsers  = item.href === "/dashboard/users";

  return (
    <Link key={item.href} href={item.href}
      title={collapsed ? item.label : undefined}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative
        ${isActive
          ? "bg-white/20 text-white font-semibold"
          : "text-white/70 hover:bg-white/10 hover:text-white"
        }
        ${collapsed ? "justify-center" : ""}
      `}>
      <span className="text-xl flex-shrink-0">{item.icon}</span>
      {!collapsed && (
        <span className="text-sm truncate flex-1">{item.label}</span>
      )}
    </Link>
  );
})}
        </nav>

        {/* ── PROFILE SECTION ──────────────────────────────── */}
        <div className="border-t border-white/10 p-2 relative">
        { href: "/dashboard/settings", icon: "⚙️", label: "Settings", superOnly: false },
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              hover:bg-white/10 transition-all
              ${collapsed ? "justify-center" : ""}
            `}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center
                            text-white font-bold text-sm shrink-0">
              {session?.user?.email?.[0]?.toUpperCase() ?? "A"}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {session?.user?.email ?? "Admin"}
                  </p>
                  <p className="text-xs text-white/50">Administrator</p>
                </div>
                <svg className={`w-4 h-4 text-white/50 transition-transform shrink-0
                                 ${profileOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            )}
          </button>

          {/* Profile dropdown */}
          {profileOpen && (
            <div className={`
              absolute bottom-full mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50
              ${collapsed ? "left-16 w-48" : "left-2 right-2"}
            `}>
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {session?.user?.email}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Administrator</p>
              </div>

              <button
                onClick={() => {
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700
                           hover:bg-gray-50 transition"
              >
                <span>⚙️</span> Settings
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600
                           hover:bg-red-50 transition"
              >
                <span>🚪</span> Sign Out
              </button>
            </div>
          )}
        </div>

      </aside>

      {/* ── MAIN CONTENT ───────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">

        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-gray-500 text-sm">
            {navItems.find(i =>
              i.href === pathname ||
              (i.href !== "/dashboard" && pathname.startsWith(i.href))
            )?.label ?? "Dashboard"}
          </h2>
          <div className="text-sm text-gray-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric"
            })}
          </div>
        </div>

        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
{/* Floating notification bell */}
    <NotificationBell />
      </main>
      
    </div>
  );
}