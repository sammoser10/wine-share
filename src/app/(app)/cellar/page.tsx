"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { WineBottleImage } from "@/components/WineBottleImage";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/StatusBadge";
import type { Profile } from "@/lib/supabase/types";

type CellarBottleWithDetails = {
  id: string;
  bottle_id: string;
  proposal_id: string;
  holder_id: string;
  status: string;
  consumed_at: string | null;
  consume_proposed_date: string | null;
  created_at: string;
  bottle: { name: string; producer: string; vintage: number | null; region: string | null; varietal: string | null; image_url: string | null };
  holder: Profile;
  cellar_owners: { user_id: string; user: Profile }[];
};

export default function CellarPage() {
  const { user } = useAuth();
  const [bottles, setBottles] = useState<CellarBottleWithDetails[]>([]);
  const [tab, setTab] = useState<"active" | "consumed">("active");
  const [loading, setLoading] = useState(true);
  const [proposingDate, setProposingDate] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState("");
  const supabase = createClient();

  const fetchCellar = useCallback(async () => {
    if (!user) return;

    // Get cellar bottles where I'm an owner
    const { data: myOwned } = await supabase
      .from("cellar_owners")
      .select("cellar_bottle_id")
      .eq("user_id", user.id);

    const ids = myOwned?.map((o) => o.cellar_bottle_id) || [];
    if (ids.length === 0) {
      setBottles([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("cellar_bottles")
      .select(
        "*, bottle:bottles(*), holder:profiles!cellar_bottles_holder_id_fkey(*), cellar_owners(user_id, user:profiles!cellar_owners_user_id_fkey(*))"
      )
      .in("id", ids)
      .order("created_at", { ascending: false });

    setBottles((data as unknown as CellarBottleWithDetails[]) || []);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchCellar();
  }, [fetchCellar]);

  const markConsumed = async (bottleId: string) => {
    await supabase
      .from("cellar_bottles")
      .update({ status: "consumed", consumed_at: new Date().toISOString() })
      .eq("id", bottleId);
    fetchCellar();
  };

  const proposeConsumeDate = async (bottleId: string) => {
    if (!proposedDate) return;
    await supabase
      .from("cellar_bottles")
      .update({ consume_proposed_date: proposedDate })
      .eq("id", bottleId);
    setProposingDate(null);
    setProposedDate("");
    fetchCellar();
  };

  const filteredBottles = bottles.filter((b) =>
    tab === "active" ? b.status === "active" : b.status === "consumed"
  );

  if (loading) {
    return (
      <div className="px-5 pt-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Cellar</h1>
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Cellar</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("active")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === "active"
              ? "wine-btn"
              : "glass-btn text-white/40"
          }`}
        >
          Active ({bottles.filter((b) => b.status === "active").length})
        </button>
        <button
          onClick={() => setTab("consumed")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === "consumed"
              ? "wine-btn"
              : "glass-btn text-white/40"
          }`}
        >
          Consumed ({bottles.filter((b) => b.status === "consumed").length})
        </button>
      </div>

      {filteredBottles.length === 0 ? (
        <GlassCard className="text-center py-10">
          <p className="text-white/30 text-sm">
            {tab === "active"
              ? "No bottles in your cellar yet. Accept a proposal to get started!"
              : "No consumed bottles yet. Enjoy your wine!"}
          </p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredBottles.map((cb) => (
            <GlassCard key={cb.id}>
              <div className="flex gap-3">
                <WineBottleImage
                  imageUrl={cb.bottle?.image_url}
                  name={cb.bottle?.name || ""}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm">
                        {cb.bottle?.name}
                      </h3>
                      <p className="text-white/40 text-xs">
                        {cb.bottle?.producer}
                        {cb.bottle?.vintage ? ` · ${cb.bottle.vintage}` : ""}
                      </p>
                      {cb.bottle?.region && (
                        <p className="text-white/25 text-xs">
                          {cb.bottle.region}
                          {cb.bottle.varietal ? ` · ${cb.bottle.varietal}` : ""}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={cb.status} />
                  </div>

                  {/* Holder */}
                  <div className="flex items-center gap-2 mt-3">
                    <Avatar name={cb.holder?.display_name || ""} size="sm" />
                    <span className="text-xs text-white/40">
                      Held by{" "}
                      <span className="text-white/60">
                        {cb.holder_id === user?.id
                          ? "you"
                          : cb.holder?.display_name}
                      </span>
                    </span>
                  </div>

                  {/* Co-owners */}
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-white/25 mr-1">Shared:</span>
                    {cb.cellar_owners?.map((o) => (
                      <Avatar
                        key={o.user_id}
                        name={o.user?.display_name || ""}
                        size="sm"
                      />
                    ))}
                  </div>

                  {/* Consume date proposal */}
                  {cb.status === "active" && cb.consume_proposed_date && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                      <span className="text-xs text-purple-400">
                        Proposed:{" "}
                        {new Date(cb.consume_proposed_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}

                  {cb.status === "consumed" && cb.consumed_at && (
                    <p className="text-xs text-purple-400/60 mt-2">
                      Consumed{" "}
                      {new Date(cb.consumed_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}

                  {/* Actions for active bottles */}
                  {cb.status === "active" && (
                    <div className="flex gap-2 mt-3">
                      {proposingDate === cb.id ? (
                        <div className="flex gap-2 items-center w-full">
                          <input
                            type="date"
                            value={proposedDate}
                            onChange={(e) => setProposedDate(e.target.value)}
                            className="glass-input px-2 py-1 text-xs flex-1"
                          />
                          <button
                            onClick={() => proposeConsumeDate(cb.id)}
                            className="wine-btn px-2 py-1 text-xs"
                          >
                            Set
                          </button>
                          <button
                            onClick={() => {
                              setProposingDate(null);
                              setProposedDate("");
                            }}
                            className="glass-btn px-2 py-1 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setProposingDate(cb.id)}
                            className="glass-btn px-3 py-1.5 text-xs"
                          >
                            Propose Date
                          </button>
                          <button
                            onClick={() => markConsumed(cb.id)}
                            className="glass-btn px-3 py-1.5 text-xs text-purple-400"
                          >
                            Mark Consumed
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
