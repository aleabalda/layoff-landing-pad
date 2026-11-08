import { useState } from "react";
import { Card, ErrorNote } from "../components/Card";
import { useProfile } from "../ProfileProvider";
import { createPlan } from "./plan";

// Shown on Home and Plan when someone has no plan yet: they skipped it during
// onboarding, building it failed, or their account predates plans.
function BuildPlanCard() {
  const { profile, reload } = useProfile();
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const build = async () => {
    setIsBuilding(true);
    setError(null);
    try {
      await createPlan(
        profile?.job_end_reason ?? null,
        profile?.urgent_need ?? null,
      );
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsBuilding(false);
    }
  };

  return (
    <Card labelledBy="build-plan-heading">
      <h2
        id="build-plan-heading"
        className="font-semibold tracking-tight text-slate-900"
      >
        Your 30-day plan
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Ready when you are. We'll use what you told us during onboarding to lay
        out a few small tasks for each day over four weeks, starting today.
      </p>
      <ErrorNote message={error} />
      <button
        type="button"
        onClick={build}
        disabled={isBuilding}
        className="mt-4 cursor-pointer rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isBuilding ? "Building..." : "Build my plan"}
      </button>
    </Card>
  );
}

export default BuildPlanCard;
