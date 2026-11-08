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
    <section aria-labelledby="find-jobs-heading" className="min-w-0">
      <h2
        id="find-jobs-heading"
        className="text-lg font-semibold tracking-tight text-slate-900"
      >
        Search the job sites
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Type your search once and open it on each site. Their listings open in a
        new tab.
      </p>

      <div className="mt-4 grid items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
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

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {SITES.map((site) => (
          <li
            key={site.name}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="font-medium text-slate-900">{site.name}</p>
            <p className="mt-0.5 text-sm text-slate-600">{site.description}</p>
            <a
              href={site.url(search)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 self-start rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
            >
              Search {site.name} ↗
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
        <p className="text-sm text-slate-600">
          Found one you like? Copy its link and add it here to keep track.
        </p>
        <button
          type="button"
          onClick={focusAddForm}
          className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Add a posting
        </button>
      </div>
    </section>
  );
}

export default FindJobs;
