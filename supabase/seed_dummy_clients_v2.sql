-- ============================================================
-- ACTION INCOME MACHINE — Dummy Client Seed Data v2
-- PRE-REQUISITE: Create the 5 users in Supabase Dashboard first:
--   Authentication → Users → Add user
--   emma.carter@testclient.com     / TestPass123!
--   james.obrien@testclient.com    / TestPass123!
--   sophie.nguyen@testclient.com   / TestPass123!
--   marcus.williams@testclient.com / TestPass123!
--   priya.sharma@testclient.com    / TestPass123!
-- Then run this SQL in SQL Editor.
-- Safe to re-run.
-- ============================================================

-- ============================================================
-- CLEANUP — remove previous seed data for these emails
-- ============================================================
delete from public.goals
where client_id in (
  select id from auth.users
  where email in (
    'emma.carter@testclient.com', 'james.obrien@testclient.com',
    'sophie.nguyen@testclient.com', 'marcus.williams@testclient.com',
    'priya.sharma@testclient.com'
  )
);

-- ============================================================
-- HELPER: resolve client IDs by email (works with any UUID)
-- ============================================================
do $$ begin
  -- just a check — will error clearly if users don't exist yet
  if not exists (select 1 from auth.users where email = 'emma.carter@testclient.com') then
    raise exception 'Users not found. Create them in Supabase Dashboard first (Auth → Users → Add user).';
  end if;
end $$;

-- ============================================================
-- 1. UPDATE PROFILES
-- ============================================================
update public.profiles set
  phone = '+1 555-0101', whatsapp_opt_in = true,
  instagram_handle = 'emmacarter_coach',
  instagram_followers = 4200, linkedin_connections = 850,
  facebook_friends = 620
where id = (select id from auth.users where email = 'emma.carter@testclient.com');

update public.profiles set
  phone = '+1 555-0202', whatsapp_opt_in = true,
  instagram_handle = 'jamesobrien_biz',
  instagram_followers = 1100, linkedin_connections = 320,
  facebook_friends = 280
where id = (select id from auth.users where email = 'james.obrien@testclient.com');

update public.profiles set
  phone = '+61 400 111 222', whatsapp_opt_in = true,
  instagram_handle = 'sophieng_digital',
  instagram_followers = 890, linkedin_connections = 210,
  facebook_friends = 450
where id = (select id from auth.users where email = 'sophie.nguyen@testclient.com');

update public.profiles set
  phone = '+44 7700 900123', whatsapp_opt_in = true,
  instagram_handle = 'marcus_wins',
  instagram_followers = 2700, linkedin_connections = 1100,
  youtube_channel = 'MarcusWilliamsTV', youtube_subscribers = 340
where id = (select id from auth.users where email = 'marcus.williams@testclient.com');

update public.profiles set
  phone = '+91 98765 43210', whatsapp_opt_in = true,
  instagram_handle = 'priya.builds',
  instagram_followers = 6800, linkedin_connections = 1850,
  facebook_friends = 900
where id = (select id from auth.users where email = 'priya.sharma@testclient.com');

-- ============================================================
-- 2. GOALS
-- Emma / James:  2025-12-28 → 2026-03-27  (90 days COMPLETED)
-- Sophie:        2026-03-19 → 2026-06-17  (day 11)
-- Marcus:        2026-02-12 → 2026-05-13  (day 46)
-- Priya:         2026-01-13 → 2026-04-13  (day 76)
-- ============================================================
insert into public.goals (id, client_id, title, start_date, end_date,
  revenue_target, month1_target, month2_target, month3_target,
  focus_products, status, notes, zoom_link)
