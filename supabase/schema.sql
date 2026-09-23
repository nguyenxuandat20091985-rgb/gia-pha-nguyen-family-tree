-- Gia Phả Họ Nguyễn – schema Phase 2 (Supabase)
-- Chạy trong SQL Editor của project Supabase RIÊNG cho dòng họ này.
-- Không hard-code service_role key vào frontend.

-- profiles
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  phone text,
  avatar_url text,
  branch_label text,
  role text default 'member' check (role in ('member', 'admin')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "profiles read" on profiles for select using (true);
create policy "profiles update own" on profiles for update using (auth.uid() = id);

-- family tree (migrate from localStorage JSON)
create table if not exists family_members (
  id text primary key,
  name text not null,
  gender text,
  birth_date text,
  death_date text,
  death_anniversary text,
  notes text,
  photo_url text,
  is_root boolean default false,
  is_side boolean default false,
  parent_id text,
  created_at timestamptz default now()
);

create table if not exists family_relationships (
  id bigserial primary key,
  parent_id text references family_members(id) on delete cascade,
  child_id text references family_members(id) on delete cascade,
  relation_type text check (relation_type in ('child', 'spouse', 'side'))
);

alter table family_members enable row level security;
create policy "members read" on family_members for select using (true);
create policy "members write admin" on family_members for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- events (Đám / Hiếu Hỉ)
create table if not exists family_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text,
  related_person text,
  event_date date,
  event_time time,
  address text,
  lat double precision,
  lng double precision,
  content text,
  pinned boolean default false,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table family_events enable row level security;
create policy "events read" on family_events for select using (true);
create policy "events insert auth" on family_events for insert with check (auth.uid() is not null);

-- posts / board
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id),
  content text not null,
  pinned boolean default false,
  created_at timestamptz default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  author_id uuid references profiles(id),
  content text not null,
  created_at timestamptz default now()
);

alter table posts enable row level security;
create policy "posts read" on posts for select using (true);
create policy "posts insert auth" on posts for insert with check (auth.uid() is not null);

-- messages (realtime)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  is_group boolean default true,
  created_at timestamptz default now()
);

create table if not exists conversation_members (
  conversation_id uuid references conversations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id),
  body text,
  created_at timestamptz default now()
);

alter table messages enable row level security;
create policy "messages members only" on messages for select using (
  exists (
    select 1 from conversation_members cm
    where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()
  )
);

-- daily AI news (admin/cron only write)
create table if not exists daily_news (
  id uuid primary key default gen_random_uuid(),
  news_date date unique,
  content text not null,
  created_at timestamptz default now()
);

alter table daily_news enable row level security;
create policy "news read" on daily_news for select using (true);

-- ritual texts can stay static in frontend or mirror here
create table if not exists ritual_texts (
  id text primary key,
  name text,
  category text,
  occasion text,
  content text,
  source text
);


-- Phase 2 hardening: profile bootstrap, ownership and realtime
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security invoker
as $$
begin
  insert into public.profiles(id, display_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.phone, new.email), new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop policy if exists "events insert auth" on family_events;
create policy "events insert auth" on family_events for insert to authenticated
with check (auth.uid() is not null);
create policy "events update own_or_admin" on family_events for update to authenticated
using (created_by = auth.uid() or exists(select 1 from profiles where id=auth.uid() and role='admin'))
with check (created_by = auth.uid() or exists(select 1 from profiles where id=auth.uid() and role='admin'));
create policy "events delete own_or_admin" on family_events for delete to authenticated
using (created_by = auth.uid() or exists(select 1 from profiles where id=auth.uid() and role='admin'));

drop policy if exists "posts insert auth" on posts;
create policy "posts insert auth" on posts for insert to authenticated
with check (author_id = auth.uid());
create policy "posts update own_or_admin" on posts for update to authenticated
using (author_id = auth.uid() or exists(select 1 from profiles where id=auth.uid() and role='admin'))
with check (author_id = auth.uid() or exists(select 1 from profiles where id=auth.uid() and role='admin'));
create policy "posts delete own_or_admin" on posts for delete to authenticated
using (author_id = auth.uid() or exists(select 1 from profiles where id=auth.uid() and role='admin'));

alter table comments enable row level security;
create policy "comments read" on comments for select to authenticated using (true);
create policy "comments insert own" on comments for insert to authenticated with check (author_id=auth.uid());
create policy "comments update own" on comments for update to authenticated using (author_id=auth.uid()) with check (author_id=auth.uid());
create policy "comments delete own_or_admin" on comments for delete to authenticated
using (author_id=auth.uid() or exists(select 1 from profiles where id=auth.uid() and role='admin'));

alter table conversations enable row level security;
create policy "conversation members read" on conversations for select to authenticated
using (exists(select 1 from conversation_members cm where cm.conversation_id=id and cm.user_id=auth.uid()));
create policy "conversation members insert" on conversation_members for insert to authenticated
with check (user_id=auth.uid());
alter table conversation_members enable row level security;
create policy "conversation membership read own" on conversation_members for select to authenticated using (user_id=auth.uid());

create policy "messages insert members" on messages for insert to authenticated
with check (sender_id=auth.uid() and exists(select 1 from conversation_members cm where cm.conversation_id=messages.conversation_id and cm.user_id=auth.uid()));

alter table daily_news enable row level security;

-- Enable Realtime publication for shared family data. Safe if already present.
do $$
begin
  alter publication supabase_realtime add table family_members;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table family_events;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table posts;
exception when duplicate_object then null;
end $$;
