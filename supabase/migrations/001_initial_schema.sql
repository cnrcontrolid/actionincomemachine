-- ============================================================
-- ACTION INCOME MACHINE — Initial Schema
-- Run in Supabase SQL editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. PROFILES
-- Extends auth.users. Created automatically via trigger.
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text not null,
  full_name        text,
  phone            text,
  role             text not null default 'client' check (role in ('admin', 'client')),
  whatsapp_opt_in  boolean not null default true,
  created_at       timestamptz not null default now()
);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. GOALS (90-day sprint per client)
create table public.goals (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.profiles(id) on delete cascade,
  title            text not null,
  start_date       date not null,
  end_date         date not null,
  revenue_target   numeric(12,2) not null,
  month1_target    numeric(12,2),
  month2_target    numeric(12,2),
  month3_target    numeric(12,2),
  focus_products   text[] default '{}',
  status           text not null default 'active' check (status in ('active','completed','abandoned')),
  notes            text,
  zoom_link        text,
  created_at       timestamptz not null default now()
);


-- 3. PRODUCTS (3 tiers per client per goal)
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.profiles(id) on delete cascade,
  goal_id     uuid not null references public.goals(id) on delete cascade,
  tier        text not null check (tier in ('low','mid','high')),
  name        text not null,
  price       numeric(10,2) not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);


-- 4. TARGETS (critical & major milestones within a goal)
create table public.targets (
  id           uuid primary key default gen_random_uuid(),
  goal_id      uuid not null references public.goals(id) on delete cascade,
  client_id    uuid not null references public.profiles(id) on delete cascade,
  type         text not null check (type in ('critical', 'major')),
  title        text not null,
  description  text,
  due_date     date,
  is_met       boolean not null default false,
  met_at       timestamptz,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);


-- 5. DAILY_LOGS (one row per client per day)
create table public.daily_logs (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.profiles(id) on delete cascade,
  goal_id       uuid not null references public.goals(id) on delete cascade,
  log_date      date not null,
  income_low    numeric(10,2) not null default 0,
  income_mid    numeric(10,2) not null default 0,
  income_high   numeric(10,2) not null default 0,
  expenses      numeric(10,2) not null default 0,
  posts_count   int not null default 0,
  emails_count  int not null default 0,
  notes         text,
  created_at    timestamptz not null default now(),
  unique (client_id, log_date)
);


-- 6. DAILY_ACTIONS (predefined checklist items per goal — set by admin)
create table public.daily_actions (
  id          uuid primary key default gen_random_uuid(),
  goal_id     uuid not null references public.goals(id) on delete cascade,
  client_id   uuid not null references public.profiles(id) on delete cascade,
  label       text not null,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);


-- 7. DAILY_ACTION_COMPLETIONS (which actions were done on which day)
create table public.daily_action_completions (
  id          uuid primary key default gen_random_uuid(),
  action_id   uuid not null references public.daily_actions(id) on delete cascade,
  client_id   uuid not null references public.profiles(id) on delete cascade,
  log_date    date not null,
  completed   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (action_id, log_date)
);


-- 8. EMAIL_SEQUENCES (templates with trigger logic)
create table public.email_sequences (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  trigger_type  text not null check (trigger_type in ('days_since_start','goal_milestone','manual')),
  trigger_days  int,
  subject       text not null,
  html_body     text not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);


-- 9. EMAIL_SEQUENCE_ASSIGNMENTS (which sequences apply to which client+goal)
create table public.email_sequence_assignments (
  id           uuid primary key default gen_random_uuid(),
  sequence_id  uuid not null references public.email_sequences(id) on delete cascade,
  client_id    uuid not null references public.profiles(id) on delete cascade,
  goal_id      uuid not null references public.goals(id) on delete cascade,
  sent_at      timestamptz,
  status       text not null default 'pending' check (status in ('pending','sent','skipped')),
  created_at   timestamptz not null default now(),
  unique (sequence_id, goal_id)
);


-- 10. WHATSAPP_MESSAGES (log of all messages sent)
create table public.whatsapp_messages (
  id              uuid primary key default gen_random_uuid(),
  sender_id       uuid not null references public.profiles(id),
  recipient_id    uuid references public.profiles(id),
  recipient_phone text not null,
  message_body    text not null,
  wa_message_id   text,
  status          text not null default 'queued' check (status in ('queued','sent','delivered','failed')),
  error_detail    text,
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);


-- 11. TREND_STEPS (admin-defined action steps per income trend condition)
create table public.trend_steps (
  id          uuid primary key default gen_random_uuid(),
  condition   text not null check (condition in (
    'behind_pace',
    'on_pace',
    'ahead_of_pace',
    'no_logs_3_days',
    'critical_target_missed'
  )),
  title       text not null,
  body        text not null,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);


-- 12. KNOWLEDGE_RESOURCES (admin-curated links for clients)
create table public.knowledge_resources (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  url          text not null,
  category     text not null check (category in ('mindset','marketing','sales','tech','strategy')),
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);
