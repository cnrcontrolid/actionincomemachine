"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    whatsapp_opt_in: true,
    // social handles
    instagram_handle: "",
    facebook_profile: "",
    linkedin_profile: "",
    youtube_channel: "",
    // follower counts
    instagram_followers: "",
    youtube_subscribers: "",
    facebook_friends: "",
    linkedin_connections: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Password change state
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select(
          "full_name, phone, whatsapp_opt_in, instagram_handle, facebook_profile, linkedin_profile, youtube_channel, instagram_followers, youtube_subscribers, facebook_friends, linkedin_connections"
        )
        .eq("id", user.id)
        .single();
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          whatsapp_opt_in: data.whatsapp_opt_in ?? true,
          instagram_handle: data.instagram_handle ?? "",
          facebook_profile: data.facebook_profile ?? "",
          linkedin_profile: data.linkedin_profile ?? "",
          youtube_channel: data.youtube_channel ?? "",
          instagram_followers: data.instagram_followers?.toString() ?? "",
          youtube_subscribers: data.youtube_subscribers?.toString() ?? "",
          facebook_friends: data.facebook_friends?.toString() ?? "",
          linkedin_connections: data.linkedin_connections?.toString() ?? "",
        });
      }
      setLoading(false);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({
        full_name: form.full_name,
        phone: form.phone,
        whatsapp_opt_in: form.whatsapp_opt_in,
        instagram_handle: form.instagram_handle || null,
        facebook_profile: form.facebook_profile || null,
        linkedin_profile: form.linkedin_profile || null,
        youtube_channel: form.youtube_channel || null,
        instagram_followers: parseInt(form.instagram_followers) || 0,
        youtube_subscribers: parseInt(form.youtube_subscribers) || 0,
        facebook_friends: parseInt(form.facebook_friends) || 0,
        linkedin_connections: parseInt(form.linkedin_connections) || 0,
      }).eq("id", user.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    setPwMessage(null);

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMessage({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    setPwSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setPwMessage({ type: "error", text: "Could not get your account email." });
      setPwSaving(false);
      return;
    }

    // Verify current password by re-signing in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: pwForm.currentPassword,
    });

    if (signInError) {
      setPwMessage({ type: "error", text: "Current password is incorrect." });
      setPwSaving(false);
      return;
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: pwForm.newPassword,
    });

    setPwSaving(false);
    if (updateError) {
      setPwMessage({ type: "error", text: updateError.message });
    } else {
      setPwMessage({ type: "success", text: "Password updated successfully!" });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
  }

  if (loading) return <div className="text-warmgray p-8">Loading...</div>;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="font-heading font-bold text-3xl text-charcoal">Settings</h1>

      {/* Profile section */}
      <div className="card">
        <h2 className="font-heading font-bold text-charcoal mb-4">Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input
              type="text"
              className="input"
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">WhatsApp / Phone number</label>
            <input
              type="tel"
              className="input"
              placeholder="+1234567890"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
            <p className="text-xs text-warmgray mt-1">Include country code (e.g. +1 for US)</p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-[#FFAA00]"
              checked={form.whatsapp_opt_in}
              onChange={(e) => setForm((p) => ({ ...p, whatsapp_opt_in: e.target.checked }))}
            />
            <span className="text-sm text-charcoal">Receive WhatsApp notifications from my coach</span>
          </label>
          <button type="submit" className="w-full bg-[#FFAA00] hover:bg-[#e09900] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60" disabled={saving}>
            {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
          </button>
        </form>
      </div>

      {/* Social Media section */}
      <div className="card">
        <h2 className="font-heading font-bold text-charcoal mb-4">Social Media</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="label">Instagram Handle</label>
              <input
                type="text"
                className="input"
                placeholder="@yourhandle"
                value={form.instagram_handle}
                onChange={(e) => setForm((p) => ({ ...p, instagram_handle: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Facebook Profile URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://facebook.com/yourprofile"
                value={form.facebook_profile}
                onChange={(e) => setForm((p) => ({ ...p, facebook_profile: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">LinkedIn Profile URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://linkedin.com/in/yourprofile"
                value={form.linkedin_profile}
                onChange={(e) => setForm((p) => ({ ...p, linkedin_profile: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">YouTube Channel URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://youtube.com/@yourchannel"
                value={form.youtube_channel}
                onChange={(e) => setForm((p) => ({ ...p, youtube_channel: e.target.value }))}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Follower Counts</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Instagram Followers</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.instagram_followers}
                  onChange={(e) => setForm((p) => ({ ...p, instagram_followers: e.target.value }))}
                />
              </div>
              <div>
                <label className="label text-xs">YouTube Subscribers</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.youtube_subscribers}
                  onChange={(e) => setForm((p) => ({ ...p, youtube_subscribers: e.target.value }))}
                />
              </div>
              <div>
                <label className="label text-xs">Facebook Friends</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.facebook_friends}
                  onChange={(e) => setForm((p) => ({ ...p, facebook_friends: e.target.value }))}
                />
              </div>
              <div>
                <label className="label text-xs">LinkedIn Connections</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.linkedin_connections}
                  onChange={(e) => setForm((p) => ({ ...p, linkedin_connections: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-[#FFAA00] hover:bg-[#e09900] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60" disabled={saving}>
            {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
          </button>
        </form>
      </div>

      {/* Change Password section */}
      <div className="card">
        <h2 className="font-heading font-bold text-charcoal mb-4">Change Password</h2>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              className="input"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className="input"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              className="input"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              required
            />
          </div>

          {pwMessage && (
            <p
              className={`text-sm font-medium ${
                pwMessage.type === "success" ? "text-[#30B33C]" : "text-red-500"
              }`}
            >
              {pwMessage.text}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            disabled={pwSaving}
          >
            {pwSaving ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
