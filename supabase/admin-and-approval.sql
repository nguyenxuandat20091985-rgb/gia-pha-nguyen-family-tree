-- ============================================================
-- Gia Phả Họ Nguyễn – Phân quyền Admin + Duyệt thành viên
-- Chạy 1 LẦN trong Supabase → SQL Editor → Run
-- ============================================================

-- 1) Cột trạng thái duyệt
alter table public.profiles
  add column if not exists status text default 'pending';

-- Chuẩn hóa constraint
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles
  add constraint profiles_status_check
  check (status in ('pending', 'approved', 'rejected'));

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('member', 'admin'));

-- 2) Bootstrap: tài khoản hiện có → admin + đã duyệt
update public.profiles
set role = 'admin',
    status = 'approved',
    display_name = coalesce(nullif(display_name, ''), 'NGUYỄN XUÂN ĐẠT')
where id = 'cf17b596-f674-4431-aa7f-506f955624ab';

-- Mọi profile cũ chưa có status → approved (tránh khóa nhầm)
update public.profiles
set status = 'approved'
where status is null or status = '';

-- 3) Trigger: user mới → profile pending (trừ khi đã có)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, phone, role, status)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.phone,
      new.email,
      'Thành viên mới'
    ),
    new.phone,
    'member',
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 4) RLS profiles – đọc được để admin duyệt; sửa quyền chỉ admin hoặc chính mình (tên)
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read"
on public.profiles for select
using (true);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
on public.profiles for update to authenticated
using (
  auth.uid() = id
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'
  )
)
with check (
  auth.uid() = id
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'
  )
);

-- 5) Gia phả: ai cũng đọc; chỉ admin (đã duyệt) ghi
drop policy if exists "members read" on public.family_members;
create policy "members read"
on public.family_members for select using (true);

drop policy if exists "members write admin" on public.family_members;
create policy "members write admin"
on public.family_members for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'
  )
);

-- 6) Bài viết / sự kiện: chỉ thành viên đã duyệt
drop policy if exists "posts insert auth" on public.posts;
create policy "posts insert auth"
on public.posts for insert to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'approved'
  )
);

drop policy if exists "events insert auth" on public.family_events;
create policy "events insert auth"
on public.family_events for insert to authenticated
with check (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'approved'
  )
);

-- Xong. Kiểm tra:
-- select id, display_name, role, status from profiles;
