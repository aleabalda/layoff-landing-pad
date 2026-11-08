import { useEffect, useState } from "react";
import FindJobs from "./FindJobs";
import AppHeader from "../../components/AppHeader";
import { Card, ErrorNote } from "../../components/Card";
import { supabase } from "../../supabaseClient";
import AddJobForm from "./AddJobForm";
import JobProgress from "./JobProgress";
import JobTracker from "./JobTracker";
import { JOB_COLUMNS, type JobPosting } from "./jobTypes";

// The Job search tab: postings saved from Indeed, LinkedIn and elsewhere, and
// how each application is going. Laid out like the Crews page: adding and
// progress on the left, the postings across the rest.
function Jobs() {
  const [jobs, setJobs] = useState<JobPosting[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    supabase
      .from("job_applications")
      .select(JOB_COLUMNS)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!isCurrent) return;
        if (error) setError(error.message);
        else setJobs(data as JobPosting[]);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const added = (job: JobPosting) =>
    setJobs((current) => [job, ...(current ?? [])]);
  const changed = (job: JobPosting) =>
    setJobs(
      (current) => current?.map((j) => (j.id === job.id ? job : j)) ?? null,
    );
  const removed = (id: string) =>
    setJobs((current) => current?.filter((j) => j.id !== id) ?? null);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="grid items-start gap-8 px-4 pb-12 sm:px-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="space-y-5 pt-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Job search
            </h1>
            <p className="mt-2 text-slate-600">
              Keep every posting you find in one place, and see how your search
              is going.
            </p>
          </div>
          <AddJobForm onAdded={added} />
          {jobs && jobs.length > 0 && (
            <Card labelledBy="job-progress-heading">
              <h2
                id="job-progress-heading"
                className="font-semibold tracking-tight text-slate-900"
              >
                Your progress
              </h2>
              <div className="mt-4">
                <JobProgress applications={jobs} />
              </div>
            </Card>
          )}
        </aside>

        <div className="min-w-0 lg:pt-4">
          <div className="space-y-6">
            <FindJobs />
            <ErrorNote message={error} />
            {jobs === null && !error ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : (
              jobs && (
                <JobTracker
                  jobs={jobs}
                  onChanged={changed}
                  onRemoved={removed}
                  onError={setError}
                />
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Jobs;
