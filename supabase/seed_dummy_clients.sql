-- ============================================================
-- ACTION INCOME MACHINE — Dummy Client Seed Data
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Safe to re-run: starts with cleanup of these specific emails
--
-- 5 Clients:
--   Emma Carter    — 90 days COMPLETE, SUCCESS  ($15k target, $15.1k achieved)
--   James O'Brien  — 90 days COMPLETE, FAILED   ($20k target, $5.1k achieved)
--   Sophie Nguyen  — Day 11  (early stage)       ($12k target, active)
--   Marcus Williams— Day 46  (mid stage)          ($18k target, active, on pace)
--   Priya Sharma   — Day 76  (late stage, behind) ($25k target, active, behind pace)
--
-- All test passwords: TestPass123!
-- ============================================================

-- ============================================================
-- CLEANUP — remove any previous run of this seed
-- ============================================================
delete from auth.users where email in (
  'emma.carter@testclient.com',
  'james.obrien@testclient.com',
  'sophie.nguyen@testclient.com',
  'marcus.williams@testclient.com',
  'priya.sharma@testclient.com'
);

-- ============================================================
-- 1. AUTH USERS  (trigger auto-creates profile rows)
-- ============================================================
insert into auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  aud, role, created_at, updated_at
) values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'emma.carter@testclient.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}',
    '{"full_name":"Emma Carter"}',
    'authenticated', 'authenticated', now(), now()
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'james.obrien@testclient.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}',
    '{"full_name":"James O''Brien"}',
    'authenticated', 'authenticated', now(), now()
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'sophie.nguyen@testclient.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sophie Nguyen"}',
    'authenticated', 'authenticated', now(), now()
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'marcus.williams@testclient.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}',
    '{"full_name":"Marcus Williams"}',
    'authenticated', 'authenticated', now(), now()
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'priya.sharma@testclient.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}',
    '{"full_name":"Priya Sharma"}',
    'authenticated', 'authenticated', now(), now()
  );

-- ============================================================
-- 2. UPDATE PROFILES (trigger created rows, now enrich them)
-- ============================================================
update public.profiles set
  phone = '+1 555-0101', whatsapp_opt_in = true,
  instagram_handle = 'emmacarter_coach',
  instagram_followers = 4200, linkedin_connections = 850,
  facebook_friends = 620
where id = '10000000-0000-0000-0000-000000000001';

update public.profiles set
  phone = '+1 555-0202', whatsapp_opt_in = true,
  instagram_handle = 'jamesobrien_biz',
  instagram_followers = 1100, linkedin_connections = 320,
  facebook_friends = 280
where id = '10000000-0000-0000-0000-000000000002';

update public.profiles set
  phone = '+61 400 111 222', whatsapp_opt_in = true,
  instagram_handle = 'sophieng_digital',
  instagram_followers = 890, linkedin_connections = 210,
  facebook_friends = 450
where id = '10000000-0000-0000-0000-000000000003';

update public.profiles set
  phone = '+44 7700 900123', whatsapp_opt_in = true,
  instagram_handle = 'marcus_wins',
  instagram_followers = 2700, linkedin_connections = 1100,
  youtube_channel = 'MarcusWilliamsTV',
  youtube_subscribers = 340
where id = '10000000-0000-0000-0000-000000000004';

update public.profiles set
  phone = '+91 98765 43210', whatsapp_opt_in = true,
  instagram_handle = 'priya.builds',
  instagram_followers = 6800, linkedin_connections = 1850,
  facebook_friends = 900
where id = '10000000-0000-0000-0000-000000000005';

-- ============================================================
-- 3. GOALS
-- start/end dates:
--   Emma / James:  2025-12-28 → 2026-03-27  (90 days, COMPLETED)
--   Sophie:        2026-03-19 → 2026-06-17  (day 11 today = 2026-03-29)
--   Marcus:        2026-02-12 → 2026-05-13  (day 46 today)
--   Priya:         2026-01-13 → 2026-04-13  (day 76 today)
-- ============================================================
insert into public.goals (id, client_id, title, start_date, end_date,
  revenue_target, month1_target, month2_target, month3_target,
  focus_products, status, notes, zoom_link)
