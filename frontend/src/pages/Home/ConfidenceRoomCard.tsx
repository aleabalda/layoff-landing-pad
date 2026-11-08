import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  RATING_LABELS,
  type SessionSummary,
  listSessions,
} from "../ConfidenceRoom/interviewApi";

// Beside the 30-day plan on Today: a nudge to practise interviewing in the
// Confidence Room, with the last session if there is one.
function ConfidenceRoomCard({ className = "" }: { className?: string }) {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);

  useEffect(() => {
    let isCurrent = true;
    listSessions()
      .then((found) => isCurrent && setSessions(found))
      // The card still works without history.
      .catch(() => isCurrent && setSessions([]));
    return () => {
      isCurrent = false;
    };
  }, []);

  const last = sessions?.[0];
  const completed = sessions?.filter((s) => s.completed_at).length ?? 0;

  return (
    <section
      aria-labelledby="confidence-card-heading"
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-amber-50 p-6 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-xl bg-teal-700 text-lg text-white shadow-sm"
        >
          🎤
        </span>
        <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">
          Confidence Room
        </p>
      </div>

      <h2
        id="confidence-card-heading"
        className="mt-4 text-xl font-semibold tracking-tight text-slate-900"
      >
        Feel ready? Practise here!
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Run a mock interview for a real job and get kind, specific feedback on
        every answer. Nobody else sees it.
      </p>

      {last && (
        <p className="mt-4 rounded-xl bg-white/80 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
          <span className="font-medium text-slate-900">Last practice:</span>{" "}
          {last.role} at {last.company}
          {last.rating && RATING_LABELS[last.rating] && (
            <> · {RATING_LABELS[last.rating]}</>
          )}
          {completed > 1 && (
            <span className="block text-xs text-slate-500">
              {completed} interviews practised so far
            </span>
          )}
        </p>
      )}

      <div className="mt-auto pt-5">
        <Link
          to="/confidence-room"
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-800"
        >
          {last ? "Practise again" : "Start practising"}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}

export default ConfidenceRoomCard;
