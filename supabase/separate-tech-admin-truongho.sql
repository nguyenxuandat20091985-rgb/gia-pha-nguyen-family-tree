-- Gia Phả Họ Nguyễn — 3 cấp quyền tách biệt:
-- Chủ quản hệ thống (Tech Admin) / Trưởng họ / Thành viên.
-- Idempotent; chỉ thay đổi schema/RLS/RPC liên quan phân quyền.

alter table public.profiles
  add column if not exists is_tech_admin boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('member','admin','truongho'));

alter table public.profiles
  drop constraint if exists profiles_status_check;

alter table public.profiles
  add constraint profiles_status_check
  check (status is null or status in ('pending','approved','rejected'));

-- Chủ quản hệ thống là tài khoản duy nhất giữ marker Tech Admin.
update public.profiles
set role='admin',
    status='approved',
    is_tech_admin=true,
    display_name=coalesce(nullif(display_name,''),'NGUYỄN XUÂN ĐẠT')
where id='cf17b596-f674-4431-aa7f-506f955624ab';

update public.profiles
set is_tech_admin=false
where id <> 'cf17b596-f674-4431-aa7f-506f955624ab'
  and is_tech_admin=true;

-- Legacy role='admin' không còn là một cấp quyền độc lập.
-- Chỉ tài khoản Tech Admin được phép giữ marker role='admin'.
update public.profiles
set role='member'
where role='admin'
  and id <> 'cf17b596-f674-4431-aa7f-506f955624ab';

create unique index if not exists profiles_one_tech_admin_idx
  on public.profiles (is_tech_admin)
  where is_tech_admin=true;

-- RLS: hồ sơ chỉ tự sửa các trường hồ sơ; thay đổi quyền/trạng thái phải qua RPC.
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Server-side guard: không cho client tự leo thang quyền hoặc hạ Chủ quản.
create or replace function public.protect_profile_permission_fields()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  actor_tech boolean;
  actor_truongho boolean;
  tech_id constant uuid := 'cf17b596-f674-4431-aa7f-506f955624ab';
begin
  actor_tech := exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid())
      and p.is_tech_admin=true
      and p.role='admin'
      and (p.status is null or p.status='approved')
  );

  actor_truongho := exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid())
      and p.role='truongho'
      and (p.status is null or p.status='approved')
  );

  if new.id=tech_id then
    if new.is_tech_admin is distinct from true
       or new.role is distinct from 'admin' then
      raise exception 'Tài khoản Chủ quản hệ thống được bảo vệ và không thể hạ quyền.';
    end if;
  end if;

  if new.is_tech_admin is distinct from old.is_tech_admin then
    if old.is_tech_admin=true or not actor_tech or new.id<>tech_id then
      raise exception 'Chỉ Chủ quản hệ thống mới được bảo vệ/cấu hình marker Tech Admin.';
    end if;
  end if;

  if new.role is distinct from old.role then
    if new.role='admin' and new.id<>tech_id then
      raise exception 'role=admin chỉ dành cho Chủ quản hệ thống.';
    end if;
    if old.is_tech_admin=true then
      raise exception 'Tài khoản Chủ quản hệ thống không thể đổi vai trò.';
    end if;
    if actor_tech then
      if new.role not in ('member','truongho') then
        raise exception 'Chủ quản chỉ cấp Trưởng họ hoặc Thành viên.';
      end if;
    elsif actor_truongho then
      if new.role <> 'member' then
        raise exception 'Trưởng họ chỉ được quản lý cấp Thành viên.';
      end if;
    else
      raise exception 'Chỉ Chủ quản hoặc Trưởng họ mới được thay đổi vai trò.';
    end if;
  end if;

  if new.status is distinct from old.status then
    if old.is_tech_admin=true
       or (select auth.uid())=old.id
       or not (actor_tech or actor_truongho) then
      raise exception 'Bạn không có quyền thay đổi trạng thái tài khoản này.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_permission_fields on public.profiles;
create trigger protect_profile_permission_fields
before update on public.profiles
for each row execute function public.protect_profile_permission_fields();

