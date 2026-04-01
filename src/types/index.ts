export type UserRole = "admin" | "client";
export type GoalStatus = "active" | "completed" | "abandoned";
export type TargetType = "critical" | "major";
export type TargetTypeV3 = "major" | "production" | "critical";
export type TargetRecurrence = "none" | "daily" | "weekly" | "biweekly" | "monthly";
export type ProductTier = "low" | "mid" | "high";
export type ProductCurrency = "usd" | "gbp" | "eur" | "cad" | "inr" | "aud";
export type SequenceTrigger = "days_since_start" | "goal_milestone" | "manual";
export type EmailStatus = "pending" | "sent" | "skipped";
export type WhatsAppStatus = "queued" | "sent" | "delivered" | "failed";
export type TrendCondition =
  | "behind_pace"
  | "on_pace"
  | "ahead_of_pace"
  | "no_logs_3_days"
  | "critical_target_missed";
export type KnowledgeCategory = "mindset" | "marketing" | "sales" | "tech" | "strategy";
export type KnowledgeRequestType = "knowledge" | "question";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  whatsapp_opt_in: boolean;
  // social handles
  instagram_handle: string | null;
  facebook_profile: string | null;
  linkedin_profile: string | null;
  youtube_channel: string | null;
  // follower counts (kept for backward compat; now also tracked per-day in daily_logs)
  instagram_followers: number;
  youtube_subscribers: number;
  facebook_friends: number;
  linkedin_connections: number;
  created_at: string;
}

// ── V3: Annual Goal ──────────────────────────────────────────
export interface AnnualGoal {
  id: string;
  client_id: string;
  title: string;
  target_amount: number;
  year: number;
  notes: string | null;
  created_at: string;
}

// ── Goal (90-day sprint) ─────────────────────────────────────
export interface Goal {
  id: string;
  client_id: string;
  // V3 additions
  annual_goal_id: string | null;
  purpose: string | null;
  policies: string[];       // jsonb array of policy strings
  plan_steps: string[];     // jsonb array of plan step strings
  // core
  title: string;
  start_date: string;
  end_date: string;
  revenue_target: number;
  month1_target: number | null;
  month2_target: number | null;
  month3_target: number | null;
  focus_products: ProductTier[];
  status: GoalStatus;
  notes: string | null;
  zoom_link: string | null;
  created_at: string;
}

// ── V3: Project ──────────────────────────────────────────────
export interface Project {
  id: string;
  goal_id: string;
  client_id: string;
  name: string;
  description: string | null;
  estimated_hours: number | null;
  actual_hours: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// ── Product (goal_id now optional — shared across goals) ─────
export interface Product {
  id: string;
  client_id: string;
  goal_id: string | null;
  tier: ProductTier;
  name: string;
  price: number;
  currency: ProductCurrency;
  is_active: boolean;
  created_at: string;
}

// ── Target ───────────────────────────────────────────────────
export interface Target {
  id: string;
  goal_id: string;
  client_id: string;
  // legacy field kept for backward compat
  type: TargetType;
  // V3 fields
  project_id: string | null;
  target_type: TargetTypeV3;
  recurrence: TargetRecurrence;
  title: string;
  description: string | null;
  due_date: string | null;
  is_met: boolean;
  met_at: string | null;
  sort_order: number;
  created_at: string;
}

// ── Daily Log ────────────────────────────────────────────────
export interface DailyLog {
  id: string;
  client_id: string;
  goal_id: string;
  log_date: string;
  // legacy fields (kept for backward compat)
  income_low: number;
  income_mid: number;
  income_high: number;
  // primary income field
  income_total: number;
  money_in_bank: number;
  expenses: number;
  posts_count: number;
  sales_calls_count: number;
  instagram_followers: number;
  youtube_subscribers: number;
  facebook_friends: number;
  linkedin_connections: number;
  emails_count: number;
  notes: string | null;
  created_at: string;
}

// ── Daily Action ─────────────────────────────────────────────
export interface DailyAction {
  id: string;
  goal_id: string;
  client_id: string;
  // V3 additions
  project_id: string | null;
  estimated_minutes: number | null;
  label: string;
  group_name: string | null;
  notes: string | null;
  link_url: string | null;
  target_date: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface DailyActionCompletion {
  id: string;
  action_id: string;
  client_id: string;
  log_date: string;
  completed: boolean;
}

// ── V3: Win ──────────────────────────────────────────────────
export interface Win {
  id: string;
  client_id: string;
  goal_id: string | null;
  win_date: string;
  description: string;
  rating: number; // 1–5
  created_at: string;
}

// ── V3: Project Template ─────────────────────────────────────
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  estimated_hours: number | null;
  created_at: string;
}

export interface ProjectTemplateAction {
  id: string;
  template_id: string;
  label: string;
  group_name: string | null;
  notes: string | null;
  link_url: string | null;
  estimated_minutes: number | null;
  sort_order: number;
  created_at: string;
}

// ── Action Templates (legacy) ────────────────────────────────
export interface ActionTemplate {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface ActionTemplateItem {
  id: string;
  template_id: string;
  group_name: string | null;
  label: string;
  notes: string | null;
  link_url: string | null;
  sort_order: number;
  created_at: string;
}

// ── Email / WhatsApp ──────────────────────────────────────────
export interface EmailSequence {
  id: string;
  name: string;
  description: string | null;
  trigger_type: SequenceTrigger;
  trigger_days: number | null;
  subject: string;
  html_body: string;
  is_active: boolean;
  created_at: string;
}

export interface EmailSequenceAssignment {
  id: string;
  sequence_id: string;
  client_id: string;
  goal_id: string;
  sent_at: string | null;
  status: EmailStatus;
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  recipient_phone: string;
  message_body: string;
  wa_message_id: string | null;
  status: WhatsAppStatus;
  error_detail: string | null;
  sent_at: string | null;
  created_at: string;
}

// ── Trend / Content ──────────────────────────────────────────
export interface TrendStep {
  id: string;
  condition: TrendCondition;
  title: string;
  body: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface KnowledgeResource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: KnowledgeCategory;
  sort_order: number;
  is_published: boolean;
  created_at: string;
}

export interface KnowledgeRequest {
  id: string;
  client_id: string;
  type: KnowledgeRequestType;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
}
