import { useAuth0 } from "@auth0/auth0-react";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { createPlan } from "../../plan/plan";
import { buildPlan, PLAN_WEEKS } from "../../plan/planTemplate";
import { useProfile } from "../../ProfileProvider";
import {
  EXPERIENCE_LEVELS,
  FIELDS,
  INITIAL_FEELINGS,
  JOB_END_REASONS,
  labelFor,
  type Option,
  URGENT_NEEDS,
} from "../../profileOptions";
import {
  LinkInputs,
  ResumePicker,
} from "../../components/ResumeAndLinksFields";
import {
  formatBytes,
  type LinkKind,
  type Links,
  NO_LINKS,
  saveLinks,
  uploadResume,
  validateLinks,
} from "../../resume";
import { supabase } from "../../supabaseClient";
import TagPicker, { toggleInList } from "../../components/TagPicker";
import Brand from "../../components/Brand";

const STEPS = [
  "About you",
  "What happened",
  "Your work",
  "Your tags",
  "Resume",
  "Your plan",
];

// Finishing the tags step saves the answers. The steps after it are optional:
// the resume and links step saves whatever was filled in, and skipping the plan
// leaves a "Build my plan" button on Home and Plan.
const TAGS_STEP = 3;
const LINKS_STEP = 4;
const PLAN_STEP = 5;

type Answers = {
  displayName: string;
  city: string;
  jobEndReason: string | null;
  initialFeeling: string | null;
  urgentNeed: string | null;
  field: string | null;
  experienceLevel: string | null;
  tags: string[];
};

type Busy = "saving" | "building" | "finishing" | null;

