-- Fix: allow an authenticated member to create their own missing profile.
-- Run once in Supabase SQL Editor for the Họ Nguyễn project.
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);
