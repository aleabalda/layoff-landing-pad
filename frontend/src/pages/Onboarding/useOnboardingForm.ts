import { useAuth0 } from "@auth0/auth0-react";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { createPlan } from "../../plan/plan";
import { useProfile } from "../../ProfileProvider";
import {
  type LinkKind,
  type Links,
  NO_LINKS,
  saveLinks,
  uploadResume,
  validateLinks,
} from "../../resume";
import { supabase } from "../../supabaseClient";

// Finishing the tags step saves the answers. The steps after it are optional:
// the resume and links step saves whatever was filled in, and skipping the plan
// leaves a "Build my plan" button on Home and Plan.
export const TAGS_STEP = 3;
export const LINKS_STEP = 4;
export const PLAN_STEP = 5;

export type Answers = {
  displayName: string;
  city: string;
  jobEndReason: string | null;
  initialFeeling: string | null;
  urgentNeed: string | null;
  field: string | null;
  experienceLevel: string | null;
  tags: string[];
};

export type SetAnswer = <K extends keyof Answers>(
  key: K,
  value: Answers[K],
) => void;

type Busy = "saving" | "building" | "finishing" | null;

// The onboarding answers, which step they're on, and saving it all.
function useOnboardingForm() {
  const { user } = useAuth0();
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

  const goBack = () => {
    setError(null);
    setStep(step - 1);
  };

  return {
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
  };
}

export default useOnboardingForm;
