"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
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
          <h1 className="text-3xl font-bold tracking-tight">Compartir</h1>
          <p className="text-muted text-sm mt-1">
            Split wine with friends
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="glass-input px-4 py-3 text-sm"
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
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-8">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
