import { useState } from "react";
import { formatDate, localDate } from "../../dates";
import { supabase } from "../../supabaseClient";
import {
  JOB_STATUSES,
  type JobPosting,
  type JobStatus,
  SOURCE_LABELS,
  STATUS_STYLES,
} from "./jobTypes";

// Every saved posting and application, with filters and status changes.
function JobTracker({
  jobs,
  onChanged,
  onRemoved,
  onError,
}: {
  jobs: JobPosting[];
  onChanged: (job: JobPosting) => void;
  onRemoved: (id: string) => void;
  onError: (message: string | null) => void;
}) {
  const [filter, setFilter] = useState<JobStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);

  const query = search.trim().toLowerCase();
  const shown = jobs.filter(
    (job) =>
      (filter === "all" || job.status === filter) &&
      (!query ||
        `${job.job_title} ${job.company} ${job.location ?? ""}`
          .toLowerCase()
          .includes(query)),
  );

  const changeStatus = async (job: JobPosting, status: JobStatus) => {
    // Applying for the first time stamps today; moving back to saved clears it.
    const applied_on =
      status === "saved" ? null : (job.applied_on ?? localDate());
    const updated = { ...job, status, applied_on };
    onChanged(updated);
    onError(null);

    const { error } = await supabase
      .from("job_applications")
      .update({ status, applied_on })
      .eq("id", job.id);
    if (error) {
      onError(error.message);
      onChanged(job);
    }
  };

  const remove = async (id: string) => {
    setConfirming(null);
    onError(null);
    const { error } = await supabase
      .from("job_applications")
      .delete()
      .eq("id", id);
    if (error) onError(error.message);
    else onRemoved(id);
  };

  const filters = [
    { value: "all" as const, label: "All", count: jobs.length },
    ...JOB_STATUSES.map((s) => ({
      ...s,
      count: jobs.filter((job) => job.status === s.value).length,
    })),
  ];

  return (
    <section aria-labelledby="tracker-heading" className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id="tracker-heading"
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          Your postings
        </h2>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, company or place"
          aria-label="Search your postings"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none sm:w-72"
        />
      </div>

      <div
        role="group"
        aria-label="Filter by status"
        className="mt-4 flex flex-wrap gap-2"
      >
        {filters.map(({ value, label, count }) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors ${
              filter === value
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {label} <span className="tabular-nums opacity-70">{count}</span>
          </button>
        ))}
      </div>

      {jobs.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          Nothing here yet. When you find a posting on Indeed or LinkedIn, paste
          the link into "Add a job posting" to keep track of it.
        </p>
      ) : shown.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No postings match that.</p>
      ) : (
        <ul className="mt-4 grid gap-3 xl:grid-cols-2">
          {shown.map((job) => {
            const date =
              job.status === "saved" || !job.applied_on
                ? `Saved ${formatDate(localDate(new Date(job.created_at)))}`
                : `Applied ${formatDate(job.applied_on)}`;
            return (
              <li
                key={job.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {job.job_title}
                    </p>
                    <p className="truncate text-sm text-slate-600">
                      {job.company}
                      {job.location && ` · ${job.location}`}
                    </p>
                  </div>
                  <select
                    aria-label={`Status for ${job.job_title} at ${job.company}`}
                    value={job.status}
                    onChange={(e) =>
                      changeStatus(job, e.target.value as JobStatus)
                    }
                    className={`shrink-0 cursor-pointer rounded-full border-0 px-3 py-1 text-xs font-medium ${STATUS_STYLES[job.status]}`}
                  >
                    {JOB_STATUSES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {job.notes && (
                  <p className="mt-2 line-clamp-2 text-sm whitespace-pre-line text-slate-700">
                    {job.notes}
                  </p>
                )}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3 text-xs text-slate-500">
                  <span>
                    {job.source !== "other" && (
                      <span className="mr-2 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                        {SOURCE_LABELS[job.source]}
                      </span>
                    )}
                    {date}
                  </span>
                  <span className="flex items-center gap-1">
                    {job.posting_url && (
                      <a
                        href={job.posting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg px-2 py-1 font-medium text-teal-800 hover:bg-teal-50"
                      >
                        View posting ↗
                      </a>
                    )}
                    {confirming === job.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          className="cursor-pointer rounded-lg px-2 py-1 font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Keep
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(job.id)}
                          className="cursor-pointer rounded-lg bg-red-50 px-2 py-1 font-medium text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirming(job.id)}
                        aria-label={`Delete ${job.job_title} at ${job.company}`}
                        className="cursor-pointer rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default JobTracker;
