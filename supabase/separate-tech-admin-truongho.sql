-- Gia Phả Họ Nguyễn — tách biệt Chủ quản hệ thống (Tech Admin) / Trưởng họ / Thành viên
-- Idempotent migration: chỉ thay đổi schema và logic phân quyền.

alter table public.profiles
  add column if not exists is_tech_admin boolean not null default false;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('member','admin','truongho'));

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

create or replace function public.protect_profile_permission_fields()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  actor_tech boolean;
  actor_truongho boolean;
begin
  actor_tech := exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid())
      and p.is_tech_admin=true and p.role='admin'
      and (p.status is null or p.status='approved')
  );
  actor_truongho := exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid())
      and p.role='truongho'
      and (p.status is null or p.status='approved')
  );

  if new.is_tech_admin is distinct from old.is_tech_admin then
    if old.is_tech_admin=true or not actor_tech then
      raise exception 'Chỉ Chủ quản hệ thống mới được thay đổi cờ Tech Admin.';
    end if;
  end if;

  if new.role is distinct from old.role then
    if old.is_tech_admin=true
       or (select auth.uid())=old.id
       or not actor_tech then
      raise exception 'Chỉ Chủ quản hệ thống mới được cấp hoặc thu hồi quyền Admin/Trưởng họ.';
    end if;
  end if;

  if new.status is distinct from old.status then
    if old.is_tech_admin=true
       or (select auth.uid())=old.id
       or not (actor_tech or actor_truongho) then
      raise exception 'Bạn không có quyền thay đổi trạng thái thành viên này.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_permission_fields on public.profiles;
create trigger protect_profile_permission_fields
before update on public.profiles
for each row execute function public.protect_profile_permission_fields();

create or replace function public.set_member_role(target_id uuid, new_role text)
returns public.profiles
language plpgsql
security definer
set search_path=''
as $$
declare
  actor_tech boolean;
  target_row public.profiles;
begin
  if (select auth.uid()) is null then raise exception 'Yêu cầu đăng nhập.'; end if;

  actor_tech := exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid())
      and p.is_tech_admin=true and p.role='admin'
      and (p.status is null or p.status='approved')
  );

  if not actor_tech then
    if new_role <> 'member' then
      raise exception 'Chỉ Chủ quản hệ thống mới được cấp hoặc thu hồi Admin/Trưởng họ.';
    end if;
    if not exists (
      select 1 from public.profiles p
      where p.id=(select auth.uid())
        and p.role='truongho'
        and (p.status is null or p.status='approved')
    ) then
      raise exception 'Chỉ Chủ quản hoặc Trưởng họ mới được quản lý quyền thành viên.';
    end if;
  end if;

  if new_role not in ('member','admin','truongho') then raise exception 'Quyền không hợp lệ.'; end if;

  select * into target_row from public.profiles where id=target_id;
  if not found then raise exception 'Không tìm thấy tài khoản.'; end if;
  if target_row.is_tech_admin=true then raise exception 'Tài khoản Chủ quản hệ thống không thể bị hạ quyền.'; end if;
  if target_id=(select auth.uid()) then raise exception 'Không thể tự thay đổi quyền của chính mình.'; end if;

  update public.profiles set role=new_role where id=target_id
  returning * into target_row;
  return target_row;
end;
$$;

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
  if (select auth.uid()) is null then raise exception 'Yêu cầu đăng nhập.'; end if;
  if new_status not in ('pending','approved','rejected') then raise exception 'Trạng thái không hợp lệ.'; end if;

  actor_tech := exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid())
      and p.is_tech_admin=true and p.role='admin'
      and (p.status is null or p.status='approved')
  );
  actor_truongho := exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid())
      and p.role='truongho'
      and (p.status is null or p.status='approved')
  );

  if not (actor_tech or actor_truongho) then raise exception 'Chỉ Chủ quản hoặc Trưởng họ mới được duyệt thành viên.'; end if;

  select * into target_row from public.profiles where id=target_id;
  if not found then raise exception 'Không tìm thấy tài khoản.'; end if;
  if target_row.is_tech_admin=true then raise exception 'Tài khoản Chủ quản hệ thống không thể thay đổi trạng thái.'; end if;
  if target_id=(select auth.uid()) then raise exception 'Không thể tự thay đổi trạng thái của chính mình.'; end if;

  update public.profiles set status=new_status where id=target_id
  returning * into target_row;
  return target_row;
end;
$$;

revoke execute on function public.set_member_role(uuid,text) from public, anon;
revoke execute on function public.set_member_status(uuid,text) from public, anon;
grant execute on function public.set_member_role(uuid,text) to authenticated;
grant execute on function public.set_member_status(uuid,text) to authenticated;
