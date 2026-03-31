# Action Income Machine — 90-Day Sales Coaching App

## Commands
- `npm run dev` — local dev server (port 3000)
- `npm run build` — production build
- `npm run lint` — ESLint check

## Stack
- **Next.js 14 App Router** + TypeScript (strict) + Tailwind CSS
- **Supabase** — PostgreSQL database + Auth + Row Level Security (RLS)
- **Resend** — transactional email
- **Meta WhatsApp Business API** (v19.0) — outbound coaching messages
- **Recharts** — progress charts
- **Vercel** — hosting + cron jobs

## Architecture

### Route Groups
| Group | Path | Who |
|-------|------|-----|
| `(auth)` | /login, /register, /forgot-password, /reset-password | Public |
| `(client)` | /dashboard, /goals, /progress, /log-history, /resources, /settings | Clients |
| `(admin)` | /admin/clients, /admin/content/*, /admin/emails, /admin/messages | Admin only |
| `api/` | All API routes | Server-side |

### Middleware (`middleware.ts`)
- Protects all routes — unauthenticated → /login
- `/admin/*` — non-admins redirected to /dashboard
- Public: /login, /register, /forgot-password, /reset-password, /api/auth/*, /api/whatsapp/webhook

## Database (Supabase — 12 tables)
| Table | Purpose |
|-------|---------|
| `profiles` | Extends auth.users; role (admin/client), social handles |
| `goals` | 90-day revenue sprint per client; monthly targets, product focus |
| `products` | 3-tier pricing (low/mid/high) per goal |
| `targets` | Critical & major milestones within a goal |
| `daily_logs` | One row per client per day; income, expenses, bank balance, social activity |
| `daily_actions` | Admin-defined checklist items per goal |
| `daily_action_completions` | Which actions completed on which dates |
| `email_sequences` | Email templates with trigger logic |
| `email_sequence_assignments` | Which sequences apply to which client+goal |
| `whatsapp_messages` | Log of all outbound WhatsApp messages |
| `trend_steps` | Action steps per trend condition (5 conditions) |
| `knowledge_resources` | Admin-curated learning links by category |

**RLS:** Clients see only their own rows. Admins bypass all policies via `is_admin()` helper.

**Never use the anon key for admin writes** — use `createAdminClient()` from `src/lib/supabase/server.ts` (uses service role key).

## Key Files
| File | Purpose |
|------|---------|
| `src/lib/goal-calculations.ts` | ALL business logic — trend conditions, pace, progress %, chart data |
| `src/lib/supabase/server.ts` | `createClient()` (anon) + `createAdminClient()` (service role) |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/resend.ts` | `sendEmail()` wrapper with branded HTML header |
| `src/lib/whatsapp.ts` | `sendWhatsAppText()` wrapper |
| `src/lib/email-tokens.ts` | `replaceTokens()` — `{{placeholder}}` substitution in email templates |
| `src/types/index.ts` | All TypeScript interfaces + enums (matches DB schema exactly) |
| `src/app/api/cron/process-sequences/route.ts` | Vercel cron — processes pending email sequences |

## Core Business Logic (goal-calculations.ts)
Always use these functions — never recalculate manually:
- `getDayNumber(goal)` — current day of 90-day sprint
- `getDaysRemaining(goal)` — days left
- `getRevenueTotal(logs)` — sum income across all daily logs
- `getProgressPercent(goal, logs)` — % complete
- `getPaceTarget(goal)` — expected revenue at today's date (linear pace)
- `getTrendCondition(goal, logs)` → one of: `behind_pace | on_pace | ahead_of_pace | no_logs_3_days | critical_target_missed`
- `buildCumulativeSeries(goal, logs)` — chart data with pace overlay

## Design System
**Colors (Tailwind tokens):**
- `orange-brand` (#FFAA00) — primary CTAs, highlights
- `orange-light` (#FFF3CC) — backgrounds, badges
- `green-brand` (#30B33C) — success, on-pace status
- `green-light` (#D4F0D6) — success backgrounds
- `cream` (#FAF7F2) — main background
- `charcoal` (#1F1F1F) — headings
- `warmgray` (#6B6560) — body text

**Fonts:**
- `font-heading` — Fraunces serif (headings only)
- `font-body` — Plus Jakarta Sans (body text)

## Component Patterns
- **Server components by default** — fetch Supabase data directly in async page components
- **`"use client"`** — only for interactive forms (IncomeLogForm, etc.) or browser APIs
- **Reusable UI:** `ProgressRing` (SVG circle), `StatCard` (metric card), sidebar layouts
- **Charts:** Recharts — see `src/components/progress/` for existing chart patterns

## Email Token Syntax
Email templates use `{{placeholder}}` — available tokens:
`{{client_name}}`, `{{goal_title}}`, `{{day_number}}`, `{{days_remaining}}`, `{{revenue_to_date}}`, `{{revenue_target}}`, `{{percent_complete}}`

## Cron Job Security
`/api/cron/process-sequences` is protected by `Authorization: Bearer <CRON_SECRET>`.
Always verify this header before processing.

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY          # Admin-only operations — never expose to browser
RESEND_API_KEY
RESEND_FROM_EMAIL
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_VERIFY_TOKEN
CRON_SECRET
```

## What NOT to Do
- Don't use `createClient()` (anon) for admin writes — use `createAdminClient()`
- Don't recalculate trend/pace/progress inline — use `goal-calculations.ts`
- Don't add `"use client"` to data-fetching pages — keep them server components
- Don't bypass RLS with raw SQL unless using `createAdminClient()`
- `daily_logs` uses upsert with `onConflict: "client_id,log_date"` — always upsert, never insert
