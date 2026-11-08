// The values must match the checks in
// supabase/migrations/20261107235900_onboarding_profile.sql.

export type Option = { value: string; label: string };

export const JOB_END_REASONS: Option[] = [
  { value: "laid_off", label: "I was laid off" },
  { value: "let_go", label: "I was let go" },
  { value: "quit", label: "I quit" },
  { value: "complicated", label: "It's complicated" },
];

export const INITIAL_FEELINGS: Option[] = [
  { value: "overwhelmed", label: "Overwhelmed" },
  { value: "sad", label: "Sad" },
  { value: "anxious", label: "Anxious" },
  { value: "confused", label: "Confused" },
  { value: "okay", label: "Okay" },
  { value: "hopeful", label: "Hopeful" },
];

export const URGENT_NEEDS: Option[] = [
  { value: "money", label: "Sorting out money" },
  { value: "next_job", label: "Finding my next job" },
  { value: "mental_health", label: "Looking after my mental health" },
  { value: "figuring_out", label: "Figuring out what's next" },
];

// Crews are matched on field, so it's a fixed list rather than free text.
export const FIELDS: Option[] = [
  { value: "tech", label: "Tech & software" },
  { value: "design", label: "Design & creative" },
  { value: "marketing", label: "Marketing & communications" },
  { value: "sales", label: "Sales & business development" },
  { value: "finance", label: "Finance & accounting" },
  { value: "hr", label: "HR & recruiting" },
  { value: "operations", label: "Operations & logistics" },
  { value: "support", label: "Customer support" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "public_nonprofit", label: "Government & nonprofit" },
  { value: "trades", label: "Trades & manufacturing" },
  { value: "retail_hospitality", label: "Retail & hospitality" },
  { value: "other", label: "Something else" },
];

export const EXPERIENCE_LEVELS: Option[] = [
  { value: "entry", label: "Early career (0–2 years)" },
  { value: "mid", label: "Mid-level (3–7 years)" },
  { value: "senior", label: "Senior (8+ years)" },
  { value: "leadership", label: "Manager or leadership" },
];

export const TAG_GROUPS: { heading: string; tags: Option[] }[] = [
  {
    heading: "Where you're at",
    tags: [
      { value: "first_layoff", label: "First time this has happened" },
      { value: "early_career", label: "New grad or early career" },
      { value: "career_change", label: "Thinking about a career change" },
      { value: "returning", label: "Coming back after a break" },
    ],
  },
  {
    heading: "What you're looking for",
    tags: [
      { value: "remote", label: "Remote work" },
      { value: "relocating", label: "Open to moving" },
      { value: "freelance", label: "Freelance or contract" },
      { value: "own_business", label: "Starting my own thing" },
      { value: "back_to_school", label: "Going back to school" },
    ],
  },
  {
    heading: "Life right now",
    tags: [
      { value: "parent_caregiver", label: "Parent or caregiver" },
      { value: "newcomer", label: "Newcomer or on a work permit" },
      { value: "health", label: "Managing my health" },
    ],
  },
  {
    heading: "What would help from a crew",
    tags: [
      { value: "accountability", label: "Accountability" },
      { value: "interview_practice", label: "Interview practice" },
      { value: "resume_help", label: "Resume feedback" },
      { value: "networking", label: "Networking" },
      { value: "someone_to_talk_to", label: "Someone to talk to" },
    ],
  },
];

export const ALL_TAGS: Option[] = TAG_GROUPS.flatMap((group) => group.tags);

export const JOB_STATUSES: Option[] = [
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Not this time" },
];

export const BIO_MAX_LENGTH = 500;

export function labelFor(options: Option[], value: string | null | undefined) {
  return options.find((option) => option.value === value)?.label ?? null;
}