values
  -- Emma: SUCCESS
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Q1 2026 Revenue Sprint — Hit $15K',
    '2025-12-28', '2026-03-27',
    15000, 3000, 5000, 7000,
    '{"low","mid","high"}', 'completed',
    'Focus on converting warm leads into mid and high-ticket clients. Aim for at least 1 high-ticket close per month.',
    'https://zoom.us/j/99999000001'
  ),
  -- James: FAILED
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    '90-Day Income Challenge — $20K',
    '2025-12-28', '2026-03-27',
    20000, 4000, 7000, 9000,
    '{"mid","high"}', 'completed',
    'Aggressive target. Must build pipeline fast and close high-ticket within first 30 days.',
    'https://zoom.us/j/99999000002'
  ),
  -- Sophie: 11 days in
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    'Spring Sales Sprint — $12K Goal',
    '2026-03-19', '2026-06-17',
    12000, 2000, 4500, 5500,
    '{"low","mid"}', 'active',
    'Start by selling low-ticket to build momentum and social proof. Move to mid-ticket by week 4.',
    'https://zoom.us/j/99999000003'
  ),
  -- Marcus: 46 days in, on pace
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000004',
    'Mid-Year Revenue Goal — $18K',
    '2026-02-12', '2026-05-13',
    18000, 4000, 7000, 7000,
    '{"low","mid","high"}', 'active',
    'Balanced mix across all three tiers. Monthly LinkedIn outreach campaign is key driver.',
    'https://zoom.us/j/99999000004'
  ),
  -- Priya: 76 days in, behind pace
  (
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000005',
    '90-Day High-Ticket Push — $25K',
    '2026-01-13', '2026-04-13',
    25000, 5000, 9000, 11000,
    '{"mid","high"}', 'active',
    'Must close 2-3 high-ticket clients to hit target. Currently behind — need to increase sales calls.',
    'https://zoom.us/j/99999000005'
  );