values
  ('20000000-0000-0000-0000-000000000001',
   (select id from auth.users where email = 'emma.carter@testclient.com'),
   'Q1 2026 Revenue Sprint — Hit $15K', '2025-12-28', '2026-03-27',
   15000, 3000, 5000, 7000, '{"low","mid","high"}', 'completed',
   'Focus on converting warm leads into mid and high-ticket clients. Aim for at least 1 high-ticket close per month.',
   'https://zoom.us/j/99999000001'),

  ('20000000-0000-0000-0000-000000000002',
   (select id from auth.users where email = 'james.obrien@testclient.com'),
   '90-Day Income Challenge — $20K', '2025-12-28', '2026-03-27',
   20000, 4000, 7000, 9000, '{"mid","high"}', 'completed',
   'Aggressive target. Must build pipeline fast and close high-ticket within first 30 days.',
   'https://zoom.us/j/99999000002'),

  ('20000000-0000-0000-0000-000000000003',
   (select id from auth.users where email = 'sophie.nguyen@testclient.com'),
   'Spring Sales Sprint — $12K Goal', '2026-03-19', '2026-06-17',
   12000, 2000, 4500, 5500, '{"low","mid"}', 'active',
   'Start by selling low-ticket to build momentum and social proof. Move to mid-ticket by week 4.',
   'https://zoom.us/j/99999000003'),

  ('20000000-0000-0000-0000-000000000004',
   (select id from auth.users where email = 'marcus.williams@testclient.com'),
   'Mid-Year Revenue Goal — $18K', '2026-02-12', '2026-05-13',
   18000, 4000, 7000, 7000, '{"low","mid","high"}', 'active',
   'Balanced mix across all three tiers. Monthly LinkedIn outreach campaign is key driver.',
   'https://zoom.us/j/99999000004'),

  ('20000000-0000-0000-0000-000000000005',
   (select id from auth.users where email = 'priya.sharma@testclient.com'),
   '90-Day High-Ticket Push — $25K', '2026-01-13', '2026-04-13',
   25000, 5000, 9000, 11000, '{"mid","high"}', 'active',
   'Must close 2-3 high-ticket clients to hit target. Currently behind — need to increase sales calls.',
   'https://zoom.us/j/99999000005');

-- ============================================================
-- 3. PRODUCTS
-- ============================================================
insert into public.products (id, client_id, goal_id, tier, name, price, is_active)
values
  -- Emma
  ('30000000-0000-0000-0000-000000000101', (select id from auth.users where email='emma.carter@testclient.com'),    '20000000-0000-0000-0000-000000000001', 'low',  'Starter Toolkit PDF',       27,   true),
  ('30000000-0000-0000-0000-000000000102', (select id from auth.users where email='emma.carter@testclient.com'),    '20000000-0000-0000-0000-000000000001', 'mid',  'Sales Accelerator Course',  997,  true),
  ('30000000-0000-0000-0000-000000000103', (select id from auth.users where email='emma.carter@testclient.com'),    '20000000-0000-0000-0000-000000000001', 'high', '1-on-1 Coaching Package',   6997, true),
  -- James
  ('30000000-0000-0000-0000-000000000201', (select id from auth.users where email='james.obrien@testclient.com'),   '20000000-0000-0000-0000-000000000002', 'low',  'Quick-Start Guide',         17,   true),
  ('30000000-0000-0000-0000-000000000202', (select id from auth.users where email='james.obrien@testclient.com'),   '20000000-0000-0000-0000-000000000002', 'mid',  'Business Blueprint Course', 997,  true),
  ('30000000-0000-0000-0000-000000000203', (select id from auth.users where email='james.obrien@testclient.com'),   '20000000-0000-0000-0000-000000000002', 'high', 'Elite Mentorship Program',  8997, false),
  -- Sophie
  ('30000000-0000-0000-0000-000000000301', (select id from auth.users where email='sophie.nguyen@testclient.com'),  '20000000-0000-0000-0000-000000000003', 'low',  'Digital Starter Pack',      27,   true),
  ('30000000-0000-0000-0000-000000000302', (select id from auth.users where email='sophie.nguyen@testclient.com'),  '20000000-0000-0000-0000-000000000003', 'mid',  'Online Growth Program',     997,  true),
  -- Marcus
  ('30000000-0000-0000-0000-000000000401', (select id from auth.users where email='marcus.williams@testclient.com'),'20000000-0000-0000-0000-000000000004', 'low',  'Mindset Reset Workbook',    27,   true),
  ('30000000-0000-0000-0000-000000000402', (select id from auth.users where email='marcus.williams@testclient.com'),'20000000-0000-0000-0000-000000000004', 'mid',  'LinkedIn Mastery Course',   2997, true),
  ('30000000-0000-0000-0000-000000000403', (select id from auth.users where email='marcus.williams@testclient.com'),'20000000-0000-0000-0000-000000000004', 'high', 'VIP Intensive Program',     9997, true),
  -- Priya
  ('30000000-0000-0000-0000-000000000501', (select id from auth.users where email='priya.sharma@testclient.com'),   '20000000-0000-0000-0000-000000000005', 'mid',  'Signature Coaching Program',2997, true),
  ('30000000-0000-0000-0000-000000000502', (select id from auth.users where email='priya.sharma@testclient.com'),   '20000000-0000-0000-0000-000000000005', 'high', 'Done-With-You Package',     9997, true);

