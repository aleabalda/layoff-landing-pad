import { useAuth0 } from "@auth0/auth0-react";
import Brand from "../../components/Brand";
import {
  AboutYouStep,
  ResumeStep,
  TagsStep,
  WhatHappenedStep,
  YourWorkStep,
} from "./OnboardingSteps";
import PlanStep from "./PlanStep";
import useOnboardingForm, {
  LINKS_STEP,
  PLAN_STEP,
  TAGS_STEP,
} from "./useOnboardingForm";

const STEPS = [
  "About you",
  "What happened",
  "Your work",
  "Your tags",
  "Resume",
  "Your plan",
];

function Onboarding() {
  const { logout } = useAuth0();
  const {
    step,
    busy,
    error,
    answers,
    set,
    links,
    linkErrors,
    setLink,
    resume,
    setResume,
    stepIsComplete,
    submitLabel,
    handleSubmit,
    finish,
    goBack,
  } = useOnboardingForm();

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
          {step === 0 && <AboutYouStep answers={answers} set={set} />}
          {step === 1 && <WhatHappenedStep answers={answers} set={set} />}
          {step === 2 && <YourWorkStep answers={answers} set={set} />}
          {step === TAGS_STEP && <TagsStep answers={answers} set={set} />}
          {step === LINKS_STEP && (
            <ResumeStep
              resume={resume}
              onResumeChange={setResume}
              links={links}
              linkErrors={linkErrors}
              onLinkChange={setLink}
            />
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
                onClick={goBack}
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

export default Onboarding;
