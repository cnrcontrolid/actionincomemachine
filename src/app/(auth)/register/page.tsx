"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [facebookProfile, setFacebookProfile] = useState("");
  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [youtubeChannel, setYoutubeChannel] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          instagram_handle: instagramHandle,
          facebook_profile: facebookProfile,
          linkedin_profile: linkedinProfile,
          youtube_channel: youtubeChannel,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Update profiles table with the extra social fields
    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          phone,
          instagram_handle: instagramHandle,
          facebook_profile: facebookProfile,
          linkedin_profile: linkedinProfile,
          youtube_channel: youtubeChannel,
        })
        .eq("id", data.user.id);

      if (profileError) {
        // Non-fatal — user is still created; log but don't block redirect
        console.error("Profile update error:", profileError.message);
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="font-heading text-xl font-bold text-charcoal mb-6">Create your account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input
            type="text"
            className="input"
            placeholder="Jane Smith"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label">Phone number <span className="text-warmgray font-normal">(optional)</span></label>
          <input
            type="tel"
            className="input"
            placeholder="+1234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
        <div>
          <label className="label">Instagram Handle <span className="text-warmgray font-normal">(optional)</span></label>
          <input
            type="text"
            className="input"
            placeholder="@yourhandle"
            value={instagramHandle}
            onChange={(e) => setInstagramHandle(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Facebook Profile URL <span className="text-warmgray font-normal">(optional)</span></label>
          <input
            type="text"
            className="input"
            placeholder="facebook.com/yourprofile"
            value={facebookProfile}
            onChange={(e) => setFacebookProfile(e.target.value)}
          />
        </div>
        <div>
          <label className="label">LinkedIn Profile URL <span className="text-warmgray font-normal">(optional)</span></label>
          <input
            type="text"
            className="input"
            placeholder="linkedin.com/in/yourprofile"
            value={linkedinProfile}
            onChange={(e) => setLinkedinProfile(e.target.value)}
          />
        </div>
        <div>
          <label className="label">YouTube Channel URL <span className="text-warmgray font-normal">(optional)</span></label>
          <input
            type="text"
            className="input"
            placeholder="youtube.com/@yourchannel"
            value={youtubeChannel}
            onChange={(e) => setYoutubeChannel(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="text-sm text-warmgray text-center mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-amber-brand font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
