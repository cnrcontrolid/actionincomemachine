/**
 * Replace {{token}} placeholders in an email template.
 *
 * Supported tokens:
 *   {{client_name}}      — recipient's full name
 *   {{goal_title}}       — 90-day goal title
 *   {{day_number}}       — current day number (1–90)
 *   {{days_remaining}}   — days left in the sprint
 *   {{revenue_to_date}}  — formatted revenue total, e.g. "$12,500"
 *   {{revenue_target}}   — formatted goal target, e.g. "$50,000"
 *   {{percent_complete}} — completion percentage, e.g. "25%"
 */
export function replaceTokens(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `{{${key}}}`);
}

export const TOKEN_REFERENCE = [
  { token: "{{client_name}}", description: "Client's full name" },
  { token: "{{goal_title}}", description: "90-day goal title" },
  { token: "{{day_number}}", description: "Current day (1–90)" },
  { token: "{{days_remaining}}", description: "Days left in sprint" },
  { token: "{{revenue_to_date}}", description: "Revenue so far (formatted)" },
  { token: "{{revenue_target}}", description: "Goal revenue target (formatted)" },
  { token: "{{percent_complete}}", description: "% of revenue target achieved" },
];
