"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://app.actionincomemachine.com/reset-password",
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="card">
      <h2 className="font-heading text-xl font-bold text-charcoal mb-2">Reset your password</h2>

      {submitted ? (
        <div className="mt-4">
          <p
            className="text-sm bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3"
            style={{ color: "#30B33C" }}
          >
            Check your email for a password reset link.
          </p>
          <p className="text-sm text-warmgray text-center mt-6">
            <Link href="/login" className="text-amber-brand font-medium hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-warmgray mb-6">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
          <p className="text-sm text-warmgray text-center mt-4">
            <Link href="/login" className="text-amber-brand font-medium hover:underline">
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
