/**
 * Replace {{token}} placeholders in an email template.
 *
 * Goal tokens:
 *   {{client_name}}      — recipient's full name
 *   {{first_name}}       — recipient's first name
 *   {{last_name}}        — recipient's last name
 *   {{goal_title}}       — 90-day goal title
 *   {{day_number}}       — current day number (1–90)
 *   {{days_remaining}}   — days left in the sprint
 *   {{revenue_to_date}}  — formatted revenue total, e.g. "$12,500"
 *   {{revenue_target}}   — formatted goal target, e.g. "$50,000"
 *   {{percent_complete}} — completion percentage, e.g. "25%"
 *
 * Client profile tokens:
 *   {{phone}}            — client phone number
 *   {{instagram_handle}} — Instagram handle
 *   {{facebook_profile}} — Facebook profile URL
 *   {{linkedin_profile}} — LinkedIn profile URL
 *   {{youtube_channel}}  — YouTube channel URL
 */
export function replaceTokens(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `{{${key}}}`);
}

export const TOKEN_REFERENCE = [
  // Name
  { token: "{{client_name}}", description: "Client's full name" },
  { token: "{{first_name}}", description: "Client's first name" },
  { token: "{{last_name}}", description: "Client's last name" },
  // Goal
  { token: "{{goal_title}}", description: "90-day goal title" },
  { token: "{{day_number}}", description: "Current day (1–90)" },
  { token: "{{days_remaining}}", description: "Days left in sprint" },
  { token: "{{revenue_to_date}}", description: "Revenue so far (formatted)" },
  { token: "{{revenue_target}}", description: "Goal revenue target (formatted)" },
  { token: "{{percent_complete}}", description: "% of revenue target achieved" },
  // Client profile
  { token: "{{phone}}", description: "Client phone number" },
  { token: "{{instagram_handle}}", description: "Instagram handle" },
  { token: "{{facebook_profile}}", description: "Facebook profile URL" },
  { token: "{{linkedin_profile}}", description: "LinkedIn profile URL" },
  { token: "{{youtube_channel}}", description: "YouTube channel URL" },
];
