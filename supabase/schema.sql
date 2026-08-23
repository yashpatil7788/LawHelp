create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  uid uuid,
  email text,
  name text,
  user_type text,
  type text,
  phone text,
  age integer,
  gender text,
  location text,
  coordinates jsonb,
  photo_url text,
  profile_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.lawyers (
  id uuid primary key references auth.users(id) on delete cascade,
  uid uuid,
  email text,
  name text,
  age integer,
  gender text,
  contact text,
  consultation_fees numeric,
  location text,
  latitude double precision,
  longitude double precision,
  years_of_experience integer,
  qualification text,
  type text[] default '{}',
  photo_url text,
  degree_image_url text,
  profile_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lawyer_id uuid references public.lawyers(id) on delete set null,
  lawyer_name text,
  name text,
  age integer,
  gender text,
  case_type text not null,
  query text not null,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text,
  language text,
  explanation text,
  question text,
  answer text,
  created_at timestamptz default now()
);

create table if not exists public.chatbots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chats jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  article_link text,
  summary text,
  impact_analysis text,
  related_documents jsonb,
  priority text,
  status text default 'unread',
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.lawyers enable row level security;
alter table public.appointments enable row level security;
alter table public.documents enable row level security;
alter table public.chatbots enable row level security;
alter table public.alerts enable row level security;

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Authenticated users read lawyers" on public.lawyers;
create policy "Authenticated users read lawyers" on public.lawyers for select to authenticated
  using (true);

drop policy if exists "Lawyers manage own profile" on public.lawyers;
create policy "Lawyers manage own profile" on public.lawyers for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users manage own appointments" on public.appointments;
create policy "Users manage own appointments" on public.appointments for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own documents" on public.documents;
create policy "Users manage own documents" on public.documents for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own chatbot" on public.chatbots;
create policy "Users manage own chatbot" on public.chatbots for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own alerts" on public.alerts;
create policy "Users manage own alerts" on public.alerts for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true), ('case-files', 'case-files', false)
on conflict (id) do nothing;

drop policy if exists "Users upload profile images" on storage.objects;
create policy "Users upload profile images" on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Users update profile images" on storage.objects;
create policy "Users update profile images" on storage.objects for update to authenticated
  using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Users read profile images" on storage.objects;
create policy "Users read profile images" on storage.objects for select to authenticated
  using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Users manage case files" on storage.objects;
create policy "Users manage case files" on storage.objects for all to authenticated
  using (bucket_id = 'case-files' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'case-files' and (storage.foldername(name))[1] = (select auth.uid()::text));
