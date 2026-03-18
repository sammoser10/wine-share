export type Profile = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  venmo_username: string | null;
  created_at: string;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

export type Bottle = {
  id: string;
  name: string;
  producer: string;
  vintage: number | null;
  region: string | null;
  varietal: string | null;
  image_url: string | null;
  created_at: string;
};

export type Proposal = {
  id: string;
  bottle_id: string;
  creator_id: string;
  price: number;
  tax: number;
  shipping: number;
  total: number;
  status: "pending" | "accepted" | "declined" | "completed";
  purchase_url: string | null;
  notes: string | null;
  created_at: string;
  // joined
  bottle?: Bottle;
  creator?: Profile;
  splits?: ProposalSplit[];
};

export type ProposalSplit = {
  id: string;
  proposal_id: string;
  user_id: string;
  share_amount: number;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  // joined
  user?: Profile;
};

export type CellarBottle = {
  id: string;
  bottle_id: string;
  proposal_id: string;
  holder_id: string;
  status: "active" | "consumed";
  consumed_at: string | null;
  consume_proposed_date: string | null;
  created_at: string;
  // joined
  bottle?: Bottle;
  proposal?: Proposal;
  holder?: Profile;
  owners?: CellarOwner[];
};

export type CellarOwner = {
  id: string;
  cellar_bottle_id: string;
  user_id: string;
  // joined
  user?: Profile;
};

export type PushSubscription = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at">; Update: Partial<Profile> };
      friendships: { Row: Friendship; Insert: Omit<Friendship, "id" | "created_at">; Update: Partial<Friendship> };
      bottles: { Row: Bottle; Insert: Omit<Bottle, "id" | "created_at">; Update: Partial<Bottle> };
      proposals: { Row: Proposal; Insert: Omit<Proposal, "id" | "created_at" | "total">; Update: Partial<Proposal> };
      proposal_splits: { Row: ProposalSplit; Insert: Omit<ProposalSplit, "id" | "created_at">; Update: Partial<ProposalSplit> };
      cellar_bottles: { Row: CellarBottle; Insert: Omit<CellarBottle, "id" | "created_at">; Update: Partial<CellarBottle> };
      cellar_owners: { Row: CellarOwner; Insert: Omit<CellarOwner, "id">; Update: Partial<CellarOwner> };
      push_subscriptions: { Row: PushSubscription; Insert: Omit<PushSubscription, "id" | "created_at">; Update: Partial<PushSubscription> };
    };
  };
};
