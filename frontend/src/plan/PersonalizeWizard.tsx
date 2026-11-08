import { type FormEvent, useState } from "react";
import { useProfile } from "../ProfileProvider";
import { type PersonalizeAnswers, personalizePlan } from "./personalize";
import {
  AnythingElseStep,
  NextStep,
  ReviewStep,
  SituationStep,
} from "./PersonalizeSteps";
import {
  DIALOG_HEADING,
  type PersonalizeResult,
  PRIMARY_BUTTON,
  describeResult,
} from "./personalizeShared";

const TEXT_BUTTON =
  "cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300";

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
  onDone: (result: PersonalizeResult) => void;
  onClose: () => void;
}) {
  const { profile } = useProfile();
  const hasResume = !!profile?.resume_name;
  const [answers, setAnswers] = useState<PersonalizeAnswers>(initial);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"questions" | "working" | "done">(
    "questions",
  );
  const [result, setResult] = useState<PersonalizeResult | null>(null);
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
        {step === 0 && <SituationStep answers={answers} set={set} />}
        {step === 1 && <NextStep answers={answers} set={set} />}
        {step === 2 && <AnythingElseStep answers={answers} set={set} />}
        {step === REVIEW_STEP && (
          <ReviewStep
            week={week}
            answers={answers}
            set={set}
            resumeName={profile?.resume_name ?? null}
            sendsResume={sendsResume}
            error={error}
            onEditStep={setStep}
          />
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

export default PersonalizeWizard;
