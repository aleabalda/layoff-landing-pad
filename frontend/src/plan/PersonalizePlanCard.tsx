import { type FormEvent, type ReactNode, useState } from "react";
import { Link } from "react-router";
import { Card, ErrorNote } from "../components/Card";
import Modal from "../components/Modal";
import { labelFor } from "../profileOptions";
import { PLAN_WEEKS } from "./planTemplate";
import { useProfile } from "../ProfileProvider";
import {
  ANSWER_LIMITS,
  EMPTY_ANSWERS,
  type PersonalizeAnswers,
  personalizePlan,
  restoreOriginalPlan,
  TIME_OPTIONS,
  useLatestPersonalization,
} from "./personalize";

type Result = { summary: string; updated: number };

const PRIMARY_BUTTON =
  "cursor-pointer rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300";
const SECONDARY_BUTTON =
  "cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300";
const TEXT_BUTTON =
  "cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300";

const DIALOG_HEADING = "personalize-dialog-heading";

function formatDay(timestamp: string) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function describeResult(result: Result) {
  return result.updated
    ? `Updated ${result.updated} ${result.updated === 1 ? "task" : "tasks"} this week.`
    : "Your tasks already fit well, so nothing needed changing.";
}

// A short card on the Plan page. Personalizing happens in a step-by-step modal,
// one week at a time: later weeks are locked, so each is tailored when it opens.
function PersonalizePlanCard({
  week,
  hasPersonalizedTasks,
}: {
  week: number;
  // Whether any of this week's tasks are tailored.
  hasPersonalizedTasks: boolean;
}) {
  const theme = PLAN_WEEKS[week - 1]?.theme;
  const { latest, isLoading } = useLatestPersonalization();
  const [isOpen, setIsOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restore = async () => {
    setIsRestoring(true);
    setError(null);
    setResult(null);
    try {
      await restoreOriginalPlan();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setIsRestoring(false);
  };

  return (
    <Card labelledBy="personalize-heading">
      <h2
        id="personalize-heading"
        className="font-semibold tracking-tight text-slate-900"
      >
        ✨{" "}
        {hasPersonalizedTasks
          ? `Week ${week} is tailored to you`
          : "Make this week yours"}
      </h2>

      {result ? (
        <div className="mt-2 rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-900">
          <p>{describeResult(result)}</p>
          {result.summary && <p className="mt-1">{result.summary}</p>}
        </div>
      ) : hasPersonalizedTasks && latest ? (
        <p className="mt-1 text-sm text-slate-600">
          Tailored on {formatDay(latest.finished_at)}.
          {latest.summary && ` ${latest.summary}`}
        </p>
      ) : (
        <p className="mt-1 text-sm text-slate-600">
          Answer a few questions and we'll use AI to tailor this week's tasks
          (week {week}: {theme}) to your situation, goals and resume. You can
          tailor each new week as it opens, and go back to the original tasks
          any time.
        </p>
      )}

      <ErrorNote message={error} />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsOpen(true);
          }}
          disabled={isLoading || isRestoring}
          className={PRIMARY_BUTTON}
        >
          {hasPersonalizedTasks
            ? "Update with new details"
            : `Personalize week ${week}`}
        </button>
        {hasPersonalizedTasks && (
          <button
            type="button"
            onClick={restore}
            disabled={isRestoring}
            className={SECONDARY_BUTTON}
          >
            {isRestoring ? "Restoring..." : "Restore original tasks"}
          </button>
        )}
      </div>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        labelledBy={DIALOG_HEADING}
        canClose={!isWorking}
      >
        <PersonalizeWizard
          week={week}
          initial={latest?.answers ?? EMPTY_ANSWERS}
          onWorkingChange={setIsWorking}
          onDone={setResult}
          onClose={() => setIsOpen(false)}
        />
      </Modal>
    </Card>
  );
}

const STEPS = ["Your situation", "What's next", "Anything else", "Review"];
const REVIEW_STEP = STEPS.length - 1;

