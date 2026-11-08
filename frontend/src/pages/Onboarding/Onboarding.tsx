import { useAuth0 } from "@auth0/auth0-react";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { useProfile } from "../../ProfileProvider";
import {
  EXPERIENCE_LEVELS,
  FIELDS,
  INITIAL_FEELINGS,
  JOB_END_REASONS,
  type Option,
  URGENT_NEEDS,
} from "../../profileOptions";
import { supabase } from "../../supabaseClient";
import TagPicker, { toggleInList } from "../../components/TagPicker";

const STEPS = ["About you", "What happened", "Your work", "Your tags"];

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

function Onboarding() {
  const { user, logout } = useAuth0();
  const { reload } = useProfile();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
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

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) =>
    setAnswers((current) => ({ ...current, [key]: value }));

  const toggleTag = (tag: string) => set("tags", toggleInList(answers.tags, tag));

  const stepIsComplete = [
    answers.displayName.trim() !== "",
    !!answers.jobEndReason && !!answers.initialFeeling && !!answers.urgentNeed,
    !!answers.field && !!answers.experienceLevel,
    true, // Tags are optional.
  ][step];

  const isLastStep = step === STEPS.length - 1;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stepIsComplete) return;

    if (!isLastStep) {
      setStep(step + 1);
      return;
    }

    setIsSaving(true);
    setError(null);

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

    if (error) {
      setError(error.message);
      setIsSaving(false);
      return;
    }

    await reload();
    navigate("/home", { replace: true });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between text-sm">
          <span className="font-semibold tracking-tight text-slate-500">
            Layoff Landing Pad
          </span>
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

        <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Progress">
          {STEPS.map((label, index) => (
            <li key={label}>
              <div
                className={`h-1.5 rounded-full ${
                  index <= step ? "bg-teal-600" : "bg-slate-200"
                }`}
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

          {step === 3 && (
            <>
              <StepHeading
                title="Pick anything that fits"
                subtitle="We use these to match you with people in a similar spot. Choose as many as you like, or skip this."
              />
              <TagPicker selected={answers.tags} onToggle={toggleTag} />
            </>
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
                onClick={() => setStep(step - 1)}
                className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Back
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={!stepIsComplete || isSaving}
              className="cursor-pointer rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving
                ? "Saving..."
                : isLastStep
                  ? answers.tags.length
                    ? "Finish"
                    : "Skip and finish"
                  : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </main>
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
            className={`flex cursor-pointer items-center rounded-xl border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal-600 ${
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
