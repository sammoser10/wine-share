"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { WineBottleImage } from "@/components/WineBottleImage";
import { Avatar } from "@/components/Avatar";
import { formatCurrency, timeAgo, getVenmoDeepLink, getVenmoWebLink } from "@/lib/utils";
import Link from "next/link";
import type { Proposal, Profile } from "@/lib/supabase/types";

type ProposalWithDetails = Proposal & {
  bottle: { name: string; producer: string; image_url: string | null };
  creator: Profile;
  proposal_splits: {
    id: string;
    user_id: string;
    share_amount: number;
    status: string;
    user: Profile;
  }[];
};

export default function ProposalsPage() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<ProposalWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProposals = useCallback(async () => {
    if (!user) return;

    const { data: created } = await supabase
      .from("proposals")
      .select(
        "*, bottle:bottles(*), creator:profiles!proposals_creator_id_fkey(*), proposal_splits(*, user:profiles!proposal_splits_user_id_fkey(*))"
      )
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    const { data: splitIds } = await supabase
      .from("proposal_splits")
      .select("proposal_id")
      .eq("user_id", user.id);

    const ids = splitIds?.map((s) => s.proposal_id) || [];

    let invited: ProposalWithDetails[] = [];
    if (ids.length > 0) {
      const { data } = await supabase
        .from("proposals")
        .select(
          "*, bottle:bottles(*), creator:profiles!proposals_creator_id_fkey(*), proposal_splits(*, user:profiles!proposal_splits_user_id_fkey(*))"
        )
        .in("id", ids)
        .neq("creator_id", user.id)
        .order("created_at", { ascending: false });
      invited = (data as unknown as ProposalWithDetails[]) || [];
    }

    const all = [
      ...((created as unknown as ProposalWithDetails[]) || []),
      ...invited,
    ].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setProposals(all);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleSplitResponse = async (
    splitId: string,
    status: "accepted" | "declined"
  ) => {
    await supabase
      .from("proposal_splits")
      .update({ status })
      .eq("id", splitId);

    const split = proposals
      .flatMap((p) => p.proposal_splits)
      .find((s) => s.id === splitId);
    if (split && status === "accepted") {
      const proposal = proposals.find((p) =>
        p.proposal_splits.some((s) => s.id === splitId)
      );
      if (proposal) {
        const allAccepted = proposal.proposal_splits.every(
          (s) => s.id === splitId ? true : s.status === "accepted"
        );
        if (allAccepted) {
          await supabase
            .from("proposals")
            .update({ status: "accepted" })
            .eq("id", proposal.id);

          const { data: cellarBottle } = await supabase
            .from("cellar_bottles")
            .insert({
              bottle_id: proposal.bottle_id,
              proposal_id: proposal.id,
              holder_id: proposal.creator_id,
              status: "active",
            })
            .select()
            .single();

          if (cellarBottle) {
            const owners = [
              { cellar_bottle_id: cellarBottle.id, user_id: proposal.creator_id },
              ...proposal.proposal_splits.map((s) => ({
                cellar_bottle_id: cellarBottle.id,
                user_id: s.user_id,
              })),
            ];
            await supabase.from("cellar_owners").insert(owners);
          }
        }
      }
    }

    fetchProposals();
  };

  if (loading) {
    return (
      <div className="px-5 pt-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Proposals</h1>
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Proposals</h1>
        <Link href="/proposals/new" className="accent-btn px-4 py-2 text-sm">
          + New
        </Link>
      </div>

      {proposals.length === 0 ? (
        <GlassCard className="text-center py-12">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="w-12 h-12 text-foreground/10"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C11.5 2 11 2.19 10.59 2.59L7.29 5.88C6.5 6.67 6 7.83 6 9C6 11.21 7.79 13 10 13V22H14V13C16.21 13 18 11.21 18 9C18 7.83 17.5 6.67 16.71 5.88L13.41 2.59C13 2.19 12.5 2 12 2Z" />
            </svg>
            <p className="text-muted text-sm">No proposals yet</p>
            <Link
              href="/proposals/new"
              className="accent-btn px-4 py-2 text-xs mt-2"
            >
              Create your first proposal
            </Link>
          </div>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {proposals.map((proposal) => {
            const mySplit = proposal.proposal_splits.find(
              (s) => s.user_id === user?.id
            );
            const isCreator = proposal.creator_id === user?.id;

            return (
              <GlassCard key={proposal.id}>
                <div className="flex gap-3">
                  <WineBottleImage
                    imageUrl={proposal.bottle?.image_url}
                    name={proposal.bottle?.name || ""}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {proposal.bottle?.name}
                        </h3>
                        <p className="text-muted text-xs truncate">
                          {proposal.bottle?.producer}
                        </p>
                      </div>
                      <StatusBadge status={proposal.status} />
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg font-bold text-accent">
                        {formatCurrency(proposal.total)}
                      </span>
                      <span className="text-muted/60 text-xs">total</span>
                    </div>

                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {isCreator && (
                        <span className="text-xs text-muted">
                          You + {proposal.proposal_splits.length} friend
                          {proposal.proposal_splits.length > 1 ? "s" : ""}
                        </span>
                      )}
                      {!isCreator && (
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            name={proposal.creator.display_name}
                            size="sm"
                          />
                          <span className="text-xs text-muted">
                            from {proposal.creator.display_name}
                          </span>
                        </div>
                      )}
                    </div>

                    {mySplit && mySplit.status === "pending" && (
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-sm font-medium text-foreground/60">
                          Your share:{" "}
                          <span className="text-foreground">
                            {formatCurrency(mySplit.share_amount)}
                          </span>
                        </span>
                        <div className="flex gap-1.5 ml-auto">
                          <button
                            onClick={() =>
                              handleSplitResponse(mySplit.id, "accepted")
                            }
                            className="accent-btn px-3 py-1 text-xs"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              handleSplitResponse(mySplit.id, "declined")
                            }
                            className="glass-btn px-3 py-1 text-xs text-red-500"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    )}

                    {mySplit &&
                      mySplit.status === "accepted" &&
                      proposal.creator.venmo_username && (
                        <a
                          href={getVenmoDeepLink(
                            proposal.creator.venmo_username,
                            mySplit.share_amount,
                            `Compartir - ${proposal.bottle?.name}`
                          )}
                          onClick={() => {
                            setTimeout(() => {
                              window.location.href = getVenmoWebLink(
                                proposal.creator.venmo_username!,
                                mySplit.share_amount,
                                `Compartir - ${proposal.bottle?.name}`
                              );
                            }, 500);
                          }}
                          className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-accent hover:text-accent-light"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M19.5 3.5L18 2L3 17L4.5 22L19.5 7V3.5Z" />
                          </svg>
                          Pay {formatCurrency(mySplit.share_amount)} via Venmo
                        </a>
                      )}

                    {isCreator && (
                      <div className="flex gap-1 mt-2">
                        {proposal.proposal_splits.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center gap-1"
                          >
                            <Avatar
                              name={s.user?.display_name || ""}
                              size="sm"
                            />
                            <StatusBadge status={s.status} />
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-muted/40 text-[10px] mt-2">
                      {timeAgo(proposal.created_at)}
                    </p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