function PersonalizeWizard({
  week,
  initial,
  onWorkingChange,
  onDone,
  onClose,
}: {
  week: number;
  initial: PersonalizeAnswers;
  onWorkingChange: (isWorking: boolean) => void;
  onDone: (result: Result) => void;
  onClose: () => void;
}) {
  const { profile } = useProfile();
  const hasResume = !!profile?.resume_name;
  const [answers, setAnswers] = useState<PersonalizeAnswers>(initial);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"questions" | "working" | "done">(
    "questions",
  );
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof PersonalizeAnswers>(
    key: K,
    value: PersonalizeAnswers[K],
  ) => setAnswers((current) => ({ ...current, [key]: value }));

  const canContinue = step !== 0 || answers.situation.trim() !== "";
  const sendsResume = hasResume && answers.useResume;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canContinue) return;
    if (step < REVIEW_STEP) {
      setStep(step + 1);
      return;
    }

    setError(null);
    setPhase("working");
    onWorkingChange(true);
    try {
      const outcome = await personalizePlan({
        ...answers,
        useResume: sendsResume,
      });
      setResult(outcome);
      onDone(outcome);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("questions");
    }
    onWorkingChange(false);
  };

  if (phase === "working") {
    return (
      <div
        className="flex flex-col items-center px-6 py-14 text-center"
        role="status"
      >
        <span
          aria-hidden="true"
          className="size-10 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600 motion-reduce:animate-none"
        />
        <h2
          id={DIALOG_HEADING}
          className="mt-5 text-lg font-semibold tracking-tight"
        >
          Tailoring your plan...
        </h2>
        <p className="mt-2 max-w-sm text-sm text-slate-600">
          This can take up to a minute. Please keep this window open.
        </p>
      </div>
    );
  }

  if (phase === "done" && result) {
    return (
      <div className="px-6 py-10 text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-violet-100 text-2xl"
        >
          ✨
        </span>
        <h2
          id={DIALOG_HEADING}
          className="mt-4 text-lg font-semibold tracking-tight"
        >
          Week {week} is ready
        </h2>
        <p className="mt-2 text-sm text-slate-700">{describeResult(result)}</p>
        {result.summary && (
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            {result.summary}
          </p>
        )}
        <p className="mt-4 text-xs text-slate-500">
          Look for "Tailored to you" on your tasks. Change or skip anything that
          doesn't fit.
        </p>
        <button
          type="button"
          onClick={onClose}
          className={`mt-6 ${PRIMARY_BUTTON}`}
        >
          See my plan
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="px-6 pt-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-violet-800">
            ✨ Personalize week {week}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 cursor-pointer rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <ol className="mt-4 grid grid-cols-4 gap-2" aria-label="Progress">
          {STEPS.map((label, index) => (
            <li key={label}>
              <div
                className={`h-1.5 rounded-full ${index <= step ? "bg-violet-600" : "bg-slate-200"}`}
              />
              <span
                className={`mt-1.5 block text-[11px] sm:text-xs ${
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
      </div>

      {/* The questions scroll if the screen is short; header and buttons stay put. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6 pb-6">
        {step === 0 && (
          <>
            <StepHeading
              title="What's going on for you right now?"
              subtitle="This is the only question you need to answer. The more you share, the better we can tailor your tasks."
            />
            <TextArea
              id="personalize-situation"
              label="Your situation"
              hint="For example: how long you were there, what happened, and where things stand."
              placeholder="I was laid off from a marketing role after 6 years. I have 3 months of severance and I'm feeling burnt out."
              value={answers.situation}
              onChange={(value) => set("situation", value)}
              maxLength={ANSWER_LIMITS.situation}
              rows={5}
              autoFocus
            />
          </>
        )}

        {step === 1 && (
          <>
            <StepHeading
              title="What's next for you?"
              subtitle="Both are optional. 'Not sure yet' is a perfectly good answer."
            />
            <TextArea
              id="personalize-goal"
              label="What are you hoping to land next?"
              hint="A role, an industry, or a change of direction."
              placeholder="A product marketing role at a mission-driven company, ideally remote."
              value={answers.goal}
              onChange={(value) => set("goal", value)}
              maxLength={ANSWER_LIMITS.goal}
              rows={3}
              autoFocus
            />
            <fieldset className="mt-5">
              <legend className="text-sm font-medium text-slate-900">
                How much time can you give this most days?
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {TIME_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center justify-center rounded-xl border px-2 py-2.5 text-center text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-violet-600 ${
                      answers.time === option.value
                        ? "border-violet-600 bg-violet-50 text-violet-900"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="personalize-time"
                      value={option.value}
                      checked={answers.time === option.value}
                      onChange={() => set("time", option.value)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}

        {step === 2 && (
          <>
            <StepHeading
              title="Anything else we should know?"
              subtitle="Optional. Skip this if nothing comes to mind."
            />
            <TextArea
              id="personalize-harder"
              label="Is anything making this harder right now?"
              hint="Caregiving, health, money pressure, a work permit deadline, or anything else."
              value={answers.harder}
              onChange={(value) => set("harder", value)}
              maxLength={ANSWER_LIMITS.harder}
              rows={3}
              autoFocus
            />
            <TextArea
              id="personalize-more-less"
              label="Anything you'd like more or less of?"
              placeholder="More networking and interview practice, less time on LinkedIn."
              value={answers.moreOrLess}
              onChange={(value) => set("moreOrLess", value)}
              maxLength={ANSWER_LIMITS.moreOrLess}
              rows={2}
            />
          </>
        )}

        {step === REVIEW_STEP && (
          <>
            <StepHeading
              title={`Ready to tailor week ${week}?`}
              subtitle="We'll update this week's tasks. Anything you've already done stays as it is, and you can tailor each new week as it opens."
            />

            <dl className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
              <ReviewRow label="Your situation" onEdit={() => setStep(0)}>
                {answers.situation}
              </ReviewRow>
              <ReviewRow label="Hoping to land" onEdit={() => setStep(1)}>
                {answers.goal}
              </ReviewRow>
              <ReviewRow label="Time most days" onEdit={() => setStep(1)}>
                {labelFor(TIME_OPTIONS, answers.time)}
              </ReviewRow>
              <ReviewRow label="Making it harder" onEdit={() => setStep(2)}>
                {answers.harder}
              </ReviewRow>
              <ReviewRow label="More or less of" onEdit={() => setStep(2)}>
                {answers.moreOrLess}
              </ReviewRow>
            </dl>

            <div className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-sm">
              {hasResume ? (
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={answers.useResume}
                    onChange={(event) => set("useResume", event.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-violet-700"
                  />
                  <span>
                    <span className="font-medium text-slate-900">
                      Use my resume ({profile?.resume_name})
                    </span>
                    <span className="block text-slate-600">
                      So tasks can mention your actual skills and experience.
                    </span>
                  </span>
                </label>
              ) : (
                <p className="text-slate-600">
                  Tip: add your resume on your{" "}
                  <Link
                    to="/profile"
                    className="font-medium text-teal-800 underline"
                  >
                    Profile
                  </Link>{" "}
                  and we can tailor tasks to your actual skills and experience.
                </p>
              )}
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Your answers{sendsResume ? " and resume are" : " are"} sent to
              Google Gemini to suggest new tasks. AI can get things wrong, so
              change or skip anything that doesn't fit.
            </p>

            <ErrorNote message={error} />
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className={TEXT_BUTTON}
          >
            Back
          </button>
        ) : (
          <button type="button" onClick={onClose} className={TEXT_BUTTON}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!canContinue}
          className={PRIMARY_BUTTON}
        >
          {step === REVIEW_STEP
            ? error
              ? "Try again"
              : `Personalize week ${week}`
            : step > 0 && isStepBlank(step, answers)
              ? "Skip"
              : "Continue"}
        </button>
      </div>
    </form>
  );
}

function isStepBlank(step: number, answers: PersonalizeAnswers) {
  if (step === 1) return !answers.goal.trim() && !answers.time;
  if (step === 2) return !answers.harder.trim() && !answers.moreOrLess.trim();
  return false;
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2
        id={DIALOG_HEADING}
        className="text-xl font-semibold tracking-tight text-slate-900"
      >
        {title}
      </h2>
      <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}

function ReviewRow({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-2.5">
      <div className="min-w-0">
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="mt-0.5 line-clamp-2 wrap-break-word text-slate-800">
          {children || <span className="text-slate-400">Skipped</span>}
        </dd>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${label.toLowerCase()}`}
        className="shrink-0 cursor-pointer text-sm font-medium text-violet-800 underline-offset-4 hover:underline"
      >
        Edit
      </button>
    </div>
  );
}

function TextArea({
  id,
  label,
  hint,
  value,
  onChange,
  maxLength,
  rows,
  placeholder,
  autoFocus,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  rows: number;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="mt-5">
      <label htmlFor={id} className="text-sm font-medium text-slate-900">
        {label}
      </label>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      <textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        // Focus moves here when each step opens, for keyboard and screen reader users.
        // oxlint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-violet-600 focus:outline-none"
      />
      {value.length > maxLength * 0.8 && (
        <p className="mt-1 text-right text-xs text-slate-500">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

export default PersonalizePlanCard;
