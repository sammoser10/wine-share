-- Fix infinite recursion between proposals and proposal_splits RLS policies.
--
-- The proposals SELECT policy queries proposal_splits, whose SELECT and INSERT
-- policies query proposals, causing an infinite loop. This migration breaks the
-- cycle by using a security definer function for the proposal_splits policies
-- so they bypass RLS when checking proposal ownership.
--
-- Run this in your Supabase SQL editor.

-- 1. Create helper function (security definer bypasses RLS)
create or replace function public.is_proposal_creator(p_proposal_id uuid, p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.proposals where id = p_proposal_id and creator_id = p_user_id
  );
$$ language sql security definer;

-- 2. Drop the old recursive policies
drop policy if exists "Users can view own splits" on proposal_splits;
drop policy if exists "Proposal creators can create splits" on proposal_splits;

-- 3. Re-create them using the helper function
create policy "Users can view own splits"
  on proposal_splits for select using (
    auth.uid() = user_id or
    public.is_proposal_creator(proposal_id, auth.uid())
  );

create policy "Proposal creators can create splits"
  on proposal_splits for insert with check (
    public.is_proposal_creator(proposal_id, auth.uid())
  );