-- ============================================================
-- 4. TARGETS
-- ============================================================
insert into public.targets (id, goal_id, client_id, type, title, description, due_date, is_met, met_at, sort_order)
values
  -- Emma — all targets met (success)
  ('40000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000001', (select id from auth.users where email='emma.carter@testclient.com'),
   'critical', 'Close first mid-ticket sale', 'Sell Sales Accelerator Course to first paying client', '2026-01-14', true, '2026-01-08 14:22:00+00', 1),
  ('40000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000001', (select id from auth.users where email='emma.carter@testclient.com'),
   'critical', 'Close first high-ticket client', 'Sign 1-on-1 coaching package', '2026-02-15', true, '2026-02-17 10:05:00+00', 2),
  ('40000000-0000-0000-0000-000000000103', '20000000-0000-0000-0000-000000000001', (select id from auth.users where email='emma.carter@testclient.com'),
   'critical', 'Hit $10K revenue milestone', 'Cumulative revenue crosses $10,000', '2026-03-01', true, '2026-03-05 09:30:00+00', 3),
  ('40000000-0000-0000-0000-000000000104', '20000000-0000-0000-0000-000000000001', (select id from auth.users where email='emma.carter@testclient.com'),
   'major', 'Build email list to 500 subscribers', 'Grow list through lead magnet and content', '2026-02-28', true, '2026-02-24 16:00:00+00', 4),
  ('40000000-0000-0000-0000-000000000105', '20000000-0000-0000-0000-000000000001', (select id from auth.users where email='emma.carter@testclient.com'),
   'major', 'Post 60 days of content', 'Consistent daily or near-daily social content', '2026-03-20', true, '2026-03-18 20:00:00+00', 5),

  -- James — all targets missed (failure)
  ('40000000-0000-0000-0000-000000000201', '20000000-0000-0000-0000-000000000002', (select id from auth.users where email='james.obrien@testclient.com'),
   'critical', 'Close first high-ticket client by day 30', 'Sign elite mentorship within month 1', '2026-01-27', false, null, 1),
  ('40000000-0000-0000-0000-000000000202', '20000000-0000-0000-0000-000000000002', (select id from auth.users where email='james.obrien@testclient.com'),
   'critical', 'Reach $10K revenue by day 45', 'Half-target checkpoint', '2026-02-11', false, null, 2),
  ('40000000-0000-0000-0000-000000000203', '20000000-0000-0000-0000-000000000002', (select id from auth.users where email='james.obrien@testclient.com'),
   'critical', 'Hit $20K revenue target', 'Full 90-day goal', '2026-03-27', false, null, 3),
  ('40000000-0000-0000-0000-000000000204', '20000000-0000-0000-0000-000000000002', (select id from auth.users where email='james.obrien@testclient.com'),
   'major', 'Conduct 20 discovery calls', 'Fill pipeline with qualified leads', '2026-02-28', false, null, 4),

  -- Sophie — 11 days in, first sale done
  ('40000000-0000-0000-0000-000000000301', '20000000-0000-0000-0000-000000000003', (select id from auth.users where email='sophie.nguyen@testclient.com'),
   'critical', 'Make first sale of any kind', 'Validates offer and builds confidence', '2026-03-31', true, '2026-03-26 11:30:00+00', 1),
  ('40000000-0000-0000-0000-000000000302', '20000000-0000-0000-0000-000000000003', (select id from auth.users where email='sophie.nguyen@testclient.com'),
   'critical', 'Hit $2K revenue by end of month 1', 'Reach $2,000 by April 18', '2026-04-18', false, null, 2),
  ('40000000-0000-0000-0000-000000000303', '20000000-0000-0000-0000-000000000003', (select id from auth.users where email='sophie.nguyen@testclient.com'),
   'critical', 'Close first mid-ticket program sale', 'Sell the Online Growth Program', '2026-04-30', false, null, 3),
  ('40000000-0000-0000-0000-000000000304', '20000000-0000-0000-0000-000000000003', (select id from auth.users where email='sophie.nguyen@testclient.com'),
   'major', 'Post daily for 30 consecutive days', 'Build audience and trust', '2026-04-18', false, null, 4),

  -- Marcus — 46 days in, on pace
  ('40000000-0000-0000-0000-000000000401', '20000000-0000-0000-0000-000000000004', (select id from auth.users where email='marcus.williams@testclient.com'),
   'critical', 'First mid-ticket sale by day 14', 'Close LinkedIn Mastery Course', '2026-02-25', true, '2026-02-17 14:00:00+00', 1),
  ('40000000-0000-0000-0000-000000000402', '20000000-0000-0000-0000-000000000004', (select id from auth.users where email='marcus.williams@testclient.com'),
   'critical', 'Close first VIP Intensive (high-ticket)', 'First $9,997 client', '2026-03-14', true, '2026-03-13 09:15:00+00', 2),
  ('40000000-0000-0000-0000-000000000403', '20000000-0000-0000-0000-000000000004', (select id from auth.users where email='marcus.williams@testclient.com'),
   'critical', 'Hit $12K revenue by day 60', 'Two-thirds target by day 60', '2026-04-12', false, null, 3),
  ('40000000-0000-0000-0000-000000000404', '20000000-0000-0000-0000-000000000004', (select id from auth.users where email='marcus.williams@testclient.com'),
   'major', 'Grow LinkedIn to 1,500 connections', 'Network expansion for warm pipeline', '2026-04-30', false, null, 4),
  ('40000000-0000-0000-0000-000000000405', '20000000-0000-0000-0000-000000000004', (select id from auth.users where email='marcus.williams@testclient.com'),
   'major', 'Publish 4 long-form LinkedIn articles', 'Thought leadership content', '2026-03-31', true, '2026-03-28 17:00:00+00', 5),

  -- Priya — 76 days in, behind pace
  ('40000000-0000-0000-0000-000000000501', '20000000-0000-0000-0000-000000000005', (select id from auth.users where email='priya.sharma@testclient.com'),
   'critical', 'Close first high-ticket client by day 30', 'Sign $9,997 Done-With-You package', '2026-02-11', true, '2026-02-10 13:45:00+00', 1),
  ('40000000-0000-0000-0000-000000000502', '20000000-0000-0000-0000-000000000005', (select id from auth.users where email='priya.sharma@testclient.com'),
   'critical', 'Hit $15K revenue by day 60', 'Critical pace checkpoint', '2026-03-13', false, null, 2),
  ('40000000-0000-0000-0000-000000000503', '20000000-0000-0000-0000-000000000005', (select id from auth.users where email='priya.sharma@testclient.com'),
   'critical', 'Close 3 total high-ticket clients', 'Required to hit $25K target', '2026-04-10', false, null, 3),
  ('40000000-0000-0000-0000-000000000504', '20000000-0000-0000-0000-000000000005', (select id from auth.users where email='priya.sharma@testclient.com'),
   'major', 'Host 2 free webinars for lead generation', 'Convert attendees to clients', '2026-03-31', true, '2026-03-20 18:00:00+00', 4),
  ('40000000-0000-0000-0000-000000000505', '20000000-0000-0000-0000-000000000005', (select id from auth.users where email='priya.sharma@testclient.com'),
   'major', 'Build Instagram to 8,000 followers', 'Audience growth for DM outreach', '2026-04-13', false, null, 5);

