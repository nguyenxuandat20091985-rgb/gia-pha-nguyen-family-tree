-- Chạy 1 lần trong Supabase → SQL Editor → Run
-- Tạo bảng thư viện ảnh/video dòng họ (đồng bộ mọi thiết bị)

create table if not exists public.family_gallery (
  id text primary key,
  type text not null default 'image' check (type in ('image','video')),
  url text not null,
  title text default '',
  note text default '',
  created_at timestamptz not null default now()
);

create index if not exists family_gallery_created_at_idx on public.family_gallery (created_at desc);

alter table public.family_gallery enable row level security;

drop policy if exists "gallery_public_read" on public.family_gallery;
create policy "gallery_public_read" on public.family_gallery
  for select using (true);

drop policy if exists "gallery_public_write" on public.family_gallery;
create policy "gallery_public_write" on public.family_gallery
  for all using (true) with check (true);

grant select, insert, update, delete on public.family_gallery to anon, authenticated;
