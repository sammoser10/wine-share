"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Avatar } from "@/components/Avatar";
import { formatCurrency } from "@/lib/utils";
import type { Profile } from "@/lib/supabase/types";

export default function NewProposalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [wineName, setWineName] = useState("");
  const [producer, setProducer] = useState("");
  const [vintage, setVintage] = useState("");
  const [region, setRegion] = useState("");
  const [varietal, setVarietal] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [price, setPrice] = useState("");
  const [tax, setTax] = useState("");
  const [shipping, setShipping] = useState("");

  const [friends, setFriends] = useState<Profile[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!user) return;

    const { data: sent } = await supabase
      .from("friendships")
      .select("addressee:profiles!friendships_addressee_id_fkey(*)")
      .eq("requester_id", user.id)
      .eq("status", "accepted");

    const { data: received } = await supabase
      .from("friendships")
      .select("requester:profiles!friendships_requester_id_fkey(*)")
      .eq("addressee_id", user.id)
      .eq("status", "accepted");

    const all: Profile[] = [];
    sent?.forEach((f) => all.push(f.addressee as unknown as Profile));
    received?.forEach((f) => all.push(f.requester as unknown as Profile));
    setFriends(all);
  }, [user, supabase]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const total =
    (parseFloat(price) || 0) +
    (parseFloat(tax) || 0) +
    (parseFloat(shipping) || 0);

  const splitCount = selectedFriends.length + 1;
  const perPerson = total / splitCount;

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || selectedFriends.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const { data: bottle, error: bottleError } = await supabase
        .from("bottles")
        .insert({
          name: wineName,
          producer,
          vintage: vintage ? parseInt(vintage) : null,
          region: region || null,
          varietal: varietal || null,
          image_url: imageUrl || null,
        })
        .select()
        .single();

      if (bottleError) throw new Error(`Failed to create bottle: ${bottleError.message}`);

      const { data: proposal, error: proposalError } = await supabase
        .from("proposals")
        .insert({
          bottle_id: bottle.id,
          creator_id: user.id,
          price: parseFloat(price) || 0,
          tax: parseFloat(tax) || 0,
          shipping: parseFloat(shipping) || 0,
          status: "pending",
          notes: notes || null,
        })
        .select()
        .single();

      if (proposalError) throw new Error(`Failed to create proposal: ${proposalError.message}`);

      const splits = selectedFriends.map((friendId) => ({
        proposal_id: proposal.id,
        user_id: friendId,
        share_amount: Math.round(perPerson * 100) / 100,
        status: "pending" as const,
      }));

      const { error: splitsError } = await supabase.from("proposal_splits").insert(splits);
      if (splitsError) throw new Error(`Failed to create splits: ${splitsError.message}`);

      router.push("/proposals");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="px-5 pt-6 pb-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="glass-btn p-2 rounded-full"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">New Proposal</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <GlassCard>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            Wine Details
          </h2>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Wine Name *"
              value={wineName}
              onChange={(e) => setWineName(e.target.value)}
              className="glass-input px-3 py-2.5 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Producer *"
              value={producer}
              onChange={(e) => setProducer(e.target.value)}
              className="glass-input px-3 py-2.5 text-sm"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Vintage"
                value={vintage}
                onChange={(e) => setVintage(e.target.value)}
                className="glass-input px-3 py-2.5 text-sm"
              />
              <input
                type="text"
                placeholder="Region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="glass-input px-3 py-2.5 text-sm"
              />
            </div>
            <input
              type="text"
              placeholder="Varietal (e.g. Pinot Noir)"
              value={varietal}
              onChange={(e) => setVarietal(e.target.value)}
              className="glass-input px-3 py-2.5 text-sm"
            />
            <input
              type="url"
              placeholder="Image URL (optional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="glass-input px-3 py-2.5 text-sm"
            />
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            Pricing
          </h2>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
                $
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="Bottle Price *"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="glass-input w-full pl-7 pr-3 py-2.5 text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Tax"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  className="glass-input w-full pl-7 pr-3 py-2.5 text-sm"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Shipping"
                  value={shipping}
                  onChange={(e) => setShipping(e.target.value)}
                  className="glass-input w-full pl-7 pr-3 py-2.5 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-glass-border">
              <span className="text-sm text-muted">Total</span>
              <span className="text-xl font-bold text-accent">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            Split With
          </h2>
          {friends.length === 0 ? (
            <p className="text-muted text-sm text-center py-4">
              Add friends first to create proposals
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {friends.map((friend) => {
                const selected = selectedFriends.includes(friend.id);
                return (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => toggleFriend(friend.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                      selected
                        ? "bg-accent/10 border border-accent/20"
                        : "border border-transparent hover:bg-foreground/[0.02]"
                    }`}
                  >
                    <Avatar name={friend.display_name} />
                    <span className="text-sm font-medium flex-1 text-left">
                      {friend.display_name}
                    </span>
                    {selected && (
                      <svg
                        className="w-5 h-5 text-accent"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {selectedFriends.length > 0 && total > 0 && (
            <div className="mt-4 pt-3 border-t border-glass-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">
                  Per person ({splitCount}-way split)
                </span>
                <span className="text-lg font-bold text-accent">
                  {formatCurrency(perPerson)}
                </span>
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="glass-input w-full px-3 py-2.5 text-sm resize-none h-20"
          />
        </GlassCard>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !wineName || !producer || !price || selectedFriends.length === 0}
          className="accent-btn px-4 py-3.5 text-sm font-semibold disabled:opacity-40"
        >
          {submitting ? "Sending Proposal..." : "Send Proposal"}
        </button>
      </form>
    </div>
  );
}
