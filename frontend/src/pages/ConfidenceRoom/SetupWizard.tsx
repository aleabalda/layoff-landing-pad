import { useAuth0 } from "@auth0/auth0-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ErrorNote } from "../../components/Card";
import { ResumePicker } from "../../components/ResumeAndLinksFields";
import { useProfile } from "../../ProfileProvider";
import { uploadResume } from "../../resume";
import {
  createInterview,
  DEFAULT_QUESTION_COUNT,
  type InterviewSetup,
  QUESTION_COUNTS,
  SETUP_LIMITS,
  STYLE_OPTIONS,
} from "./interviewApi";

const STEPS = ["The role", "The posting", "The interview", "Your resume"];
const LAST_STEP = STEPS.length - 1;

const PRIMARY_BUTTON =
  "cursor-pointer rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300";
const TEXT_BUTTON =
  "cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300";
const INPUT =
  "mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-violet-600 focus:outline-none";

// Step by step, like onboarding: the role, the posting, the kind of interview,
// then the resume. Ends by having Gemini write the questions.
function SetupWizard() {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const { profile, reload } = useProfile();
  const hasResume = !!profile?.resume_name;

  const [step, setStep] = useState(0);
  const [setup, setSetup] = useState<InterviewSetup>({
    company: "",
    role: "",
    jobDescription: "",
    style: "mixed",
    questionCount: DEFAULT_QUESTION_COUNT,
    useResume: true,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof InterviewSetup>(key: K, value: InterviewSetup[K]) =>
    setSetup((current) => ({ ...current, [key]: value }));

  const canContinue =
    step !== 0 || (setup.company.trim() !== "" && setup.role.trim() !== "");

  const addResume = async (file: File) => {
    if (!user?.sub) return;
    setIsUploading(true);
    setError(null);
    try {
      await uploadResume(user.sub, file);
      await reload();
      set("useResume", true);
    } catch (err) {
      setError(
        `We couldn't upload your resume: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    setIsUploading(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canContinue || isCreating || isUploading) return;
    setError(null);
    if (step < LAST_STEP) {
      setStep(step + 1);
      return;
    }

    setIsCreating(true);
    try {
      const sessionId = await createInterview({
        ...setup,
        useResume: hasResume && setup.useResume,
      });
      navigate(`/confidence-room/${sessionId}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsCreating(false);
    }
  };

  if (isCreating) {
    return (
      <div className="mx-auto max-w-lg pt-16 text-center" role="status">
        <span
          aria-hidden="true"
          className="mx-auto block size-10 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600 motion-reduce:animate-none"
        />
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">
          Writing your interview questions...
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Your coach is reading the posting
          {hasResume && setup.useResume ? " and your resume" : ""}. This can
          take up to a minute.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg pt-4">
      <Link
        to="/confidence-room"
        className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
      >
        ← Confidence Room
      </Link>

      <ol className="mt-5 mb-6 grid grid-cols-4 gap-2" aria-label="Progress">
        {STEPS.map((label, index) => (
          <li key={label}>
            <div
              className={`h-1.5 rounded-full ${index <= step ? "bg-violet-600" : "bg-slate-200"}`}
            />
            <span
              className={`mt-2 block text-xs ${
                index === step ? "font-medium text-slate-900" : "text-slate-500"
              }`}
              aria-current={index === step ? "step" : undefined}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        {step === 0 && (
          <>
            <StepHeading
              title="What are you interviewing for?"
              subtitle="A real job you've applied to works best, but you can practise for any role."
            />
            <Field label="Company" htmlFor="setup-company">
              <input
                id="setup-company"
                value={setup.company}
                onChange={(event) => set("company", event.target.value)}
                maxLength={SETUP_LIMITS.company}
                placeholder="e.g. ATB Financial"
                autoComplete="organization"
                // oxlint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                required
                className={INPUT}
              />
            </Field>
            <Field label="Job title" htmlFor="setup-role">
              <input
                id="setup-role"
                value={setup.role}
                onChange={(event) => set("role", event.target.value)}
                maxLength={SETUP_LIMITS.role}
                placeholder="e.g. Marketing Coordinator"
                autoComplete="organization-title"
                required
                className={INPUT}
              />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <StepHeading
              title="Paste the job description"
              subtitle="Optional, but it's what makes the questions match the job. Copy the posting straight from the job site."
            />
            <Field label="Job description" htmlFor="setup-description">
              <textarea
                id="setup-description"
                rows={10}
                value={setup.jobDescription}
                onChange={(event) => set("jobDescription", event.target.value)}
                maxLength={SETUP_LIMITS.jobDescription}
                placeholder="Responsibilities, requirements, nice-to-haves..."
                // oxlint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                className={INPUT}
              />
            </Field>
            <p className="mt-1 text-right text-xs text-slate-500">
              {setup.jobDescription.length.toLocaleString()}/
              {SETUP_LIMITS.jobDescription.toLocaleString()}
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <StepHeading
              title="What kind of interview?"
              subtitle="Pick what you'd like to practise. You can always start another session."
            />
            <fieldset className="mt-6">
              <legend className="text-sm font-medium text-slate-900">Questions</legend>
              <div className="mt-2 space-y-2">
                {STYLE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer flex-col rounded-xl border px-3 py-2.5 text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-violet-600 ${
                      setup.style === option.value
                        ? "border-violet-600 bg-violet-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="setup-style"
                      value={option.value}
                      checked={setup.style === option.value}
                      onChange={() => set("style", option.value)}
                      className="sr-only"
                    />
                    <span className="font-medium text-slate-900">{option.label}</span>
                    <span className="text-slate-600">{option.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-6">
              <legend className="text-sm font-medium text-slate-900">
                How many questions?
              </legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {QUESTION_COUNTS.map((count) => (
                  <label
                    key={count}
                    className={`flex cursor-pointer flex-col items-center rounded-xl border px-2 py-2 text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-violet-600 ${
                      setup.questionCount === count
                        ? "border-violet-600 bg-violet-50 text-violet-900"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="setup-count"
                      value={count}
                      checked={setup.questionCount === count}
                      onChange={() => set("questionCount", count)}
                      className="sr-only"
                    />
                    <span className="font-medium">{count}</span>
                    <span className="text-xs text-slate-500">
                      about {Math.round(count * 2.5)} min
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}

        {step === LAST_STEP && (
          <>
            <StepHeading
              title="Your resume"
              subtitle="With your resume, your coach can ask about your real experience, like a real interviewer would."
            />
            <div className="mt-6">
              {hasResume ? (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={setup.useResume}
                    onChange={(event) => set("useResume", event.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-violet-700"
                  />
                  <span>
                    <span className="font-medium text-slate-900">
                      Use my resume ({profile?.resume_name})
                    </span>
                    <span className="block text-slate-600">
                      You can change it on your{" "}
                      <Link to="/profile" className="font-medium text-violet-800 underline">
                        Profile
                      </Link>
                      .
                    </span>
                  </span>
                </label>
              ) : (
                <>
                  <ResumePicker
                    fileName={null}
                    onChoose={addResume}
                  />
                  {isUploading && (
                    <p role="status" className="mt-2 text-sm text-slate-600">
                      Uploading your resume...
                    </p>
                  )}
                  <p className="mt-3 text-sm text-slate-500">
                    No resume handy? You can still go ahead. The questions will
                    be based on the job alone. Your resume is also saved to your
                    Profile.
                  </p>
                </>
              )}
            </div>
            <p className="mt-6 text-xs text-slate-500">
              The job details
              {hasResume && setup.useResume ? " and your resume are" : " are"} sent
              to Google Gemini to write your questions.
            </p>
          </>
        )}

        <ErrorNote message={error} />

        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(step - 1)} className={TEXT_BUTTON}>
              Back
            </button>
          ) : (
            <Link to="/confidence-room" className={TEXT_BUTTON}>
              Cancel
            </Link>
          )}
          <button
            type="submit"
            disabled={!canContinue || isUploading}
            className={PRIMARY_BUTTON}
          >
            {step === LAST_STEP
              ? error
                ? "Try again"
                : "Write my questions"
              : step === 1 && !setup.jobDescription.trim()
                ? "Skip"
                : "Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-900">
        {label}
      </label>
      {children}
    </div>
  );
}

export default SetupWizard;
