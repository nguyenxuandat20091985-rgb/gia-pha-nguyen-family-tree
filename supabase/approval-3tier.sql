-- ============================================================
-- Gia Phả Họ Nguyễn – Duyệt 3 cấp + đồng bộ nhiều máy
-- Chạy 1 LẦN trong Supabase → SQL Editor → Run
-- Admin → Trưởng họ → Thành viên liên quan
-- ============================================================

-- 1) Cột bổ sung
alter table public.profiles add column if not exists status text default 'pending';
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists is_tech_admin boolean default false;
alter table public.profiles add column if not exists family_role text default 'member';

-- 2) Cho phép role: member | truongho | admin
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles
  add constraint profiles_status_check
  check (status in ('pending', 'approved', 'rejected'));

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('member', 'truongho', 'admin'));

-- 3) Khóa Admin (tech admin)
update public.profiles
set role = 'admin',
    status = 'approved',
    is_tech_admin = true,
    family_role = 'member',
    email = coalesce(email, 'nguyenxuandat20091985@gmail.com'),
    display_name = coalesce(nullif(display_name, ''), 'dat nguyen')
where id = 'cf17b596-f674-4431-aa7f-506f955624ab'
   or lower(coalesce(email, '')) = 'nguyenxuandat20091985@gmail.com';

update public.profiles set status = 'approved' where status is null or status = '';

-- 4) User mới → profile pending
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(new.email, ''));
  v_is_owner boolean := (new.id::text = 'cf17b596-f674-4431-aa7f-506f955624ab'
    or v_email = 'nguyenxuandat20091985@gmail.com');
begin
  insert into public.profiles (id, display_name, email, phone, role, status, is_tech_admin, family_role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email, 'Thành viên mới'),
    new.email,
    new.phone,
    case when v_is_owner then 'admin' else 'member' end,
    case when v_is_owner then 'approved' else 'pending' end,
    v_is_owner,
    'member'
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 5) Helper: có quyền quản lý thành viên?
create or replace function public.can_manage_members()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and (
        p.is_tech_admin = true
        or p.role = 'truongho'
        or p.family_role = 'truongho'
      )
  );
$$;

create or replace function public.is_tech_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and (p.is_tech_admin = true or p.role = 'admin')
  );
$$;

-- 6) RPC duyệt trạng thái
create or replace function public.set_member_status(target_id uuid, new_status text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.profiles;
begin
  if new_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Trạng thái không hợp lệ';
  end if;
  if not public.can_manage_members() then
    raise exception 'Không có quyền duyệt thành viên';
  end if;
  if exists (
    select 1 from public.profiles t
    where t.id = target_id and t.is_tech_admin = true
  ) then
    raise exception 'Không đổi trạng thái tài khoản Chủ quản';
  end if;
  update public.profiles
  set status = new_status
  where id = target_id
  returning * into row;
  if row.id is null then
    raise exception 'Không tìm thấy thành viên';
  end if;
  return row;
end;
$$;

-- 7) RPC đổi quyền (truongho | member) — chỉ Chủ quản cấp Trưởng họ
create or replace function public.set_member_role(target_id uuid, new_role text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.profiles;
  r text := new_role;
begin
  if r not in ('member', 'truongho') then
    raise exception 'Chỉ được đặt member hoặc truongho';
  end if;
  if exists (
    select 1 from public.profiles t
    where t.id = target_id and (t.is_tech_admin = true or t.role = 'admin')
  ) then
    raise exception 'Tài khoản Chủ quản được bảo vệ';
  end if;
  if r = 'truongho' then
    if not public.is_tech_admin_user() then
      raise exception 'Chỉ Chủ quản được cấp / thu hồi Trưởng họ';
    end if;
  else
    if not public.can_manage_members() then
      raise exception 'Không có quyền đặt Thành viên liên quan';
    end if;
  end if;
  update public.profiles
  set role = r,
      family_role = r,
      status = 'approved',
      is_tech_admin = false
  where id = target_id
  returning * into row;
  if row.id is null then
    raise exception 'Không tìm thấy thành viên';
  end if;
  return row;
end;
$$;

grant execute on function public.set_member_status(uuid, text) to authenticated;
grant execute on function public.set_member_role(uuid, text) to authenticated;
grant execute on function public.can_manage_members() to authenticated;
grant execute on function public.is_tech_admin_user() to authenticated;

-- 8) RLS profiles
alter table public.profiles enable row level security;

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
  or public.can_manage_members()
)
with check (
  auth.uid() = id
  or public.can_manage_members()
);

-- Xong. Kiểm tra:
-- select id, display_name, email, role, status, is_tech_admin from profiles;
