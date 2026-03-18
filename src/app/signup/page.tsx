"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/proposals");
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-app-gradient px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 text-accent"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C11.5 2 11 2.19 10.59 2.59L7.29 5.88C6.5 6.67 6 7.83 6 9C6 11.21 7.79 13 10 13V22H14V13C16.21 13 18 11.21 18 9C18 7.83 17.5 6.67 16.71 5.88L13.41 2.59C13 2.19 12.5 2 12 2Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Join Compartir</h1>
          <p className="text-muted text-sm mt-1">
            Start splitting bottles today
          </p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="glass-input px-4 py-3 text-sm"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="glass-input px-4 py-3 text-sm"
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="glass-input px-4 py-3 text-sm"
            minLength={6}
            required
          />

          {error && (
            <p className="text-red-500 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="accent-btn px-4 py-3 text-sm disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
