"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [venmoUsername, setVenmoUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Save Venmo username to profile if provided
    if (venmoUsername.trim() && data.user) {
      await supabase
        .from("profiles")
        .update({ venmo_username: venmoUsername.trim() })
        .eq("id", data.user.id);
    }

    router.push("/proposals");
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
          <h1 className="text-3xl font-bold tracking-tight">
            {step === 1 ? "Join Compartir" : "Connect Venmo"}
          </h1>
          <p className="text-muted text-sm mt-1">
            {step === 1
              ? "Start splitting bottles today"
              : "So friends can pay you easily"}
          </p>

          {/* Step indicator */}
          <div className="flex gap-2 mt-4">
            <div
              className={`h-1.5 w-8 rounded-full transition-colors ${
                step === 1 ? "bg-accent" : "bg-accent/30"
              }`}
            />
            <div
              className={`h-1.5 w-8 rounded-full transition-colors ${
                step === 2 ? "bg-accent" : "bg-accent/30"
              }`}
            />
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleStep1} className="flex flex-col gap-4">
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
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="glass-input px-4 py-3 text-sm"
              minLength={6}
              required
            />

            {error && (
              <p className="text-red-500 text-xs text-center">{error}</p>
            )}

            <button
              type="submit"
              className="accent-btn px-4 py-3 text-sm"
            >
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleStep2} className="flex flex-col gap-4">
            <div className="glass-card p-4">
              <label className="block text-xs text-muted mb-1.5">
                Venmo Username
              </label>
              <div className="flex items-center gap-2">
                <span className="text-muted text-sm">@</span>
                <input
                  type="text"
                  placeholder="your-venmo-handle"
                  value={venmoUsername}
                  onChange={(e) => setVenmoUsername(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  autoFocus
                />
              </div>
              <p className="text-muted/60 text-xs mt-2">
                Friends will use this to send you payments when splitting bottles
              </p>
            </div>

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

            <button
              type="button"
              onClick={() => setStep(1)}
              className="glass-btn px-4 py-2.5 text-sm text-muted"
            >
              Back
            </button>
          </form>
        )}

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