function Onboarding() {
  const { user, logout } = useAuth0();
  const { reload } = useProfile();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({
    // given_name only comes from social logins. Email sign-ups start blank
    // rather than with the start of their email address.
    displayName: user?.given_name ?? "",
    city: "",
    jobEndReason: null,
    initialFeeling: null,
    urgentNeed: null,
    field: null,
    experienceLevel: null,
    tags: [],
  });
  const [links, setLinks] = useState<Links>(NO_LINKS);
  const [linkErrors, setLinkErrors] = useState<Partial<Links>>({});
  const [resume, setResume] = useState<File | null>(null);
  // So going back and forward doesn't upload the same file twice.
  const [uploadedResume, setUploadedResume] = useState<File | null>(null);

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) =>
    setAnswers((current) => ({ ...current, [key]: value }));

  const toggleTag = (tag: string) =>
    set("tags", toggleInList(answers.tags, tag));

  const stepIsComplete = [
    answers.displayName.trim() !== "",
    !!answers.jobEndReason && !!answers.initialFeeling && !!answers.urgentNeed,
    !!answers.field && !!answers.experienceLevel,
    true, // Tags are optional.
    true, // So are the resume and links.
    true, // And the plan.
  ][step];

  // Saves the answers and marks onboarding done in the database. The app keeps
  // showing this page until finish() reloads the profile.
  const saveAnswers = async () => {
    // Make sure the account row exists before saving into it, in case it was
    // removed after the app loaded.
    const ensured = await supabase.rpc("ensure_user");
    if (ensured.error) return ensured.error.message;

    const { error } = await supabase.rpc("save_profile", {
      new_display_name: answers.displayName,
      new_city: answers.city,
      new_job_end_reason: answers.jobEndReason,
      new_initial_feeling: answers.initialFeeling,
      new_urgent_need: answers.urgentNeed,
      new_field: answers.field,
      new_experience_level: answers.experienceLevel,
      new_tags: answers.tags,
    });
    return error?.message ?? null;
  };

  const setLink = (kind: LinkKind, value: string) => {
    setLinks((current) => ({ ...current, [kind]: value }));
    setLinkErrors((current) => ({ ...current, [kind]: undefined }));
  };

  const hasLinksOrResume =
    !!resume || Object.values(links).some((value) => value.trim() !== "");

  // Saves the links (blank ones are cleared) and uploads the resume if there's
  // a new one. Returns an error message, or null if it all saved.
  const saveLinksAndResume = async () => {
    const { urls, errors } = validateLinks(links);
    setLinkErrors(errors);
    if (Object.keys(errors).length) return "Please check the highlighted links.";
    if (!user?.sub) return "Not signed in";

    try {
      await saveLinks(user.sub, urls);
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }

    // Show the tidied-up links if they come back to this step.
    setLinks({
      linkedin: urls.linkedin ?? "",
      github: urls.github ?? "",
      website: urls.website ?? "",
    });

    if (resume && resume !== uploadedResume) {
      try {
        await uploadResume(user.sub, resume);
        setUploadedResume(resume);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return `Your links are saved, but we couldn't upload your resume: ${message}`;
      }
    }
    return null;
  };

  // Loading the now-onboarded profile is what lets the app leave onboarding.
  const finish = async () => {
    setBusy("finishing");
    setError(null);
    await reload();
    navigate("/home", { replace: true });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stepIsComplete || busy) return;
    setError(null);

    if (step < TAGS_STEP) {
      setStep(step + 1);
      return;
    }

    if (step === TAGS_STEP) {
      setBusy("saving");
      const saveError = await saveAnswers();
      setBusy(null);
      if (saveError) setError(saveError);
      else setStep(LINKS_STEP);
      return;
    }

    if (step === LINKS_STEP) {
      setBusy("saving");
      const saveError = await saveLinksAndResume();
      setBusy(null);
      if (saveError) setError(saveError);
      else setStep(PLAN_STEP);
      return;
    }

    setBusy("building");
    try {
      await createPlan(answers.jobEndReason, answers.urgentNeed);
    } catch (err) {
      setError(
        `We couldn't build your plan: ${err instanceof Error ? err.message : String(err)}. You can try again, or skip for now.`,
      );
      setBusy(null);
      return;
    }
    await finish();
  };

  const submitLabel =
    step < TAGS_STEP
      ? "Continue"
      : step === TAGS_STEP
        ? busy === "saving"
          ? "Saving..."
          : answers.tags.length
            ? "Continue"
            : "Skip tags"
        : step === LINKS_STEP
          ? busy === "saving"
            ? "Saving..."
            : hasLinksOrResume
              ? "Continue"
              : "Skip"
          : busy === "building"
          ? "Building your plan..."
          : "Build my plan";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between text-sm">
          <Brand to={null} />
          <button
            type="button"
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
            className="cursor-pointer font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            Log out
          </button>
        </div>

        <ol className="mb-6 grid grid-cols-6 gap-2" aria-label="Progress">
          {STEPS.map((label, index) => (
            <li key={label}>
              <div
                className={`h-1.5 rounded-full ${
                  index <= step ? "bg-teal-600" : "bg-slate-200"
                }`}
              />
              <span
                className={`mt-2 block text-xs ${
                  index === step
                    ? "font-medium text-slate-900"
                    : "text-slate-500"
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
                title="Welcome. Let's get you set up."
                subtitle="A few questions so we can build your plan and find people going through the same thing. Takes about two minutes."
              />
              <TextField
                id="display-name"
                label="What should we call you?"
                value={answers.displayName}
                onChange={(value) => set("displayName", value)}
                autoComplete="given-name"
                required
              />
              <TextField
                id="city"
                label="Where are you based? (optional)"
                hint="So we can point you to local resources."
                value={answers.city}
                onChange={(value) => set("city", value)}
                autoComplete="address-level2"
                placeholder="e.g. Calgary"
              />
            </>
          )}

          {step === 1 && (
            <>
              <StepHeading
                title="What happened?"
                subtitle="There's no wrong answer. This only shapes your plan."
              />
              <ChoiceGroup
                legend="How did your last job end?"
                options={JOB_END_REASONS}
                value={answers.jobEndReason}
                onChange={(value) => set("jobEndReason", value)}
              />
              <ChoiceGroup
                legend="How are you feeling about it?"
                options={INITIAL_FEELINGS}
                value={answers.initialFeeling}
                onChange={(value) => set("initialFeeling", value)}
                columns={3}
              />
              <ChoiceGroup
                legend="What feels most urgent right now?"
                options={URGENT_NEEDS}
                value={answers.urgentNeed}
                onChange={(value) => set("urgentNeed", value)}
              />
            </>
          )}

          {step === 2 && (
            <>
              <StepHeading
                title="Your work"
                subtitle="We'll put you in a crew with people from the same field."
              />
              <ChoiceGroup
                legend="Which field were you working in?"
                options={FIELDS}
                value={answers.field}
                onChange={(value) => set("field", value)}
              />
              <ChoiceGroup
                legend="How much experience do you have?"
                options={EXPERIENCE_LEVELS}
                value={answers.experienceLevel}
                onChange={(value) => set("experienceLevel", value)}
              />
            </>
          )}

          {step === TAGS_STEP && (
            <>
              <StepHeading
                title="Pick anything that fits"
                subtitle="We use these to match you with people in a similar spot. Choose as many as you like, or skip this."
              />
              <TagPicker selected={answers.tags} onToggle={toggleTag} />
            </>
          )}

          {step === LINKS_STEP && (
            <>
              <StepHeading
                title="Your resume and links"
                subtitle="Add whatever you have handy. It all stays private to you, and you can skip this."
              />

              <div className="mt-6">
                <ResumePicker
                  fileName={resume?.name ?? null}
                  fileDetail={resume ? formatBytes(resume.size) : undefined}
                  onChoose={setResume}
                  onClear={() => setResume(null)}
                />
              </div>
              <LinkInputs links={links} errors={linkErrors} onChange={setLink} />
            </>
          )}

          {step === PLAN_STEP && (
            <PlanStep
              jobEndReason={answers.jobEndReason}
              urgentNeed={answers.urgentNeed}
            />
          )}

          {error && (
            <p
              role="alert"
              className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(step - 1);
                }}
                disabled={!!busy}
                className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                Back
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              {step === PLAN_STEP && (
                <button
                  type="button"
                  onClick={finish}
                  disabled={!!busy}
                  className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  {busy === "finishing" ? "One moment..." : "Skip for now"}
                </button>
              )}
              <button
                type="submit"
                disabled={!stepIsComplete || !!busy}
                className="cursor-pointer rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

// Shows what building a plan means before they commit to it.
function PlanStep({
  jobEndReason,
  urgentNeed,
}: {
  jobEndReason: string | null;
  urgentNeed: string | null;
}) {
  const firstDay = buildPlan(jobEndReason, urgentNeed).filter(
    (task) => task.week === 1 && task.day === 1,
  );
  const shapedBy = [
    labelFor(JOB_END_REASONS, jobEndReason),
    labelFor(URGENT_NEEDS, urgentNeed),
  ].filter(Boolean);

  return (
    <>
      <StepHeading
        title="Want a 30-day plan?"
        subtitle="We'll lay out a few small tasks for each day over four weeks, starting today. Each week opens when it starts, so you won't feel buried."
      />

      {shapedBy.length > 0 && (
        <p className="mt-4 text-sm text-slate-600">
          <span className="font-medium text-slate-800">Shaped around:</span>{" "}
          {shapedBy.join(" · ")}
        </p>
      )}

      <ol className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PLAN_WEEKS.map(({ week, theme }) => (
          <li key={week} className="rounded-xl bg-slate-50 px-3 py-2">
            <span className="block text-xs text-slate-500">Week {week}</span>
            <span className="block text-sm font-medium text-slate-900">
              {theme}
            </span>
          </li>
        ))}
      </ol>

      <h2 className="mt-6 text-sm font-medium text-slate-900">
        Here's what day 1 would look like
      </h2>
      <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
        {firstDay.map((task) => (
          <li key={task.key} className="flex gap-2">
            <span aria-hidden="true" className="text-teal-700">
              ○
            </span>
            {task.title}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-slate-500">
        Not ready? Skip for now. You can build it any time from Home or your
        Plan page.
      </p>
    </>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}

function TextField({
  id,
  label,
  hint,
  value,
  onChange,
  ...inputProps
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="mt-6">
      <label htmlFor={id} className="text-sm font-medium text-slate-900">
        {label}
      </label>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
        {...inputProps}
      />
    </div>
  );
}

function ChoiceGroup({
  legend,
  options,
  value,
  onChange,
  columns = 2,
}: {
  legend: string;
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  columns?: 2 | 3;
}) {
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-medium text-slate-900">{legend}</legend>
      <div
        className={`mt-3 grid gap-2 ${
          columns === 3 ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
        }`}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center rounded-xl border px-3 py-2.5 text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-teal-600 ${
              value === option.value
                ? "border-teal-600 bg-teal-50 text-teal-900"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name={legend}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default Onboarding;