-- ============================================================
-- 5. DAILY ACTIONS (4 per client)
-- ============================================================
insert into public.daily_actions (id, goal_id, client_id, label, sort_order, is_active)
values
  -- Emma
  ('50000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000001', (select id from auth.users where email='emma.carter@testclient.com'),    'Post 1 piece of content on social media', 1, true),
  ('50000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000001', (select id from auth.users where email='emma.carter@testclient.com'),    'Send 5 personalised DMs or outreach messages', 2, true),
  ('50000000-0000-0000-0000-000000000103', '20000000-0000-0000-0000-000000000001', (select id from auth.users where email='emma.carter@testclient.com'),    'Conduct or book a discovery call', 3, true),
  ('50000000-0000-0000-0000-000000000104', '20000000-0000-0000-0000-000000000001', (select id from auth.users where email='emma.carter@testclient.com'),    'Log income and review daily numbers', 4, true),
  -- James
  ('50000000-0000-0000-0000-000000000201', '20000000-0000-0000-0000-000000000002', (select id from auth.users where email='james.obrien@testclient.com'),   'Post 1 piece of content on social media', 1, true),
  ('50000000-0000-0000-0000-000000000202', '20000000-0000-0000-0000-000000000002', (select id from auth.users where email='james.obrien@testclient.com'),   'Send 5 personalised DMs or outreach messages', 2, true),
  ('50000000-0000-0000-0000-000000000203', '20000000-0000-0000-0000-000000000002', (select id from auth.users where email='james.obrien@testclient.com'),   'Conduct or book a discovery call', 3, true),
  ('50000000-0000-0000-0000-000000000204', '20000000-0000-0000-0000-000000000002', (select id from auth.users where email='james.obrien@testclient.com'),   'Log income and review daily numbers', 4, true),
  -- Sophie
  ('50000000-0000-0000-0000-000000000301', '20000000-0000-0000-0000-000000000003', (select id from auth.users where email='sophie.nguyen@testclient.com'),  'Post 1 piece of content on social media', 1, true),
  ('50000000-0000-0000-0000-000000000302', '20000000-0000-0000-0000-000000000003', (select id from auth.users where email='sophie.nguyen@testclient.com'),  'Engage with 10 accounts in target audience', 2, true),
  ('50000000-0000-0000-0000-000000000303', '20000000-0000-0000-0000-000000000003', (select id from auth.users where email='sophie.nguyen@testclient.com'),  'Send 3 DMs to warm leads', 3, true),
  ('50000000-0000-0000-0000-000000000304', '20000000-0000-0000-0000-000000000003', (select id from auth.users where email='sophie.nguyen@testclient.com'),  'Log income and review daily numbers', 4, true),
  -- Marcus
  ('50000000-0000-0000-0000-000000000401', '20000000-0000-0000-0000-000000000004', (select id from auth.users where email='marcus.williams@testclient.com'),'Publish or schedule 1 LinkedIn post', 1, true),
  ('50000000-0000-0000-0000-000000000402', '20000000-0000-0000-0000-000000000004', (select id from auth.users where email='marcus.williams@testclient.com'),'Connect with 5 new people on LinkedIn', 2, true),
  ('50000000-0000-0000-0000-000000000403', '20000000-0000-0000-0000-000000000004', (select id from auth.users where email='marcus.williams@testclient.com'),'Conduct a sales call or send a proposal', 3, true),
  ('50000000-0000-0000-0000-000000000404', '20000000-0000-0000-0000-000000000004', (select id from auth.users where email='marcus.williams@testclient.com'),'Log income and review daily numbers', 4, true),
  -- Priya
  ('50000000-0000-0000-0000-000000000501', '20000000-0000-0000-0000-000000000005', (select id from auth.users where email='priya.sharma@testclient.com'),   'Post 1 Instagram reel or story', 1, true),
  ('50000000-0000-0000-0000-000000000502', '20000000-0000-0000-0000-000000000005', (select id from auth.users where email='priya.sharma@testclient.com'),   'Send 10 personalised DMs to qualified prospects', 2, true),
  ('50000000-0000-0000-0000-000000000503', '20000000-0000-0000-0000-000000000005', (select id from auth.users where email='priya.sharma@testclient.com'),   'Conduct minimum 2 discovery calls', 3, true),
  ('50000000-0000-0000-0000-000000000504', '20000000-0000-0000-0000-000000000005', (select id from auth.users where email='priya.sharma@testclient.com'),   'Log income and review daily numbers', 4, true);

