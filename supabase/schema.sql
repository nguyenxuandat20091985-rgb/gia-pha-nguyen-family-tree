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
