import type { Option } from "../../profileOptions";

// Must match the checks in supabase/migrations/20261108130000_job_search.sql.
export type JobStatus =
  "saved" | "applied" | "interviewing" | "offer" | "rejected";
export type JobSource = "indeed" | "linkedin" | "other";

export type JobPosting = {
  id: string;
  company: string;
  job_title: string;
  status: JobStatus;
  applied_on: string | null;
  posting_url: string | null;
  source: JobSource;
  location: string | null;
  notes: string | null;
  created_at: string;
};

export const JOB_COLUMNS =
  "id, company, job_title, status, applied_on, posting_url, source, location, notes, created_at";

export const JOB_STATUSES: (Option & { value: JobStatus })[] = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Not this time" },
];

export const STATUS_STYLES: Record<JobStatus, string> = {
  saved: "bg-sky-50 text-sky-900",
  applied: "bg-slate-100 text-slate-700",
  interviewing: "bg-amber-100 text-amber-900",
  offer: "bg-teal-100 text-teal-900",
  rejected: "bg-slate-100 text-slate-500",
};

export const SOURCE_LABELS: Record<JobSource, string> = {
  indeed: "Indeed",
  linkedin: "LinkedIn",
  other: "Other site",
};

export const JOB_TEXT_MAX = 120;
export const JOB_NOTES_MAX = 1000;

// Which site a pasted link is from. Only the host name is checked, so
// "indeed.com.evil.example" doesn't count as Indeed.
export function detectSource(url: string): JobSource {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const isSite = (domain: string) =>
      host === domain || host.endsWith(`.${domain}`);
    if (isSite("linkedin.com")) return "linkedin";
    if (/(^|\.)indeed\.[a-z.]+$/.test(host)) return "indeed";
  } catch {
    // Not a full URL yet.
  }
  return "other";
}

// Adds https:// if someone pastes "www.indeed.com/...". Returns null if it
// still isn't a web link.
export function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}
