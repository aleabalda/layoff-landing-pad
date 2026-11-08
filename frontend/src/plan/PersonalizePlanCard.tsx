import { useState } from "react";
import { Card, ErrorNote } from "../components/Card";
import Modal from "../components/Modal";
import { PLAN_WEEKS } from "./planTemplate";
import {
  EMPTY_ANSWERS,
  restoreOriginalPlan,
  useLatestPersonalization,
} from "./personalize";
import {
  DIALOG_HEADING,
  type PersonalizeResult,
  PRIMARY_BUTTON,
  describeResult,
} from "./personalizeShared";
import PersonalizeWizard from "./PersonalizeWizard";

const SECONDARY_BUTTON =
  "cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300";

function formatDay(timestamp: string) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
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
  const [result, setResult] = useState<PersonalizeResult | null>(null);
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

export default PersonalizePlanCard;
