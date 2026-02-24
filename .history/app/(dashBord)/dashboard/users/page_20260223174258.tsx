"use client";

import { useState, useEffect } from "react";
import { getUsers, createUser, updateUserRole, deleteUser } from "@/app/actions/users";
import { useSession } from "next-auth/react";

type User = {
  id: string; email: string; name: string | null;
  role: "SUPERUSER" | "USER"; createdAt: Date;
};

export default function UsersPage() {
  const { data: session }           = useSession();
  const [users, setUsers]           = useState<User[]>([]);
  const [showForm, setShowForm]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [errors, setErrors]         = useState<Record<string, string[]>>({});
  const [actionError, setActionError] = useState("");

  function refresh() { getUsers().then(setUsers); }
  useEffect(() => { refresh(); }, []);

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
      setLoading(false);
    } else {
      refresh();
      setShowForm(false);
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    }
  }

  async function handleRoleToggle(user: User) {
    const newRole = user.role === "SUPERUSER" ? "USER" : "SUPERUSER";
    if (!confirm(`Change ${user.email} to ${newRole}?`)) return;
    await updateUserRole(user.id, newRole);
    refresh();
  }

  async function handleDelete(user: User) {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    const result = await deleteUser(user.id);
    if (result.error) {
      setActionError(typeof result.error === "string" ? result.error : "Error deleting user");
    } else {
      refresh();
    }
  }

  const currentUserId = (session?.user as any)?.id;

  return (
    <div className="max-w-4xl mx-auto">

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} total users</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
          {showForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

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

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Added</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.length === 0 && (
              <tr key="empty">
                <td colSpan={5} className="text-center py-12 text-gray-400">
                  No users yet.
                </td>
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
                        {isMe && (
                          <span className="ml-2 text-xs text-gray-400">(you)</span>
                        )}
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
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric"
                    })}
                  </td>
                  <td className="px-6 py-4">
                    {!isMe && (
                      <div className="flex items-center gap-3 justify-end">
                        <button onClick={() => handleRoleToggle(user)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                          {user.role === "SUPERUSER" ? "Demote" : "Promote"}
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
    </div>
  );
}