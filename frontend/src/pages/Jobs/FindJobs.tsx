import { useState } from "react";
import { useProfile } from "../../ProfileProvider";

// A starting search for each field from onboarding.
const FIELD_KEYWORDS: Record<string, string> = {
  tech: "software",
  design: "designer",
  marketing: "marketing",
  sales: "sales",
  finance: "accountant",
  hr: "human resources",
  operations: "operations",
  support: "customer service",
  healthcare: "healthcare",
  education: "teacher",
  public_nonprofit: "nonprofit",
  trades: "trades",
  retail_hospitality: "retail",
};

type Search = { what: string; where: string; remote: boolean };

// Each site's own search page, filled in with what the person typed. No keys
// or accounts needed: the listings open on the site itself.
const SITES: {
  name: string;
  description: string;
  url: (search: Search) => string;
}[] = [
  {
    name: "Indeed",
    description: "The biggest job board in Canada.",
    url: ({ what, where, remote }) =>
      `https://ca.indeed.com/jobs?${new URLSearchParams({
        q: remote ? `${what} remote`.trim() : what,
        l: where,
      })}`,
  },
  {
    name: "LinkedIn",
    description: "Good for office jobs, and seeing who you know there.",
    url: ({ what, where, remote }) =>
      `https://www.linkedin.com/jobs/search/?${new URLSearchParams({
        keywords: what,
        location: where,
        // LinkedIn's own "remote" filter.
        ...(remote ? { f_WT: "2" } : {}),
      })}`,
  },
  {
    name: "Job Bank",
    description: "The Government of Canada's free job board.",
    url: ({ what, where, remote }) =>
      `https://www.jobbank.gc.ca/jobsearch/jobsearch?${new URLSearchParams({
        searchstring: remote ? `${what} remote`.trim() : what,
        locationstring: where,
      })}`,
  },
  {
    name: "Google Jobs",
    description: "Pulls listings from many sites at once.",
    url: ({ what, where, remote }) =>
      `https://www.google.com/search?${new URLSearchParams({
        q: [what, remote && "remote", "jobs", where && `in ${where}`]
          .filter(Boolean)
          .join(" "),
        ibp: "htl;jobs",
      })}`,
  },
];

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none";

// Type a search once, then open it on the big job sites. Postings found there
// can be pasted into "Add a job posting" to track them.
function FindJobs() {
  const { profile } = useProfile();
  const [what, setWhat] = useState(
    () => FIELD_KEYWORDS[profile?.field ?? ""] ?? "",
  );
  const [where, setWhere] = useState(() => profile?.city ?? "");
  const [remote, setRemote] = useState(false);
  const search = { what: what.trim(), where: where.trim(), remote };

  const focusAddForm = () => {
    const input = document.getElementById("job-url");
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus({ preventScroll: true });
  };

  return (
    <section
      aria-labelledby="find-jobs-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="find-jobs-heading"
          className="font-semibold tracking-tight text-slate-900"
        >
          Search job sites
        </h2>
        <p className="text-xs text-slate-500">
          Opens each site's own listings in a new tab.
        </p>
      </div>

      <div className="mt-3 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div>
          <label
            htmlFor="find-what"
            className="text-xs font-medium text-slate-700"
          >
            What
          </label>
          <input
            id="find-what"
            type="search"
            value={what}
            maxLength={100}
            onChange={(e) => setWhat(e.target.value)}
            placeholder="Job title, skill or company"
            className={inputClasses}
          />
        </div>
        <div>
          <label
            htmlFor="find-where"
            className="text-xs font-medium text-slate-700"
          >
            Where
          </label>
          <input
            id="find-where"
            type="search"
            value={where}
            maxLength={100}
            onChange={(e) => setWhere(e.target.value)}
            placeholder="City or province"
            className={inputClasses}
          />
        </div>
        <label className="flex h-[38px] cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={remote}
            onChange={(e) => setRemote(e.target.checked)}
            className="size-4 accent-teal-700"
          />
          Remote only
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium text-slate-500">
          Search on
        </span>
        {SITES.map((site) => (
          <a
            key={site.name}
            href={site.url(search)}
            target="_blank"
            rel="noopener noreferrer"
            title={site.description}
            className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-900 transition-colors hover:border-teal-300 hover:bg-teal-100"
          >
            {site.name}
            <span aria-hidden="true" className="text-teal-700">
              ↗
            </span>
          </a>
        ))}
        <button
          type="button"
          onClick={focusAddForm}
          className="ml-auto cursor-pointer text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
        >
          Found one? Add it →
        </button>
      </div>
    </section>
  );
}

export default FindJobs;
