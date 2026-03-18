"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Avatar } from "@/components/Avatar";

export default function ProfilePage() {
  const { profile, signOut, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [venmoUsername, setVenmoUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setVenmoUsername(profile.venmo_username || "");
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        venmo_username: venmoUsername || null,
      })
      .eq("id", profile.id);

    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!profile) return null;

  return (
    <div className="px-5 pt-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <div className="flex flex-col items-center mb-8">
        <Avatar name={profile.display_name} size="lg" />
        <p className="text-muted text-sm mt-2">{profile.email}</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <GlassCard>
          <label className="block text-xs text-muted mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="glass-input w-full px-3 py-2.5 text-sm"
            required
          />
        </GlassCard>

        <GlassCard>
          <label className="block text-xs text-muted mb-1.5">
            Venmo Username
          </label>
          <div className="flex items-center gap-2">
            <span className="text-muted text-sm">@</span>
            <input
              type="text"
              value={venmoUsername}
              onChange={(e) => setVenmoUsername(e.target.value)}
              placeholder="your-venmo-handle"
              className="glass-input w-full px-3 py-2.5 text-sm"
            />
          </div>
          <p className="text-muted/60 text-xs mt-2">
            Friends will use this to pay you via Venmo
          </p>
        </GlassCard>

        <button
          type="submit"
          disabled={saving}
          className="accent-btn px-4 py-3 text-sm disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </form>

      <div className="mt-10">
        <button
          onClick={signOut}
          className="glass-btn w-full px-4 py-3 text-sm text-red-500"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
