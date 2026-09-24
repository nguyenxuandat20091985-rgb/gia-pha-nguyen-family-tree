-- Chạy 1 lần trong Supabase SQL Editor (project Họ Nguyễn)
-- Fix lưu thông tin thành viên (Lưu thông tin)

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Đảm bảo user mới có profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, display_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.phone, new.email),
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