-- ============================================================
-- 6. DAILY LOGS
-- Revenue totals:
--   Emma:   $135 + $7,976 + $6,997 = $15,108  ✓ above $15k target
--   James:  $136 + $4,985 = $5,121             ✗ well below $20k target
--   Sophie: $54 + $997 = $1,051               (day 11, just started)
--   Marcus: $81 + $997 + $9,997 = $11,075     (day 46, ahead of pace $9,200)
--   Priya:  $135 + $6,979 + $9,997 = $17,111  (day 76, behind pace $21,111)
-- ============================================================

-- EMMA — 75 of 90 days logged
insert into public.daily_logs (client_id, goal_id, log_date, income_low, income_mid, income_high, expenses, posts_count, emails_count)
select
  (select id from auth.users where email='emma.carter@testclient.com'),
  '20000000-0000-0000-0000-000000000001',
  ('2025-12-28'::date + (n || ' days')::interval)::date,
  case when n in (5,12,20,30,45) then 27 else 0 end,
  case when n in (8,15,22,28,35,42,55,70) then 997 else 0 end,
  case when n = 65 then 6997 else 0 end,
  case when n % 7 = 6 then 40 else 130 end,
  case when n % 7 < 5 then 3 else 1 end,
  case when n % 7 < 5 then 5 else 2 end
