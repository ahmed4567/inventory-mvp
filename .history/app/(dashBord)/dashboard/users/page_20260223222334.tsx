"use client";

import { useState, useEffect } from "react";
import {
  getUsers,
  createUser,
  approveUser,
  rejectUser,
  updateUserRole,
  resetUserPassword,
  deleteUser,
} from "@/app/actions/users";
import { getAllNotifications, markAllMyNotificationsRead } from "@/app/actions/notifications";
import { useSession } from "next-auth/react";

type User = {
  id: string; email: string; name: string | null;
  role: "SUPERUSER" | "USER"; status: "PENDING" | "ACTIVE" | "REJECTED";
  createdAt: Date;
};
type Notification = {
  id: string; type: string; message: string; read: boolean; createdAt: Date;
  user: { id: string; name: string | null; email: string; status: string };
};

const tabs = ["All Users", "Pending Approval", "Notifications"] as const;
type Tab = typeof tabs[number];

export default function UsersPage() {
  const { data: session }               = useSession();
  const [activeTab, setActiveTab]       = useState<Tab>("All Users");
  const [users, setUsers]               = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showForm, setShowForm]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errors, setErrors]             = useState<Record<string, string[]>>({});
  const [actionError, setActionError]   = useState("");
  const [tempPassword, setTempPassword] = useState<{email: string; password: string} | null>(null);

  function refresh() {
    getUsers().then(setUsers);
    getAllNotifications().then((n) => setNotifications(n as any));
  }

  useEffect(() => { refresh(); }, []);

  const pending       = users.filter((u) => u.status === "PENDING");
  const active        = users.filter((u) => u.status === "ACTIVE");
  const rejected      = users.filter((u) => u.status === "REJECTED");
  const unreadCount   = notifications.filter((n) => !n.read).length;
  const currentUserId = (session?.user as any)?.id;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const form = new FormData(e.currentTarget);
    const result = await createUser({
      email:    form.get("email")    as string,
      name:     form.get("name")     as string,
      password: form.get("password") as string,
      role:     form.get("role")     as string,
    });
    if (result.error && typeof result.error === "object") {
      setErrors(result.error as Record<string, string[]>);
    } else {
      refresh();
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  }

  async function handleApprove(user: User, role: "USER" | "SUPERUSER") {
    await approveUser(user.id, role);
    refresh();
  }

  async function handleReject(user: User) {
    if (!confirm(`Reject ${user.email}?`)) return;
    await rejectUser(user.id);
    refresh();
  }

  async function handleRoleToggle(user: User) {
    const newRole = user.role === "SUPERUSER" ? "USER" : "SUPERUSER";
    if (!confirm(`Change ${user.email} to ${newRole}?`)) return;
    await updateUserRole(user.id, newRole);
    refresh();
  }

  async function handleResetPassword(user: User) {
    if (!confirm(`Reset password for ${user.email}? A temporary password will be generated.`)) return;
    const result = await resetUserPassword(user.id);
    if (result.success && result.tempPassword) {
      setTempPassword({ email: user.email, password: result.tempPassword });
      refresh();
    }
  }

  async function handleDelete(user: User) {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    const result = await deleteUser(user.id);
    if (result.error) {
      setActionError(typeof result.error === "string" ? result.error : "Error");
    } else {
      refresh();
    }
  }

  async function handleMarkAllRead() {
  await markAllMyNotificationsRead();
  refresh();
}

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <p className="text-gray-500 text-sm mt-1">
            {active.length} active · {pending.length} pending
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
          {showForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {/* Temp password modal */}
      {tempPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h2 className="font-bold text-gray-800 text-lg mb-2">Password Reset</h2>
            <p className="text-gray-500 text-sm mb-4">
              Share this temporary password with <strong>{tempPassword.email}</strong>.
              They should change it after logging in.
            </p>
            <div className="bg-gray-100 rounded-lg p-3 font-mono text-center text-lg font-bold text-gray-800 mb-4 select-all">
              {tempPassword.password}
            </div>
            <button onClick={() => setTempPassword(null)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">
              Done — I've shared it
            </button>
          </div>
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm mb-4">
          ⚠️ {actionError}
        </div>
      )}

      {/* Add user form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">New User</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input name="name" type="text" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input name="email" type="email" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input name="password" type="password" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select name="role" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="USER">Normal User</option>
                <option value="SUPERUSER">Superuser</option>
              </select>
            </div>
            <div className="col-span-2 flex justify-end">
              <button type="submit" disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition relative ${
              activeTab === tab
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            {tab}
            {tab === "Pending Approval" && pending.length > 0 && (
              <span className="ml-1.5 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pending.length}
              </span>
            )}
            {tab === "Notifications" && unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: ALL USERS ─────────────────────────────── */}
      {activeTab === "All Users" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length === 0 && (
                <tr key="empty">
                  <td colSpan={5} className="text-center py-12 text-gray-400">No users yet.</td>
                </tr>
              )}
              {users.map((user) => {
                const isMe = user.id === currentUserId;
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center
                                        text-blue-700 font-bold text-sm flex-shrink-0">
                          {(user.name ?? user.email)[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {user.name ?? "—"}
                          {isMe && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        user.role === "SUPERUSER"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {user.role === "SUPERUSER" ? "⭐ Superuser" : "User"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        user.status === "ACTIVE"   ? "bg-green-100 text-green-700"  :
                        user.status === "PENDING"  ? "bg-yellow-100 text-yellow-700" :
                                                     "bg-red-100 text-red-600"
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {!isMe && user.status === "ACTIVE" && (
                        <div className="flex items-center gap-3 justify-end">
                          <button onClick={() => handleRoleToggle(user)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                            {user.role === "SUPERUSER" ? "Demote" : "Promote"}
                          </button>
                          <button onClick={() => handleResetPassword(user)}
                            className="text-xs text-orange-500 hover:text-orange-700 font-medium">
                            Reset Password
                          </button>
                          <button onClick={() => handleDelete(user)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium">
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB: PENDING APPROVAL ──────────────────────── */}
      {activeTab === "Pending Approval" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Registered</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Approve As</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pending.length === 0 && (
                <tr key="empty-pending">
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    ✅ No pending approvals
                  </td>
                </tr>
              )}
              {pending.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center
                                      text-orange-700 font-bold text-sm flex-shrink-0">
                        {(user.name ?? user.email)[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{user.name ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric"
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(user, "USER")}
                        className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium">
                        ✅ Approve as User
                      </button>
                      <button onClick={() => handleApprove(user, "SUPERUSER")}
                        className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-purple-700 font-medium">
                        ⭐ Approve as Superuser
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleReject(user)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium">
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB: NOTIFICATIONS ─────────────────────────── */}
      {activeTab === "Notifications" && (
        <div>
          {unreadCount > 0 && (
            <div className="flex justify-end mb-3">
              <button onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:underline">
                Mark all as read
              </button>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {notifications.length === 0 && (
              <p className="text-center py-12 text-gray-400">No notifications yet.</p>
            )}
            {notifications.map((n) => (
              <div key={n.id} className={`px-5 py-4 flex items-start gap-4 ${
                !n.read ? "bg-blue-50" : ""
              }`}>
                <div className="text-2xl flex-shrink-0">
                  {n.type === "NEW_REGISTRATION"      ? "👤" : "🔑"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}