-- ============================================================
-- 4. PRODUCTS (3 tiers per client)
-- ============================================================
insert into public.products (id, client_id, goal_id, tier, name, price, is_active)
values
  -- Emma
  ('30000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'low',  'Starter Toolkit PDF',     27,   true),
  ('30000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'mid',  'Sales Accelerator Course', 997,  true),
  ('30000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'high', '1-on-1 Coaching Package',  6997, true),
  -- James
  ('30000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'low',  'Quick-Start Guide',        17,   true),
  ('30000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'mid',  'Business Blueprint Course', 997,  true),
  ('30000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'high', 'Elite Mentorship Program',  8997, false),
  -- Sophie
  ('30000000-0000-0000-0000-000000000301', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'low',  'Digital Starter Pack',     27,   true),
  ('30000000-0000-0000-0000-000000000302', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'mid',  'Online Growth Program',    997,  true),
  -- Marcus
  ('30000000-0000-0000-0000-000000000401', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'low',  'Mindset Reset Workbook',   27,   true),
  ('30000000-0000-0000-0000-000000000402', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'mid',  'LinkedIn Mastery Course',  2997, true),
  ('30000000-0000-0000-0000-000000000403', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'high', 'VIP Intensive Program',    9997, true),
  -- Priya
  ('30000000-0000-0000-0000-000000000501', '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'mid',  'Signature Coaching Program', 2997, true),
  ('30000000-0000-0000-0000-000000000502', '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'high', 'Done-With-You Package',      9997, true);

-- ============================================================
-- 5. TARGETS
-- ============================================================
insert into public.targets (id, goal_id, client_id, type, title, description, due_date, is_met, met_at, sort_order)
values
  -- Emma (SUCCESS — all met)
  ('40000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'critical', 'Close first mid-ticket sale', 'Sell the Sales Accelerator Course to first paying client', '2026-01-14', true, '2026-01-08 14:22:00+00', 1),
  ('40000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'critical', 'Close first high-ticket client', 'Sign up first 1-on-1 coaching package', '2026-02-15', true, '2026-02-17 10:05:00+00', 2),
  ('40000000-0000-0000-0000-000000000103', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'critical', 'Hit $10K revenue milestone', 'Cumulative revenue crosses $10,000', '2026-03-01', true, '2026-03-05 09:30:00+00', 3),
  ('40000000-0000-0000-0000-000000000104', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'major', 'Build email list to 500 subscribers', 'Grow list through lead magnet and content', '2026-02-28', true, '2026-02-24 16:00:00+00', 4),
  ('40000000-0000-0000-0000-000000000105', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'major', 'Post 60 days of content', 'Consistent daily or near-daily social content', '2026-03-20', true, '2026-03-18 20:00:00+00', 5),

  -- James (FAILED — critical targets missed)
  ('40000000-0000-0000-0000-000000000201', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
   'critical', 'Close first high-ticket client by day 30', 'Sign elite mentorship program within month 1', '2027-01-27', false, null, 1),
  ('40000000-0000-0000-0000-000000000202', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
   'critical', 'Reach $10K revenue by day 45', 'Half-target checkpoint', '2026-02-11', false, null, 2),
  ('40000000-0000-0000-0000-000000000203', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
   'critical', 'Hit $20K revenue target', 'Full 90-day goal', '2026-03-27', false, null, 3),
  ('40000000-0000-0000-0000-000000000204', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
   'major', 'Conduct 20 discovery calls', 'Fill pipeline with qualified leads', '2026-02-28', false, null, 4),

  -- Sophie (11 days in — just starting)
  ('40000000-0000-0000-0000-000000000301', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
   'critical', 'Make first sale of any kind', 'Get first revenue — validates offer and confidence', '2026-03-31', true, '2026-03-26 11:30:00+00', 1),
  ('40000000-0000-0000-0000-000000000302', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
   'critical', 'Hit $2K revenue by end of month 1', 'Reach $2,000 by April 18', '2026-04-18', false, null, 2),
  ('40000000-0000-0000-0000-000000000303', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
   'critical', 'Close first mid-ticket program sale', 'Sell the Online Growth Program', '2026-04-30', false, null, 3),
  ('40000000-0000-0000-0000-000000000304', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
   'major', 'Post daily for 30 consecutive days', 'Build audience and trust', '2026-04-18', false, null, 4),

  -- Marcus (46 days in — on pace)
  ('40000000-0000-0000-0000-000000000401', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004',
   'critical', 'First mid-ticket sale by day 14', 'Close LinkedIn Mastery Course', '2026-02-25', true, '2026-02-17 14:00:00+00', 1),
  ('40000000-0000-0000-0000-000000000402', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004',
   'critical', 'Close first VIP Intensive (high-ticket)', 'First $9,997 client', '2026-03-14', true, '2026-03-13 09:15:00+00', 2),
  ('40000000-0000-0000-0000-000000000403', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004',
   'critical', 'Hit $12K revenue by day 60', 'Two-thirds target by day 60', '2026-04-12', false, null, 3),
  ('40000000-0000-0000-0000-000000000404', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004',
   'major', 'Grow LinkedIn to 1,500 connections', 'Network expansion for warm pipeline', '2026-04-30', false, null, 4),
  ('40000000-0000-0000-0000-000000000405', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004',
   'major', 'Publish 4 long-form LinkedIn articles', 'Thought leadership content', '2026-03-31', true, '2026-03-28 17:00:00+00', 5),

  -- Priya (76 days in — behind pace)
  ('40000000-0000-0000-0000-000000000501', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005',
   'critical', 'Close first high-ticket client by day 30', 'Sign $9,997 Done-With-You package', '2026-02-11', true, '2026-02-10 13:45:00+00', 1),
  ('40000000-0000-0000-0000-000000000502', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005',
   'critical', 'Hit $15K revenue by day 60', 'Critical pace checkpoint', '2026-03-13', false, null, 2),
  ('40000000-0000-0000-0000-000000000503', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005',
   'critical', 'Close 3 total high-ticket clients', 'Required for $25K target', '2026-04-10', false, null, 3),
  ('40000000-0000-0000-0000-000000000504', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005',
   'major', 'Host 2 free webinars for lead generation', 'Convert attendees to clients', '2026-03-31', true, '2026-03-20 18:00:00+00', 4),
  ('40000000-0000-0000-0000-000000000505', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005',
   'major', 'Build Instagram to 8,000 followers', 'Audience growth for DM outreach', '2026-04-13', false, null, 5);

-- ============================================================
-- 6. DAILY ACTIONS (4 per client)
-- ============================================================
insert into public.daily_actions (id, goal_id, client_id, label, sort_order, is_active)
values
  -- Emma
  ('50000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Post 1 piece of content on social media', 1, true),
  ('50000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Send 5 personalised DMs or outreach messages', 2, true),
  ('50000000-0000-0000-0000-000000000103', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Conduct or book a discovery call', 3, true),
  ('50000000-0000-0000-0000-000000000104', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Log income and review daily numbers', 4, true),
  -- James
  ('50000000-0000-0000-0000-000000000201', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Post 1 piece of content on social media', 1, true),
  ('50000000-0000-0000-0000-000000000202', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Send 5 personalised DMs or outreach messages', 2, true),
  ('50000000-0000-0000-0000-000000000203', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Conduct or book a discovery call', 3, true),
  ('50000000-0000-0000-0000-000000000204', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Log income and review daily numbers', 4, true),
  -- Sophie
  ('50000000-0000-0000-0000-000000000301', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Post 1 piece of content on social media', 1, true),
  ('50000000-0000-0000-0000-000000000302', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Engage with 10 accounts in target audience', 2, true),
  ('50000000-0000-0000-0000-000000000303', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Send 3 DMs to warm leads', 3, true),
  ('50000000-0000-0000-0000-000000000304', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Log income and review daily numbers', 4, true),
  -- Marcus
  ('50000000-0000-0000-0000-000000000401', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Publish or schedule 1 LinkedIn post', 1, true),
  ('50000000-0000-0000-0000-000000000402', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Connect with 5 new people on LinkedIn', 2, true),
  ('50000000-0000-0000-0000-000000000403', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Conduct a sales call or send a proposal', 3, true),
  ('50000000-0000-0000-0000-000000000404', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Log income and review daily numbers', 4, true),
  -- Priya
  ('50000000-0000-0000-0000-000000000501', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'Post 1 Instagram reel or story', 1, true),
  ('50000000-0000-0000-0000-000000000502', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'Send 10 personalised DMs to qualified prospects', 2, true),
  ('50000000-0000-0000-0000-000000000503', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'Conduct minimum 2 discovery calls', 3, true),
  ('50000000-0000-0000-0000-000000000504', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'Log income and review daily numbers', 4, true);

-- ============================================================
-- 7. DAILY LOGS
--
-- Revenue totals:
--   Emma:   income_low($27 ×5=$135) + income_mid($997 ×8=$7976) + income_high($6997 ×1=$6997) = $15,108 ✓
--   James:  income_low($17 ×8=$136) + income_mid($997 ×5=$4985) = $5,121 ✗
--   Sophie: income_low($27 ×2=$54)  + income_mid($997 ×1=$997)  = $1,051 (day 11)
--   Marcus: income_low($27 ×3=$81)  + income_mid($997 ×3=$2991) + income_high($9997 ×1=$9997) = $13,069
--           → pace target at day 46 = $9,200 → ratio = 1.42 → ahead_of_pace
--           Let me adjust: 2 mids + 1 high = $1994 + $9997 = $11,991 → ratio 1.30 → ahead
--           Use: 1 mid + 1 high = $997 + $9997 = $10,994 → ratio 1.19 → ahead_of_pace
--           Use: 1 mid + 1 low = $997 + $27 = $1,024 only → too low
--           Use: 3 mids = $2,991 + some lows → on pace ~$9,200
--           3 × $997 + 3 × $27 = $2,991 + $81 = $3,072 → ratio 0.334 → too low
--           OK use: 1 high ($9,997) + 0 mids = $9,997 → ratio 1.086 → on_pace ✓
--   Priya:  income_mid($997 ×8=$7976) + income_high($9997 ×1=$9997) = $17,973
--           pace at day 76 = $25,000×76/90 = $21,111 → ratio 0.851 → behind_pace ✓
-- ============================================================

-- EMMA — 75 of 90 days logged (dedicated)
-- Sale days: low@5,12,20,30,45 | mid@8,15,22,28,35,42,55,70 | high@65
insert into public.daily_logs
  (client_id, goal_id, log_date, income_low, income_mid, income_high, expenses, posts_count, emails_count)
select
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  ('2025-12-28'::date + (n || ' days')::interval)::date,
  case when n in (5,12,20,30,45) then 27 else 0 end,
  case when n in (8,15,22,28,35,42,55,70) then 997 else 0 end,
  case when n = 65 then 6997 else 0 end,
  case when n % 7 = 6 then 40 else 130 end,
  case when n % 7 < 5 then 3 else 1 end,
  case when n % 7 < 5 then 5 else 2 end
from generate_series(0, 89) n
-- skip ~15 days for realism (missed days)
where n not in (0,3,10,17,24,31,38,46,53,60,67,74,80,86,89);

-- JAMES — only 35 of 90 days logged (inconsistent, dropped off after day 60)
-- Sale days: low@4,10,20,35,50,60,70,80 | mid@8,25,45,62,78
insert into public.daily_logs
  (client_id, goal_id, log_date, income_low, income_mid, income_high, expenses, posts_count, emails_count)
select
  '10000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000002',
  ('2025-12-28'::date + (n || ' days')::interval)::date,
  case when n in (4,10,20,35,50,60,70,80) then 17 else 0 end,
  case when n in (8,25,45,62,78) then 997 else 0 end,
  0,
  case when n < 45 then 200 else 80 end,
  case when n < 30 then 2 when n < 60 then 1 else 0 end,
  case when n < 30 then 3 else 1 end
-- only the days James actually logged
from generate_series(0, 89) n
where n in (2,4,6,8,10,12,15,18,20,22,25,27,30,33,35,38,40,42,45,48,50,52,55,57,60,62,65,67,70,72,75,78,80,83,85);

-- SOPHIE — all 11 days logged (enthusiastic newcomer, starts 2026-03-19)
-- Sale days: low@4,8 | mid@7
insert into public.daily_logs
  (client_id, goal_id, log_date, income_low, income_mid, income_high, expenses, posts_count, emails_count)
select
  '10000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000003',
  ('2026-03-19'::date + (n || ' days')::interval)::date,
  case when n in (4,8) then 27 else 0 end,
  case when n = 7 then 997 else 0 end,
  0,
  50,
  case when n % 7 < 5 then 4 else 2 end,
  case when n % 7 < 5 then 3 else 0 end
from generate_series(0, 10) n;

-- MARCUS — 40 of 46 days logged (consistent, starts 2026-02-12)
-- Sale days: high@30 | mid@5 | low@3,15,40
-- Revenue: $27+$997+$9997 + $27+$27 = $11,075 → pace at day 46 = $9,200 → ratio 1.20 → ahead_of_pace
insert into public.daily_logs
  (client_id, goal_id, log_date, income_low, income_mid, income_high, expenses, posts_count, emails_count)
select
  '10000000-0000-0000-0000-000000000004',
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

-- PRIYA — 65 of 76 days logged (75 days in, starts 2026-01-13)
-- Sale days: mid@10,20,30,42,52,60,68 (7 × $997 = $6,979) | high@55 ($9,997) | low@5,15,25,35,45 ($135)
-- Total: $6,979 + $9,997 + $135 = $17,111 → pace at day 76 = $21,111 → ratio 0.810 → behind_pace ✓
insert into public.daily_logs
  (client_id, goal_id, log_date, income_low, income_mid, income_high, expenses, posts_count, emails_count)
select
  '10000000-0000-0000-0000-000000000005',
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
-- 8. DAILY ACTION COMPLETIONS
-- Using generate_series × fixed action UUIDs
-- Completion rates: Emma 80% | James 35% | Sophie 92% | Marcus 70% | Priya 65%
-- ============================================================

-- EMMA — 80% completion on logged days
insert into public.daily_action_completions (action_id, client_id, log_date, completed)
select
  a.action_id::uuid,
  '10000000-0000-0000-0000-000000000001',
  ('2025-12-28'::date + (n || ' days')::interval)::date,
  (n + a.offset) % 5 != 0  -- skip 1 in 5 per action = ~80%
from generate_series(0, 89) n
cross join (values
  ('50000000-0000-0000-0000-000000000101', 0),
  ('50000000-0000-0000-0000-000000000102', 1),
  ('50000000-0000-0000-0000-000000000103', 2),
  ('50000000-0000-0000-0000-000000000104', 3)
) as a(action_id, offset)
where n not in (0,3,10,17,24,31,38,46,53,60,67,74,80,86,89);

-- JAMES — 35% completion (low effort, dropped off)
insert into public.daily_action_completions (action_id, client_id, log_date, completed)
select
  a.action_id::uuid,
  '10000000-0000-0000-0000-000000000002',
  ('2025-12-28'::date + (n || ' days')::interval)::date,
  case
    when n < 20 then (n + a.offset) % 3 = 0   -- 33% in first 20 days
    when n < 50 then (n + a.offset) % 4 = 0   -- 25% in mid sprint
    else (n + a.offset) % 6 = 0               -- 17% in final stretch
  end
from generate_series(0, 89) n
cross join (values
  ('50000000-0000-0000-0000-000000000201', 0),
  ('50000000-0000-0000-0000-000000000202', 1),
  ('50000000-0000-0000-0000-000000000203', 2),
  ('50000000-0000-0000-0000-000000000204', 3)
) as a(action_id, offset)
where n in (2,4,6,8,10,12,15,18,20,22,25,27,30,33,35,38,40,42,45,48,50,52,55,57,60,62,65,67,70,72,75,78,80,83,85);

-- SOPHIE — 92% completion (motivated, just started)
insert into public.daily_action_completions (action_id, client_id, log_date, completed)
select
  a.action_id::uuid,
  '10000000-0000-0000-0000-000000000003',
  ('2026-03-19'::date + (n || ' days')::interval)::date,
  (n + a.offset) % 12 != 0  -- skip 1 in 12 = ~92%
from generate_series(0, 10) n
cross join (values
  ('50000000-0000-0000-0000-000000000301', 0),
  ('50000000-0000-0000-0000-000000000302', 3),
  ('50000000-0000-0000-0000-000000000303', 6),
  ('50000000-0000-0000-0000-000000000304', 9)
) as a(action_id, offset);

-- MARCUS — 70% completion
insert into public.daily_action_completions (action_id, client_id, log_date, completed)
select
  a.action_id::uuid,
  '10000000-0000-0000-0000-000000000004',
  ('2026-02-12'::date + (n || ' days')::interval)::date,
  (n + a.offset) % 10 < 7  -- 7 in 10 = 70%
from generate_series(0, 45) n
cross join (values
  ('50000000-0000-0000-0000-000000000401', 0),
  ('50000000-0000-0000-0000-000000000402', 2),
  ('50000000-0000-0000-0000-000000000403', 4),
  ('50000000-0000-0000-0000-000000000404', 6)
) as a(action_id, offset)
where n not in (7,14,21,28,44,45);

-- PRIYA — 65% completion (behind, losing momentum)
insert into public.daily_action_completions (action_id, client_id, log_date, completed)
select
  a.action_id::uuid,
  '10000000-0000-0000-0000-000000000005',
  ('2026-01-13'::date + (n || ' days')::interval)::date,
  case
    when n < 30 then (n + a.offset) % 10 < 8   -- 80% early
    when n < 55 then (n + a.offset) % 10 < 6   -- 60% mid
    else (n + a.offset) % 10 < 5               -- 50% late (losing steam)
  end
from generate_series(0, 75) n
cross join (values
  ('50000000-0000-0000-0000-000000000501', 0),
  ('50000000-0000-0000-0000-000000000502', 2),
  ('50000000-0000-0000-0000-000000000503', 4),
  ('50000000-0000-0000-0000-000000000504', 7)
) as a(action_id, offset)
where n not in (0,6,13,20,27,34,41,48,55,74);

-- ============================================================
-- VERIFICATION QUERIES (run after to confirm data)
-- ============================================================
-- select p.full_name, p.email, g.title, g.status,
--        g.revenue_target,
--        coalesce(sum(dl.income_low + dl.income_mid + dl.income_high), 0) as revenue_to_date,
--        count(distinct dl.log_date) as days_logged
-- from public.profiles p
-- join public.goals g on g.client_id = p.id
-- left join public.daily_logs dl on dl.goal_id = g.id
-- where p.email like '%@testclient.com'
-- group by p.full_name, p.email, g.title, g.status, g.revenue_target
-- order by p.full_name;