-- RPC: cấp/thu hồi Trưởng họ; Trưởng họ chỉ được hạ về Thành viên.
create or replace function public.set_member_role(target_id uuid, new_role text)
returns public.profiles
language plpgsql
security definer
set search_path=''
as $$
declare
  actor_tech boolean;
  actor_truongho boolean;
  target_row public.profiles;
  tech_id constant uuid := 'cf17b596-f674-4431-aa7f-506f955624ab';
begin
  if (select auth.uid()) is null then
    raise exception 'Yêu cầu đăng nhập.';
  end if;

  if new_role not in ('member','truongho') then
    raise exception 'Quyền hợp lệ chỉ gồm Thành viên hoặc Trưởng họ.';
  end if;

  actor_tech := exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid())
      and p.is_tech_admin=true
      and p.role='admin'
      and (p.status is null or p.status='approved')
  );

  actor_truongho := exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid())
      and p.role='truongho'
      and (p.status is null or p.status='approved')
  );

  select * into target_row
  from public.profiles
  where id=target_id
  for update;

  if not found then
    raise exception 'Không tìm thấy tài khoản.';
  end if;

  if target_row.id=tech_id or target_row.is_tech_admin=true then
    raise exception 'Tài khoản Chủ quản hệ thống không thể bị hạ quyền.';
  end if;

  if target_id=(select auth.uid()) then
    raise exception 'Không thể tự thay đổi quyền của chính mình.';
  end if;

  if new_role='truongho' and not actor_tech then
    raise exception 'Chỉ Chủ quản hệ thống mới được cấp quyền Trưởng họ.';
  end if;

  if new_role='member' and not (actor_tech or actor_truongho) then
    raise exception 'Chỉ Chủ quản hoặc Trưởng họ mới được quản lý cấp Thành viên.';
  end if;

  update public.profiles
  set role=new_role
  where id=target_id
  returning * into target_row;

  return target_row;
end;
$$;

-- RPC: duyệt/từ chối thành viên.
create or replace function public.set_member_status(target_id uuid, new_status text)
returns public.profiles
language plpgsql
security definer
set search_path=''
as $$
declare
  actor_tech boolean;
  actor_truongho boolean;
  target_row public.profiles;
begin
  if (select auth.uid()) is null then
    raise exception 'Yêu cầu đăng nhập.';
  end if;

  if new_status not in ('pending','approved','rejected') then
    raise exception 'Trạng thái không hợp lệ.';
  end if;

  actor_tech := exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid())
      and p.is_tech_admin=true
      and p.role='admin'
      and (p.status is null or p.status='approved')
  );

  actor_truongho := exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid())
      and p.role='truongho'
      and (p.status is null or p.status='approved')
  );

  if not (actor_tech or actor_truongho) then
    raise exception 'Chỉ Chủ quản hoặc Trưởng họ mới được duyệt thành viên.';
  end if;

  select * into target_row
  from public.profiles
  where id=target_id
  for update;

  if not found then
    raise exception 'Không tìm thấy tài khoản.';
  end if;

  if target_row.is_tech_admin=true then
    raise exception 'Tài khoản Chủ quản hệ thống không thể thay đổi trạng thái.';
  end if;

  if target_id=(select auth.uid()) then
    raise exception 'Không thể tự thay đổi trạng thái của chính mình.';
  end if;

  update public.profiles
  set status=new_status
  where id=target_id
  returning * into target_row;

  return target_row;
end;
$$;

-- Trưởng họ được quyền quản lý nội dung cây ở phạm vi gia phả.
drop policy if exists "members write admin" on public.family_members;
create policy "members write admin"
on public.family_members for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id=auth.uid()
      and p.status='approved'
      and (p.is_tech_admin=true or p.role='truongho')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id=auth.uid()
      and p.status='approved'
      and (p.is_tech_admin=true or p.role='truongho')
  )
);

revoke execute on function public.set_member_role(uuid,text) from public, anon;
revoke execute on function public.set_member_status(uuid,text) from public, anon;
grant execute on function public.set_member_role(uuid,text) to authenticated;
grant execute on function public.set_member_status(uuid,text) to authenticated;
