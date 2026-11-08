import type { ReactNode } from "react";
import { Link } from "react-router";
import { ErrorNote } from "../components/Card";
import { labelFor } from "../profileOptions";
import { TextArea, StepHeading } from "./PersonalizeFields";
import {
  ANSWER_LIMITS,
  type PersonalizeAnswers,
  TIME_OPTIONS,
} from "./personalize";

type StepProps = {
  answers: PersonalizeAnswers;
  set: <K extends keyof PersonalizeAnswers>(
    key: K,
    value: PersonalizeAnswers[K],
  ) => void;
};

export function SituationStep({ answers, set }: StepProps) {
  return (
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
  );
}

export function NextStep({ answers, set }: StepProps) {
  return (
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
  );
}

export function AnythingElseStep({ answers, set }: StepProps) {
  return (
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
  );
}

export function ReviewStep({
  week,
  answers,
  set,
  resumeName,
  sendsResume,
  error,
  onEditStep,
}: StepProps & {
  week: number;
  resumeName: string | null;
  sendsResume: boolean;
  error: string | null;
  onEditStep: (step: number) => void;
}) {
  return (
    <>
      <StepHeading
        title={`Ready to tailor week ${week}?`}
        subtitle="We'll update this week's tasks. Anything you've already done stays as it is, and you can tailor each new week as it opens."
      />

      <dl className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
        <ReviewRow label="Your situation" onEdit={() => onEditStep(0)}>
          {answers.situation}
        </ReviewRow>
        <ReviewRow label="Hoping to land" onEdit={() => onEditStep(1)}>
          {answers.goal}
        </ReviewRow>
        <ReviewRow label="Time most days" onEdit={() => onEditStep(1)}>
          {labelFor(TIME_OPTIONS, answers.time)}
        </ReviewRow>
        <ReviewRow label="Making it harder" onEdit={() => onEditStep(2)}>
          {answers.harder}
        </ReviewRow>
        <ReviewRow label="More or less of" onEdit={() => onEditStep(2)}>
          {answers.moreOrLess}
        </ReviewRow>
      </dl>

      <div className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-sm">
        {resumeName ? (
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={answers.useResume}
              onChange={(event) => set("useResume", event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-violet-700"
            />
            <span>
              <span className="font-medium text-slate-900">
                Use my resume ({resumeName})
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
