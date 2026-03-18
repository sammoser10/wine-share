"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/StatusBadge";
import type { Friendship, Profile } from "@/lib/supabase/types";

type FriendshipWithProfile = Friendship & {
  friend: Profile;
};

export default function FriendsPage() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendshipWithProfile[]>([]);
  const [pendingReceived, setPendingReceived] = useState<
    FriendshipWithProfile[]
  >([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<Profile | null>(null);
  const [searchError, setSearchError] = useState("");
  const [sending, setSending] = useState(false);
  const supabase = createClient();

  const fetchFriends = useCallback(async () => {
    if (!user) return;

    const { data: sent } = await supabase
      .from("friendships")
      .select("*, addressee:profiles!friendships_addressee_id_fkey(*)")
      .eq("requester_id", user.id);

    const { data: received } = await supabase
      .from("friendships")
      .select("*, requester:profiles!friendships_requester_id_fkey(*)")
      .eq("addressee_id", user.id);

    const allFriendships: FriendshipWithProfile[] = [];
    const pending: FriendshipWithProfile[] = [];

    sent?.forEach((f) => {
      const item = {
        ...f,
        friend: f.addressee as unknown as Profile,
      };
      if (f.status === "accepted") allFriendships.push(item);
    });

    received?.forEach((f) => {
      const item = {
        ...f,
        friend: f.requester as unknown as Profile,
      };
      if (f.status === "accepted") {
        allFriendships.push(item);
      } else if (f.status === "pending") {
        pending.push(item);
      }
    });

    setFriends(allFriendships);
    setPendingReceived(pending);
  }, [user, supabase]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchResult(null);
    setSearchError("");

    if (!searchEmail.trim()) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", searchEmail.trim())
      .single();

    if (error || !data) {
      setSearchError("No user found with that email");
    } else if (data.id === user?.id) {
      setSearchError("That's you!");
    } else {
      setSearchResult(data);
    }
  };

  const sendRequest = async (profileId: string) => {
    if (!user) return;
    setSending(true);

    await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: profileId,
      status: "pending",
    });

    setSearchResult(null);
    setSearchEmail("");
    setSending(false);
    fetchFriends();
  };

  const respondToRequest = async (
    friendshipId: string,
    status: "accepted" | "declined"
  ) => {
    await supabase
      .from("friendships")
      .update({ status })
      .eq("id", friendshipId);
    fetchFriends();
  };

  return (
    <div className="px-5 pt-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Friends</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="email"
          placeholder="Search by email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="glass-input flex-1 px-4 py-2.5 text-sm"
        />
        <button type="submit" className="accent-btn px-4 py-2.5 text-sm">
          Find
        </button>
      </form>

      {searchError && (
        <p className="text-red-500 text-xs mb-4 text-center">{searchError}</p>
      )}

      {searchResult && (
        <GlassCard className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={searchResult.display_name} />
              <div>
                <p className="font-medium text-sm">
                  {searchResult.display_name}
                </p>
                <p className="text-muted text-xs">{searchResult.email}</p>
              </div>
            </div>
            <button
              onClick={() => sendRequest(searchResult.id)}
              disabled={sending}
              className="accent-btn px-3 py-1.5 text-xs"
            >
              {sending ? "..." : "Add"}
            </button>
          </div>
        </GlassCard>
      )}

      {pendingReceived.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            Pending Requests
          </h2>
          <div className="flex flex-col gap-3">
            {pendingReceived.map((f) => (
              <GlassCard key={f.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={f.friend.display_name} />
                    <div>
                      <p className="font-medium text-sm">
                        {f.friend.display_name}
                      </p>
                      <p className="text-muted text-xs">
                        wants to connect
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondToRequest(f.id, "accepted")}
                      className="accent-btn px-3 py-1.5 text-xs"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respondToRequest(f.id, "declined")}
                      className="glass-btn px-3 py-1.5 text-xs text-red-500"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
        Your Friends ({friends.length})
      </h2>
      {friends.length === 0 ? (
        <GlassCard className="text-center py-8">
          <p className="text-muted text-sm">
            No friends yet. Search by email to add friends!
          </p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {friends.map((f) => (
            <GlassCard key={f.id}>
              <div className="flex items-center gap-3">
                <Avatar name={f.friend.display_name} />
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {f.friend.display_name}
                  </p>
                  {f.friend.venmo_username && (
                    <p className="text-muted text-xs">
                      @{f.friend.venmo_username}
                    </p>
                  )}
                </div>
                <StatusBadge status="accepted" />
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
