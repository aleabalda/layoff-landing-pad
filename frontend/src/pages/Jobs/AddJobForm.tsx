import { type FormEvent, useState } from "react";
import { Card, ErrorNote } from "../../components/Card";
import { localDate } from "../../dates";
import { supabase } from "../../supabaseClient";
import {
  JOB_COLUMNS,
  JOB_NOTES_MAX,
  JOB_TEXT_MAX,
  type JobPosting,
  SOURCE_LABELS,
  detectSource,
  normalizeUrl,
} from "./jobTypes";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none";

// Paste a posting from Indeed, LinkedIn or anywhere else. The details are
// typed in: those sites don't allow other apps to read their pages.
function AddJobForm({ onAdded }: { onAdded: (job: JobPosting) => void }) {
  const [url, setUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [hasApplied, setHasApplied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedUrl = normalizeUrl(url);
  const urlProblem =
    url.trim() && !normalizedUrl ? "That doesn't look like a link." : null;
  const source = normalizedUrl ? detectSource(normalizedUrl) : null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!jobTitle.trim() || !company.trim() || urlProblem) return;

    setIsSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from("job_applications")
      .insert({
        job_title: jobTitle.trim(),
        company: company.trim(),
        location: location.trim() || null,
        notes: notes.trim() || null,
        posting_url: normalizedUrl,
        source: source ?? "other",
        status: hasApplied ? "applied" : "saved",
        applied_on: hasApplied ? localDate() : null,
      })
      .select(JOB_COLUMNS)
      .single();
    setIsSaving(false);

    if (error) {
      setError(error.message);
      return;
    }
    onAdded(data as JobPosting);
    setUrl("");
    setJobTitle("");
    setCompany("");
    setLocation("");
    setNotes("");
    setHasApplied(false);
  };

  return (
    <Card labelledBy="add-job-heading">
      <h2
        id="add-job-heading"
        className="font-semibold tracking-tight text-slate-900"
      >
        Add a job posting
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Paste the link from Indeed, LinkedIn or a company site, then fill in the
        details.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="job-url"
            className="text-xs font-medium text-slate-700"
          >
            Link to the posting (optional)
          </label>
          <input
            id="job-url"
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.linkedin.com/jobs/view/…"
            aria-invalid={!!urlProblem}
            aria-describedby="job-url-hint"
            className={`${inputClasses} aria-invalid:border-red-400`}
          />
          <p id="job-url-hint" className="mt-1 text-xs text-slate-500">
            {urlProblem ? (
              <span className="text-red-700">{urlProblem}</span>
            ) : source ? (
              <>From {SOURCE_LABELS[source]}</>
            ) : (
              "We'll keep the link handy so you can find the posting again."
            )}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div>
            <label
              htmlFor="job-title"
              className="text-xs font-medium text-slate-700"
            >
              Job title
            </label>
            <input
              id="job-title"
              type="text"
              value={jobTitle}
              maxLength={JOB_TEXT_MAX}
              required
              onChange={(e) => setJobTitle(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label
              htmlFor="job-company"
              className="text-xs font-medium text-slate-700"
            >
              Company
            </label>
            <input
              id="job-company"
              type="text"
              value={company}
              maxLength={JOB_TEXT_MAX}
              required
              onChange={(e) => setCompany(e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="job-location"
            className="text-xs font-medium text-slate-700"
          >
            Location (optional)
          </label>
          <input
            id="job-location"
            type="text"
            value={location}
            maxLength={JOB_TEXT_MAX}
            placeholder="e.g. Calgary, or Remote"
            onChange={(e) => setLocation(e.target.value)}
            className={inputClasses}
          />
        </div>

        <div>
          <label
            htmlFor="job-notes"
            className="text-xs font-medium text-slate-700"
          >
            Notes (optional)
          </label>
          <textarea
            id="job-notes"
            rows={2}
            value={notes}
            maxLength={JOB_NOTES_MAX}
            placeholder="Salary, contact name, why it caught your eye"
            onChange={(e) => setNotes(e.target.value)}
            className={inputClasses}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={hasApplied}
            onChange={(e) => setHasApplied(e.target.checked)}
            className="size-4 accent-teal-700"
          />
          I've already applied
        </label>

        <ErrorNote message={error} />

        <button
          type="submit"
          disabled={
            isSaving || !jobTitle.trim() || !company.trim() || !!urlProblem
          }
          className="w-full cursor-pointer rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSaving
            ? "Saving..."
            : hasApplied
              ? "Add application"
              : "Save posting"}
        </button>
      </form>
    </Card>
  );
}

export default AddJobForm;
