import { supabase } from "./supabaseClient";

// Must match supabase/migrations/20261108090000_resume_and_links.sql.
const RESUME_BUCKET = "resumes";
export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const MAX_LINK_LENGTH = 300;

export type LinkKind = "linkedin" | "github" | "website";
export type Links = Record<LinkKind, string>;
export type LinkUrls = Record<LinkKind, string | null>;

export const NO_LINKS: Links = { linkedin: "", github: "", website: "" };

export const LINK_FIELDS: {
  kind: LinkKind;
  label: string;
  placeholder: string;
  autoComplete?: string;
}[] = [
  { kind: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/your-name" },
  { kind: "github", label: "GitHub", placeholder: "github.com/your-name" },
  {
    kind: "website",
    label: "Website or portfolio",
    placeholder: "yourname.com",
    autoComplete: "url",
  },
];

const LINK_ERRORS: Record<LinkKind, string> = {
  linkedin: "That doesn't look like a LinkedIn link, like linkedin.com/in/your-name.",
  github: "That doesn't look like a GitHub profile link, like github.com/your-name.",
  website: "That doesn't look like a web address, like yourname.com.",
};

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Tidies what someone typed into a full link, adding https:// if it's missing.
// Blank is fine, since every link is optional.
export function normalizeLink(
  kind: LinkKind,
  raw: string,
): { url: string | null; error: null } | { url: null; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { url: null, error: null };

  const fail = { url: null, error: LINK_ERRORS[kind] };
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return fail;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return fail;
  const host = url.hostname.toLowerCase();

  if (kind === "linkedin") {
    if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return fail;
    url.protocol = "https:";
  } else if (kind === "github") {
    if (host !== "github.com" && host !== "www.github.com") return fail;
    if (!/^\/[a-z\d-]+/i.test(url.pathname)) return fail;
    url.protocol = "https:";
  } else if (!host.includes(".")) {
    return fail;
  }

  const result = url.toString();
  if (result.length > MAX_LINK_LENGTH) {
    return { url: null, error: "That link is too long." };
  }
  return { url: result, error: null };
}

// Tidies every link. `errors` is empty when they're all fine to save.
export function validateLinks(links: Links) {
  const urls = {} as LinkUrls;
  const errors: Partial<Links> = {};
  for (const { kind } of LINK_FIELDS) {
    const result = normalizeLink(kind, links[kind]);
    urls[kind] = result.url;
    if (result.error) errors[kind] = result.error;
  }
  return { urls, errors };
}

// Saves all three links. Blank ones are cleared.
export async function saveLinks(userId: string, urls: LinkUrls) {
  const { error } = await supabase
    .from("users")
    .update({
      linkedin_url: urls.linkedin,
      github_url: urls.github,
      website_url: urls.website,
    })
    .eq("id", userId);
  if (error) throw error;
}

// Returns a message to show, or null if the file is fine.
export function checkResume(file: File) {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Please choose a PDF.";
  if (file.size > MAX_RESUME_BYTES) {
    return `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_RESUME_BYTES)}.`;
  }
  return null;
}

// Storage doesn't allow the `|` in Auth0 IDs, so folders are the ID in hex.
// Matches public.my_file_folder() in the database.
function fileFolder(userId: string) {
  return Array.from(new TextEncoder().encode(userId), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function resumePath(userId: string) {
  return `${fileFolder(userId)}/resume.pdf`;
}

// Uploads (or replaces) the person's resume, then saves it on their profile.
export async function uploadResume(userId: string, file: File) {
  const { error } = await supabase.storage
    .from(RESUME_BUCKET)
    .upload(resumePath(userId), file, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (error) throw error;

  const saved = await supabase.rpc("set_resume", { new_name: file.name });
  if (saved.error) throw saved.error;
}

// Deletes the file, then clears it from the profile.
export async function removeResume(userId: string) {
  const { error } = await supabase.storage
    .from(RESUME_BUCKET)
    .remove([resumePath(userId)]);
  if (error) throw error;

  const cleared = await supabase.rpc("clear_resume");
  if (cleared.error) throw cleared.error;
}

// A private link to view the resume. It stops working after an hour.
export async function getResumeUrl(path: string) {
  const { data, error } = await supabase.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
