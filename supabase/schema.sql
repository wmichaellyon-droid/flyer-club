-- Flyer Club MVP schema
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  profile_name text not null default '',
  profile_image_url text not null default '',
  city text not null default 'Austin, TX',
  interests text[] not null default '{}',
  role text not null default 'event_enjoyer',
  taste_answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  promoter text not null,
  posted_by uuid not null references auth.users(id) on delete cascade,
  posted_by_role text not null default 'event_enjoyer',
  start_at timestamptz not null,
  end_at timestamptz not null,
  venue text not null,
  address text not null,
  neighborhood text not null,
  city text not null,
  latitude double precision not null,
  longitude double precision not null,
  category text not null,
  kind text not null,
  subcategory text not null,
  age_rating text not null default 'All Ages',
  tags text[] not null default '{}',
  price_label text not null default 'Free',
  ticket_url text not null default '',
  flyer_image_url text not null,
  hero_color text not null default '#3a1b53',
  description text not null default '',
  moderation_status text not null default 'review',
  moderation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  handle text not null,
  kind text not null check (kind in ('band', 'person', 'promoter', 'venue', 'collective')),
  is_public boolean not null default false,
  bio text not null default '',
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_entities (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  tagged_by_user_id uuid not null references auth.users(id) on delete cascade,
  x_ratio double precision not null check (x_ratio >= 0 and x_ratio <= 1),
  y_ratio double precision not null check (y_ratio >= 0 and y_ratio <= 1),
  created_at timestamptz not null default now()
);

create table if not exists public.interactions (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  state text not null check (state in ('interested', 'going', 'saved')),
  updated_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  destination text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.event_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  reason text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.user_blocks (
  blocker_user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_user_id, blocked_user_id)
);

create table if not exists public.user_follows (
  follower_user_id uuid not null references auth.users(id) on delete cascade,
  following_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (follower_user_id, following_user_id),
  check (follower_user_id <> following_user_id)
);

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_name text not null default '',
  type text not null default 'follower_going',
  event_id uuid references public.events(id) on delete set null,
  event_title text not null default '',
  message text not null default '',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_moderation_status on public.events (moderation_status);
create index if not exists idx_events_city_start_at on public.events (city, start_at);
create index if not exists idx_entities_handle_kind on public.entities (handle, kind);
create index if not exists idx_entities_is_public on public.entities (is_public);
create index if not exists idx_event_entities_event_id on public.event_entities (event_id);
create index if not exists idx_event_entities_entity_id on public.event_entities (entity_id);
create index if not exists idx_interactions_event_id on public.interactions (event_id);
create index if not exists idx_shares_event_id on public.shares (event_id);
create index if not exists idx_reports_event_id on public.event_reports (event_id);
create index if not exists idx_user_follows_following_status on public.user_follows (following_user_id, status);
create index if not exists idx_user_notifications_recipient_created on public.user_notifications (recipient_user_id, created_at desc);
create index if not exists idx_analytics_event_name_created on public.analytics_events (event_name, created_at);

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.entities enable row level security;
alter table public.event_entities enable row level security;
alter table public.interactions enable row level security;
alter table public.shares enable row level security;
alter table public.event_reports enable row level security;
alter table public.user_blocks enable row level security;
alter table public.user_follows enable row level security;
alter table public.user_notifications enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
for update using (auth.uid() = id);

drop policy if exists "events_select_accepted" on public.events;
create policy "events_select_accepted" on public.events
for select using (moderation_status = 'accepted' or posted_by = auth.uid());

drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own" on public.events
for insert with check (posted_by = auth.uid());

drop policy if exists "events_update_own" on public.events;
create policy "events_update_own" on public.events
for update using (posted_by = auth.uid());

drop policy if exists "entities_select_public_or_owner" on public.entities;
create policy "entities_select_public_or_owner" on public.entities
for select using (is_public = true or owner_user_id = auth.uid());

drop policy if exists "entities_insert_own" on public.entities;
create policy "entities_insert_own" on public.entities
for insert with check (owner_user_id = auth.uid());

drop policy if exists "entities_update_own" on public.entities;
create policy "entities_update_own" on public.entities
for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

drop policy if exists "event_entities_select_visible_events" on public.event_entities;
create policy "event_entities_select_visible_events" on public.event_entities
for select using (
  exists (
    select 1
    from public.events e
    where e.id = event_entities.event_id
      and (e.moderation_status = 'accepted' or e.posted_by = auth.uid())
  )
);

drop policy if exists "event_entities_insert_own_event" on public.event_entities;
create policy "event_entities_insert_own_event" on public.event_entities
for insert with check (
  tagged_by_user_id = auth.uid()
  and exists (
    select 1
    from public.events e
    where e.id = event_entities.event_id
      and e.posted_by = auth.uid()
  )
);

drop policy if exists "event_entities_delete_own_tag" on public.event_entities;
create policy "event_entities_delete_own_tag" on public.event_entities
for delete using (tagged_by_user_id = auth.uid());

drop policy if exists "interactions_select_own" on public.interactions;
create policy "interactions_select_own" on public.interactions
for select using (user_id = auth.uid());

drop policy if exists "interactions_insert_own" on public.interactions;
create policy "interactions_insert_own" on public.interactions
for insert with check (user_id = auth.uid());

drop policy if exists "interactions_update_own" on public.interactions;
create policy "interactions_update_own" on public.interactions
for update using (user_id = auth.uid());

drop policy if exists "interactions_delete_own" on public.interactions;
create policy "interactions_delete_own" on public.interactions
for delete using (user_id = auth.uid());

drop policy if exists "shares_insert_own" on public.shares;
create policy "shares_insert_own" on public.shares
for insert with check (sender_user_id = auth.uid());

drop policy if exists "reports_insert_own" on public.event_reports;
create policy "reports_insert_own" on public.event_reports
for insert with check (reporter_user_id = auth.uid());

drop policy if exists "blocks_manage_own" on public.user_blocks;
create policy "blocks_manage_own" on public.user_blocks
for all using (blocker_user_id = auth.uid()) with check (blocker_user_id = auth.uid());

drop policy if exists "follows_select_participants" on public.user_follows;
create policy "follows_select_participants" on public.user_follows
for select using (follower_user_id = auth.uid() or following_user_id = auth.uid());

drop policy if exists "follows_insert_by_follower" on public.user_follows;
create policy "follows_insert_by_follower" on public.user_follows
for insert with check (follower_user_id = auth.uid());

drop policy if exists "follows_update_participants" on public.user_follows;
create policy "follows_update_participants" on public.user_follows
for update using (follower_user_id = auth.uid() or following_user_id = auth.uid())
with check (follower_user_id = auth.uid() or following_user_id = auth.uid());

drop policy if exists "notifications_select_own" on public.user_notifications;
create policy "notifications_select_own" on public.user_notifications
for select using (recipient_user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.user_notifications;
create policy "notifications_update_own" on public.user_notifications
for update using (recipient_user_id = auth.uid())
with check (recipient_user_id = auth.uid());

drop policy if exists "notifications_insert_any_auth" on public.user_notifications;
create policy "notifications_insert_any_auth" on public.user_notifications
for insert with check (auth.uid() is not null);

drop policy if exists "analytics_insert_any_auth" on public.analytics_events;
create policy "analytics_insert_any_auth" on public.analytics_events
for insert with check (auth.uid() is not null);
