import { type FormEvent, useEffect, useState } from "react";
import { Card, ErrorNote } from "../../components/Card";
import { formatDate, localDate } from "../../dates";
import { JOB_STATUSES } from "../../profileOptions";
import { supabase } from "../../supabaseClient";
import JobProgress from "./JobProgress";

type Application = {
  id: string;
  company: string;
  job_title: string;
  status: string;
  applied_on: string;
};

const COLUMNS = "id, company, job_title, status, applied_on";

const STATUS_STYLES: Record<string, string> = {
  applied: "bg-slate-100 text-slate-700",
  interviewing: "bg-amber-100 text-amber-900",
  offer: "bg-teal-100 text-teal-900",
  rejected: "bg-slate-100 text-slate-500",
};

function JobTracker() {
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    supabase
      .from("job_applications")
      .select(COLUMNS)
      .order("applied_on", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!isCurrent) return;
        if (error) setError(error.message);
        else setApplications(data);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (!company.trim() || !jobTitle.trim()) return;

    setIsSaving(true);
    setError(null);

    const { data, error } = await supabase
      .from("job_applications")
      .insert({
        company: company.trim(),
        job_title: jobTitle.trim(),
        applied_on: localDate(),
      })
      .select(COLUMNS)
      .single();

    setIsSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setApplications((current) => [data, ...(current ?? [])]);
    setCompany("");
    setJobTitle("");
    setIsAdding(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const previous = applications;
    setApplications(
      (current) =>
        current?.map((app) => (app.id === id ? { ...app, status } : app)) ??
        null,
    );

    const { error } = await supabase
      .from("job_applications")
      .update({ status })
      .eq("id", id);

    if (error) {
      setError(error.message);
      setApplications(previous);
    }
  };

  const remove = async (id: string) => {
    const previous = applications;
    setApplications(
      (current) => current?.filter((app) => app.id !== id) ?? null,
    );

    const { error } = await supabase
      .from("job_applications")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      setApplications(previous);
    }
  };

  return (
    <Card labelledBy="job-tracker-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3
            id="job-tracker-heading"
            className="font-semibold tracking-tight text-slate-900"
          >
            Job search
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Keep track of where you've applied and how it's going.
          </p>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="shrink-0 cursor-pointer rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Add
          </button>
        )}
      </div>

      <ErrorNote message={error} />

      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              aria-label="Company"
              placeholder="Company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              maxLength={120}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
            />
            <input
              aria-label="Job title"
              placeholder="Job title"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              maxLength={120}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="cursor-pointer rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-300"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      {applications === null && !error && (
        <p className="mt-4 text-sm text-slate-500">Loading...</p>
      )}

      {applications && (
        <>
          {applications.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">
              No applications yet. When you're ready, add the first one here.
            </p>
          ) : (
            <div className="mt-5 grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
              <ul
                aria-label="Your applications"
                tabIndex={0}
                className="max-h-[26rem] divide-y divide-slate-100 overflow-y-auto overscroll-contain pr-2 focus-visible:outline-2 focus-visible:outline-teal-600 md:-mt-3"
              >
                {applications.map((app) => (
                  <li
                    key={app.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {app.job_title}
                      </p>
                      <p className="truncate text-sm text-slate-600">
                        {app.company} · {formatDate(app.applied_on)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        aria-label={`Status for ${app.job_title} at ${app.company}`}
                        value={app.status}
                        onChange={(event) =>
                          updateStatus(app.id, event.target.value)
                        }
                        className={`cursor-pointer rounded-full border-0 px-3 py-1 text-xs font-medium ${
                          STATUS_STYLES[app.status] ?? ""
                        }`}
                      >
                        {JOB_STATUSES.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => remove(app.id)}
                        aria-label={`Remove ${app.job_title} at ${app.company}`}
                        className="cursor-pointer rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <JobProgress applications={applications} />
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default JobTracker;