from generate_series(0, 89) n
where n not in (0,3,10,17,24,31,38,46,53,60,67,74,80,86,89);

-- JAMES — 35 of 90 days logged (dropped off)
insert into public.daily_logs (client_id, goal_id, log_date, income_low, income_mid, income_high, expenses, posts_count, emails_count)
select
  (select id from auth.users where email='james.obrien@testclient.com'),
  '20000000-0000-0000-0000-000000000002',
  ('2025-12-28'::date + (n || ' days')::interval)::date,
  case when n in (4,10,20,35,50,60,70,80) then 17 else 0 end,
  case when n in (8,25,45,62,78) then 997 else 0 end,
  0,
  case when n < 45 then 200 else 80 end,
  case when n < 30 then 2 when n < 60 then 1 else 0 end,
  case when n < 30 then 3 else 1 end
from generate_series(0, 89) n
where n in (2,4,6,8,10,12,15,18,20,22,25,27,30,33,35,38,40,42,45,48,50,52,55,57,60,62,65,67,70,72,75,78,80,83,85);

-- SOPHIE — all 11 days logged (eager newcomer)
insert into public.daily_logs (client_id, goal_id, log_date, income_low, income_mid, income_high, expenses, posts_count, emails_count)
select
  (select id from auth.users where email='sophie.nguyen@testclient.com'),
  '20000000-0000-0000-0000-000000000003',
  ('2026-03-19'::date + (n || ' days')::interval)::date,
  case when n in (4,8) then 27 else 0 end,
  case when n = 7 then 997 else 0 end,
  0, 50,
  case when n % 7 < 5 then 4 else 2 end,
  case when n % 7 < 5 then 3 else 0 end
from generate_series(0, 10) n;

-- MARCUS — 40 of 46 days logged
insert into public.daily_logs (client_id, goal_id, log_date, income_low, income_mid, income_high, expenses, posts_count, emails_count)
select
  (select id from auth.users where email='marcus.williams@testclient.com'),
  '20000000-0000-0000-0000-000000000004',
  ('2026-02-12'::date + (n || ' days')::interval)::date,
  case when n in (3,15,40) then 27 else 0 end,
  case when n = 5 then 997 else 0 end,
  case when n = 30 then 9997 else 0 end,
  case when n % 7 = 6 then 50 else 180 end,
  case when n % 7 < 5 then 2 else 0 end,
  case when n % 7 < 5 then 4 else 1 end
from generate_series(0, 45) n
where n not in (7,14,21,28,44,45);

-- PRIYA — 65 of 76 days logged
insert into public.daily_logs (client_id, goal_id, log_date, income_low, income_mid, income_high, expenses, posts_count, emails_count)
select
  (select id from auth.users where email='priya.sharma@testclient.com'),
  '20000000-0000-0000-0000-000000000005',
  ('2026-01-13'::date + (n || ' days')::interval)::date,
  case when n in (5,15,25,35,45) then 27 else 0 end,
  case when n in (10,20,30,42,52,60,68) then 997 else 0 end,
  case when n = 55 then 9997 else 0 end,
  case when n < 30 then 220 when n < 60 then 180 else 140 end,
  case when n % 7 < 5 then 4 when n % 7 = 5 then 2 else 0 end,
  case when n % 7 < 5 then 6 else 2 end
from generate_series(0, 75) n
where n not in (0,6,13,20,27,34,41,48,55,74);

-- ============================================================
-- 7. DAILY ACTION COMPLETIONS
-- Emma 80% | James 35% | Sophie 92% | Marcus 70% | Priya 65%
-- ============================================================

