import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card, ErrorNote } from "../../components/Card";
import { isSpeechRecognitionSupported } from "../../voice/useSpeechRecognition";
import {
  deleteSession,
  listSessions,
  type SessionSummary,
  RATING_LABELS,
  STYLE_OPTIONS,
} from "./interviewApi";

const START_BUTTON =
  "inline-flex cursor-pointer items-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900";

function formatDay(timestamp: string) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function RoomHome() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    listSessions()
      .then((found) => isCurrent && setSessions(found))
      .catch(
        (err) =>
          isCurrent && setError(err instanceof Error ? err.message : String(err)),
      );
    return () => {
      isCurrent = false;
    };
  }, []);

  const remove = async (session: SessionSummary) => {
    const confirmed = window.confirm(
      `Delete your mock interview for ${session.role} at ${session.company}? Your answers and feedback will be deleted too.`,
    );
    if (!confirmed) return;
    setError(null);
    try {
      await deleteSession(session.id);
      setSessions((current) => current?.filter((s) => s.id !== session.id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-5">
      <div className="pt-4 pb-3">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Confidence Room
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          A calm place to practise interviews before the real thing. Tell us
          about the job, and an AI coach will ask the questions you're likely
          to get, then give you kind, specific feedback on every answer.
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <Card labelledBy="start-heading">
          <h2
            id="start-heading"
            className="text-lg font-semibold tracking-tight text-slate-900"
          >
            Start a mock interview
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>✨ Questions matched to the job posting and your resume</li>
            <li>
              🎙️ Answer out loud with voice mode, or type if you prefer
              {!isSpeechRecognitionSupported && (
                <span className="text-slate-500">
                  {" "}
                  (voice needs Chrome, Edge or Safari)
                </span>
              )}
            </li>
            <li>🔊 Hear questions and feedback read aloud</li>
            <li>💬 Feedback on what worked, what to sharpen, and a stronger example</li>
          </ul>
          <Link to="/confidence-room/new" className={`mt-5 ${START_BUTTON}`}>
            Set up an interview
          </Link>
        </Card>

        <Card labelledBy="sessions-heading">
          <h2
            id="sessions-heading"
            className="font-semibold tracking-tight text-slate-900"
          >
            Your practice sessions
          </h2>
          <ErrorNote message={error} />
          {sessions === null && !error && (
            <p className="mt-3 text-sm text-slate-500">Loading...</p>
          )}
          {sessions?.length === 0 && (
            <p className="mt-2 text-sm text-slate-500">
              Nothing yet. Your sessions will show up here so you can come
              back to them.
            </p>
          )}
          {!!sessions?.length && (
            <ul className="mt-3 divide-y divide-slate-100">
              {sessions.map((session) => (
                <li key={session.id} className="flex items-center gap-2 py-2.5">
                  <Link
                    to={`/confidence-room/${session.id}`}
                    className="min-w-0 flex-1 rounded-lg px-1 py-0.5 hover:bg-slate-50"
                  >
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {session.role}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {session.company} · {formatDay(session.created_at)} ·{" "}
                      {STYLE_OPTIONS.find((s) => s.value === session.style)?.label} ·{" "}
                      {session.rating
                        ? `Rated ${session.rating}/5, ${RATING_LABELS[session.rating]}`
                        : `${session.answeredCount}/${session.questions.length} answered`}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(session)}
                    aria-label={`Delete ${session.role} at ${session.company}`}
                    className="shrink-0 cursor-pointer rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export default RoomHome;
