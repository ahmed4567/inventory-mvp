"use client";

import { useState, useEffect } from "react";
import { getProfile, updateProfile, changePassword } from "@/app/actions/profile";

type Profile = {
  id: string; name: string | null; email: string; username: string;
  bio: string | null; avatarUrl: string | null; role: string;
  createdAt: Date;
};

export default function SettingsPage() {
  const [profile,    setProfile]    = useState<Profile | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [pwLoading,  setPwLoading]  = useState(false);
  const [success,    setSuccess]    = useState("");
  const [error,      setError]      = useState("");
  const [pwSuccess,  setPwSuccess]  = useState("");
  const [pwError,    setPwError]    = useState("");
  const [activeTab,  setActiveTab]  = useState<"profile" | "password">("profile");

  useEffect(() => {
    getProfile().then(setProfile as any);
  }, []);

  async function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    const form = new FormData(e.currentTarget);
    const result = await updateProfile({
      name:      form.get("name")      as string,
      bio:       form.get("bio")       as string,
      avatarUrl: form.get("avatarUrl") as string,
    });

    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to update profile");
    } else {
      setSuccess("Profile updated successfully!");
      getProfile().then(setProfile as any);
    }
    setLoading(false);
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwLoading(true);
    setPwSuccess("");
    setPwError("");

    const form = new FormData(e.currentTarget);
    const result = await changePassword({
      currentPassword: form.get("currentPassword") as string,
      newPassword:     form.get("newPassword")     as string,
    });

    if (result.error) {
      setPwError(typeof result.error === "string" ? result.error : "Failed to change password");
    } else {
      setPwSuccess("Password changed successfully!");
      (e.target as HTMLFormElement).reset();
    }
    setPwLoading(false);
  }

  if (!profile) return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-32 bg-gray-200 rounded-xl" />
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>
  );

  const initials = (profile.name ?? profile.username)[0].toUpperCase();

  return (
    <div className="max-w-2xl mx-auto">

      {/* Profile header card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-5">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar"
              className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-100" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center
                            text-white text-3xl font-bold ring-4 ring-blue-100">
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-800">{profile.name ?? profile.username}</h1>
            <p className="text-sm text-gray-400">@{profile.username}</p>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mt-1 inline-block ${
              profile.role === "SUPERUSER" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
            }`}>
              {profile.role === "SUPERUSER" ? "⭐ Superuser" : "User"}
            </span>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-400">Member since</p>
            <p className="text-sm text-gray-600 font-medium">
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                month: "long", year: "numeric"
              })}
            </p>
          </div>
        </div>
        {profile.bio && (
          <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{profile.bio}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        {(["profile", "password"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition ${
              activeTab === tab
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            {tab === "profile" ? "✏️ Profile" : "🔒 Password"}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-5">Edit Profile</h2>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4">
              ✅ {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input name="name" type="text" required defaultValue={profile.name ?? ""}
                className="w-full border border-gray-300 rounded-lg px-3 py-2
                           focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Picture URL
              </label>
              <input name="avatarUrl" type="url" defaultValue={profile.avatarUrl ?? ""}
                placeholder="https://example.com/photo.jpg"
                className="w-full border border-gray-300 rounded-lg px-3 py-2
                           focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">
                Paste a direct image URL (e.g. from Gravatar or Imgur)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
                <span className="text-gray-400 font-normal ml-1">(max 300 characters)</span>
              </label>
              <textarea name="bio" rows={3} maxLength={300}
                defaultValue={profile.bio ?? ""}
                placeholder="Tell your team a bit about yourself..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none
                           focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <input type="email" value={profile.email} disabled
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
                <input type="text" value={profile.username} disabled
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-400 cursor-not-allowed" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700
                           font-medium disabled:opacity-50">
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password tab */}
      {activeTab === "password" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-5">Change Password</h2>

          {pwSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4">
              ✅ {pwSuccess}
            </div>
          )}
          {pwError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
              ⚠️ {pwError}
            </div>
          )}

          <form onSubmit={handlePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password *</label>
              <input name="currentPassword" type="password" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2
                           focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
              <input name="newPassword" type="password" required minLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2
                           focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={pwLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700
                           font-medium disabled:opacity-50">
                {pwLoading ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}