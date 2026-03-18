-- Compartir: Wine Sharing App Schema
-- Run this in your Supabase SQL editor

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text not null,
  avatar_url text,
  venmo_username text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by authenticated users"
  on profiles for select to authenticated using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Friendships
create table public.friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')) not null,
  created_at timestamptz default now() not null,
  unique (requester_id, addressee_id)
);

alter table public.friendships enable row level security;

create policy "Users can view own friendships"
  on friendships for select using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );

create policy "Users can send friend requests"
  on friendships for insert with check (auth.uid() = requester_id);

create policy "Users can update friendships addressed to them"
  on friendships for update using (auth.uid() = addressee_id);

create policy "Users can delete own friendships"
  on friendships for delete using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );

-- Bottles
create table public.bottles (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  producer text not null,
  vintage int,
  region text,
  varietal text,
  image_url text,
  created_at timestamptz default now() not null
);

alter table public.bottles enable row level security;

create policy "Bottles viewable by authenticated users"
  on bottles for select to authenticated using (true);

create policy "Authenticated users can create bottles"
  on bottles for insert to authenticated with check (true);

-- Proposals
create table public.proposals (
  id uuid default gen_random_uuid() primary key,
  bottle_id uuid references public.bottles(id) on delete cascade not null,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  price numeric(10,2) not null,
  tax numeric(10,2) default 0 not null,
  shipping numeric(10,2) default 0 not null,
  total numeric(10,2) generated always as (price + tax + shipping) stored,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined', 'completed')) not null,
  purchase_url text,
  notes text,
  created_at timestamptz default now() not null
);

alter table public.proposals enable row level security;

create policy "Users can view proposals they're part of"
  on proposals for select using (
    auth.uid() = creator_id or
    exists (
      select 1 from proposal_splits where proposal_id = proposals.id and user_id = auth.uid()
    )
  );

create policy "Users can create proposals"
  on proposals for insert with check (auth.uid() = creator_id);

create policy "Creators can update proposals"
  on proposals for update using (auth.uid() = creator_id);

-- Proposal Splits
create table public.proposal_splits (
  id uuid default gen_random_uuid() primary key,
  proposal_id uuid references public.proposals(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  share_amount numeric(10,2) not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')) not null,
  created_at timestamptz default now() not null,
  unique (proposal_id, user_id)
);

alter table public.proposal_splits enable row level security;

-- Helper to check proposal ownership without triggering RLS on proposals
-- (avoids infinite recursion: proposals SELECT -> proposal_splits -> proposals SELECT)
create or replace function public.is_proposal_creator(p_proposal_id uuid, p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.proposals where id = p_proposal_id and creator_id = p_user_id
  );
$$ language sql security definer;

create policy "Users can view own splits"
  on proposal_splits for select using (
    auth.uid() = user_id or
    public.is_proposal_creator(proposal_id, auth.uid())
  );

create policy "Proposal creators can create splits"
  on proposal_splits for insert with check (
    public.is_proposal_creator(proposal_id, auth.uid())
  );

create policy "Split users can update own splits"
  on proposal_splits for update using (auth.uid() = user_id);

-- Cellar Bottles
create table public.cellar_bottles (
  id uuid default gen_random_uuid() primary key,
  bottle_id uuid references public.bottles(id) on delete cascade not null,
  proposal_id uuid references public.proposals(id) on delete cascade not null,
  holder_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'active' check (status in ('active', 'consumed')) not null,
  consumed_at timestamptz,
  consume_proposed_date date,
  created_at timestamptz default now() not null
);

alter table public.cellar_bottles enable row level security;

create policy "Owners can view cellar bottles"
  on cellar_bottles for select using (
    exists (
      select 1 from cellar_owners where cellar_bottle_id = cellar_bottles.id and user_id = auth.uid()
    )
  );

create policy "Authenticated can insert cellar bottles"
  on cellar_bottles for insert to authenticated with check (true);

create policy "Owners can update cellar bottles"
  on cellar_bottles for update using (
    exists (
      select 1 from cellar_owners where cellar_bottle_id = cellar_bottles.id and user_id = auth.uid()
    )
  );

-- Cellar Owners (many-to-many)
create table public.cellar_owners (
  id uuid default gen_random_uuid() primary key,
  cellar_bottle_id uuid references public.cellar_bottles(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  unique (cellar_bottle_id, user_id)
);

alter table public.cellar_owners enable row level security;

create policy "Owners can view cellar owners"
  on cellar_owners for select using (
    auth.uid() = user_id or
    exists (
      select 1 from cellar_owners co2
      where co2.cellar_bottle_id = cellar_owners.cellar_bottle_id and co2.user_id = auth.uid()
    )
  );

create policy "Authenticated can insert cellar owners"
  on cellar_owners for insert to authenticated with check (true);

-- Push Subscriptions
create table public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now() not null,
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "Users can manage own push subscriptions"
  on push_subscriptions for all using (auth.uid() = user_id);
