-- ============================================================
-- ACTION INCOME MACHINE — Row Level Security Policies
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.products enable row level security;
alter table public.targets enable row level security;
alter table public.daily_logs enable row level security;
alter table public.daily_actions enable row level security;
alter table public.daily_action_completions enable row level security;
alter table public.email_sequences enable row level security;
alter table public.email_sequence_assignments enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.trend_steps enable row level security;
alter table public.knowledge_resources enable row level security;


-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;


-- PROFILES
create policy "profiles_read" on public.profiles
  for select using (id = auth.uid() or is_admin());

create policy "profiles_update" on public.profiles
  for update using (id = auth.uid() or is_admin());

create policy "profiles_insert" on public.profiles
  for insert with check (id = auth.uid() or is_admin());


-- GOALS
create policy "goals_read" on public.goals
  for select using (client_id = auth.uid() or is_admin());

create policy "goals_admin_write" on public.goals
  for all using (is_admin());


-- PRODUCTS
create policy "products_read" on public.products
  for select using (client_id = auth.uid() or is_admin());

create policy "products_admin_write" on public.products
  for all using (is_admin());


-- TARGETS
create policy "targets_read" on public.targets
  for select using (client_id = auth.uid() or is_admin());

create policy "targets_admin_write" on public.targets
  for all using (is_admin());

-- Clients can mark targets as met
create policy "targets_client_update_met" on public.targets
  for update using (client_id = auth.uid())
  with check (client_id = auth.uid());


-- DAILY_LOGS
create policy "daily_logs_rw" on public.daily_logs
  for all using (client_id = auth.uid() or is_admin());


-- DAILY_ACTIONS
create policy "daily_actions_read" on public.daily_actions
  for select using (client_id = auth.uid() or is_admin());

create policy "daily_actions_admin_write" on public.daily_actions
  for all using (is_admin());


-- DAILY_ACTION_COMPLETIONS
create policy "completions_rw" on public.daily_action_completions
  for all using (client_id = auth.uid() or is_admin());


-- EMAIL_SEQUENCES (admin only)
create policy "sequences_admin" on public.email_sequences
  for all using (is_admin());


-- EMAIL_SEQUENCE_ASSIGNMENTS (admin only)
create policy "assignments_admin" on public.email_sequence_assignments
  for all using (is_admin());


-- WHATSAPP_MESSAGES (admin only)
create policy "whatsapp_admin" on public.whatsapp_messages
  for all using (is_admin());


-- TREND_STEPS
-- Clients can read active steps; admin manages all
create policy "trend_steps_client_read" on public.trend_steps
  for select using (is_active = true or is_admin());

create policy "trend_steps_admin_write" on public.trend_steps
  for all using (is_admin());


-- KNOWLEDGE_RESOURCES
-- Clients can read published resources; admin manages all
create policy "knowledge_client_read" on public.knowledge_resources
  for select using (is_published = true or is_admin());

create policy "knowledge_admin_write" on public.knowledge_resources
  for all using (is_admin());