-- EMMA
insert into public.daily_action_completions (action_id, client_id, log_date, completed)
select a.action_id::uuid,
  (select id from auth.users where email='emma.carter@testclient.com'),
  ('2025-12-28'::date + (n || ' days')::interval)::date,
  (n + a.offset) % 5 != 0
from generate_series(0, 89) n
cross join (values
  ('50000000-0000-0000-0000-000000000101',0),('50000000-0000-0000-0000-000000000102',1),
  ('50000000-0000-0000-0000-000000000103',2),('50000000-0000-0000-0000-000000000104',3)
) as a(action_id, offset)
where n not in (0,3,10,17,24,31,38,46,53,60,67,74,80,86,89);

-- JAMES
insert into public.daily_action_completions (action_id, client_id, log_date, completed)
select a.action_id::uuid,
  (select id from auth.users where email='james.obrien@testclient.com'),
  ('2025-12-28'::date + (n || ' days')::interval)::date,
  case when n < 20 then (n+a.offset)%3=0 when n < 50 then (n+a.offset)%4=0 else (n+a.offset)%6=0 end
from generate_series(0, 89) n
cross join (values
  ('50000000-0000-0000-0000-000000000201',0),('50000000-0000-0000-0000-000000000202',1),
  ('50000000-0000-0000-0000-000000000203',2),('50000000-0000-0000-0000-000000000204',3)
) as a(action_id, offset)
where n in (2,4,6,8,10,12,15,18,20,22,25,27,30,33,35,38,40,42,45,48,50,52,55,57,60,62,65,67,70,72,75,78,80,83,85);

-- SOPHIE
insert into public.daily_action_completions (action_id, client_id, log_date, completed)
select a.action_id::uuid,
  (select id from auth.users where email='sophie.nguyen@testclient.com'),
  ('2026-03-19'::date + (n || ' days')::interval)::date,
  (n + a.offset) % 12 != 0
from generate_series(0, 10) n
cross join (values
  ('50000000-0000-0000-0000-000000000301',0),('50000000-0000-0000-0000-000000000302',3),
  ('50000000-0000-0000-0000-000000000303',6),('50000000-0000-0000-0000-000000000304',9)
) as a(action_id, offset);

-- MARCUS
insert into public.daily_action_completions (action_id, client_id, log_date, completed)
select a.action_id::uuid,
  (select id from auth.users where email='marcus.williams@testclient.com'),
  ('2026-02-12'::date + (n || ' days')::interval)::date,
  (n + a.offset) % 10 < 7
from generate_series(0, 45) n
cross join (values
  ('50000000-0000-0000-0000-000000000401',0),('50000000-0000-0000-0000-000000000402',2),
  ('50000000-0000-0000-0000-000000000403',4),('50000000-0000-0000-0000-000000000404',6)
) as a(action_id, offset)
where n not in (7,14,21,28,44,45);

-- PRIYA
insert into public.daily_action_completions (action_id, client_id, log_date, completed)
select a.action_id::uuid,
  (select id from auth.users where email='priya.sharma@testclient.com'),
  ('2026-01-13'::date + (n || ' days')::interval)::date,
  case when n < 30 then (n+a.offset)%10<8 when n < 55 then (n+a.offset)%10<6 else (n+a.offset)%10<5 end
from generate_series(0, 75) n
cross join (values
  ('50000000-0000-0000-0000-000000000501',0),('50000000-0000-0000-0000-000000000502',2),
  ('50000000-0000-0000-0000-000000000503',4),('50000000-0000-0000-0000-000000000504',7)
) as a(action_id, offset)
where n not in (0,6,13,20,27,34,41,48,55,74);

-- ============================================================
-- VERIFY — uncomment and run to check totals
-- ============================================================
-- select p.full_name, g.title, g.status, g.revenue_target,
--        coalesce(sum(dl.income_low + dl.income_mid + dl.income_high),0) as revenue_to_date,
--        count(distinct dl.log_date) as days_logged
-- from public.profiles p
-- join public.goals g on g.client_id = p.id
-- left join public.daily_logs dl on dl.goal_id = g.id
-- where p.email like '%@testclient.com'
-- group by p.full_name, g.title, g.status, g.revenue_target
-- order by p.full_name;
