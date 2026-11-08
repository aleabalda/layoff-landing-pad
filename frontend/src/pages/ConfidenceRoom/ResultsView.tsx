import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, ErrorNote } from "../../components/Card";
import type { useSpeechSynthesis } from "../../voice/useSpeechSynthesis";
import {
  finishInterview,
  type InterviewAnswer,
  type InterviewSession,
  type InterviewSummary,
  practiseAgain,
  QUESTION_TYPE_LABELS,
  RATING_LABELS,
  summaryToSpeech,
} from "./interviewApi";

type Speech = ReturnType<typeof useSpeechSynthesis>;

const PRIMARY_BUTTON =
  "cursor-pointer rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300";
const SECONDARY_BUTTON =
  "inline-flex cursor-pointer items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";

// The end of a mock interview: an overall rating and review of every answer.
// If the review doesn't exist yet, it's written as soon as this opens.
function ResultsView({
  session,
  answers,
  speech,
  speakResults,
  onSummary,
}: {
  session: InterviewSession;
  answers: InterviewAnswer[];
  speech: Speech;
  // Read the results aloud when they arrive (voice mode or read aloud is on).
  speakResults: boolean;
  onSummary: (summary: InterviewSummary, rating: number) => void;
}) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isStartingAgain, setIsStartingAgain] = useState(false);
  const requested = useRef(false);

  const hasSummary = !!session.summary && !!session.rating;

  const generate = async () => {
    setError(null);
    try {
      const { summary, rating } = await finishInterview(session.id);
      onSummary(summary, rating);
      if (speakResults) speech.speak("results", summaryToSpeech(summary, rating));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    // Once, even though React runs effects twice in development.
    if (hasSummary || requested.current) return;
    requested.current = true;
    void generate();
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startAgain = async () => {
    setIsStartingAgain(true);
    setError(null);
    try {
      const sessionId = await practiseAgain(session);
      navigate(`/confidence-room/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsStartingAgain(false);
    }
  };

  if (isStartingAgain) {
    return (
      <Waiting
        title="Writing new questions..."
        detail="Same job, fresh questions. This can take up to a minute."
      />
    );
  }

  if (!hasSummary || !session.summary || !session.rating) {
    return error ? (
      <div className="mx-auto max-w-lg pt-10 text-center">
        <ErrorNote message={error} />
        <button type="button" onClick={generate} className={`mt-4 ${PRIMARY_BUTTON}`}>
          Try again
        </button>
      </div>
    ) : (
      <Waiting
        title="Your coach is reviewing the whole interview..."
        detail="Looking back over every answer to see how it went. This can take up to a minute."
      />
    );
  }

  const summary = session.summary;
  const rating = session.rating;
  const notes = new Map(summary.questions.map((entry) => [entry.id, entry]));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card labelledBy="results-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-sm font-semibold text-violet-800">Interview complete</p>
          {speech.isSupported && (
            <button
              type="button"
              onClick={() =>
                speech.speakingId === "results"
                  ? speech.stop()
                  : speech.speak("results", summaryToSpeech(summary, rating))
              }
              className="cursor-pointer rounded-lg px-2 py-1 text-sm font-medium text-violet-800 hover:bg-violet-50"
            >
              {speech.speakingId === "results" ? "■ Stop" : "🔊 Hear your results"}
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col items-center text-center">
          <p
            className="text-5xl font-semibold tracking-tight text-slate-900 tabular-nums"
            aria-label={`Overall rating: ${rating} out of 5`}
          >
            {rating}
            <span className="text-2xl text-slate-400">/5</span>
          </p>
          <RatingDots rating={rating} size="large" />
          <p className="mt-2 text-lg font-semibold text-violet-900">
            {RATING_LABELS[rating]}
          </p>
          <h1
            id="results-heading"
            className="mt-4 max-w-xl text-xl font-semibold tracking-tight text-balance text-slate-900"
          >
            {summary.headline}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-700">
            {summary.overall}
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <PointList title="What went well" items={summary.strengths} tone="teal" mark="✓" />
          <PointList
            title="What to work on"
            items={summary.areas_to_improve}
            tone="amber"
            mark="→"
          />
        </div>

        {summary.next_steps.length > 0 && (
          <div className="mt-3 rounded-xl bg-violet-50 px-4 py-3">
            <h2 className="text-sm font-semibold text-violet-900">
              Before the real interview
            </h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-violet-900">
              {summary.next_steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        )}
      </Card>

      <Card labelledBy="breakdown-heading">
        <h2
          id="breakdown-heading"
          className="font-semibold tracking-tight text-slate-900"
        >
          Question by question
        </h2>
        <ol className="mt-3 divide-y divide-slate-100">
          {session.questions.map((question, index) => {
            const note = notes.get(question.id);
            const attempts = answers.filter((a) => a.question_id === question.id);
            const final = attempts.at(-1);
            return (
              <li key={question.id} className="py-3">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                    <span className="min-w-0">
                      <span className="block text-xs text-slate-500">
                        Question {index + 1} · {QUESTION_TYPE_LABELS[question.type]}
                        {attempts.length > 1 && ` · ${attempts.length} attempts`}
                      </span>
                      <span className="mt-0.5 block text-sm font-medium text-slate-900">
                        {question.question}
                      </span>
                      {note?.note && (
                        <span className="mt-1 block text-sm text-slate-600">
                          {note.note}
                        </span>
                      )}
                    </span>
                    {note && <RatingDots rating={note.rating} />}
                  </summary>
                  {final && (
                    <div className="mt-3 space-y-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                      <p className="text-xs font-medium text-slate-500">Your final answer</p>
                      <p className="whitespace-pre-line text-slate-700">{final.answer}</p>
                      <p className="text-xs font-medium text-slate-500">Coach feedback</p>
                      <p className="text-slate-700">{final.feedback.overall}</p>
                    </div>
                  )}
                </details>
              </li>
            );
          })}
        </ol>
      </Card>

      <ErrorNote message={error} />

      <div className="flex flex-wrap justify-center gap-2 pb-4">
        <button type="button" onClick={startAgain} className={PRIMARY_BUTTON}>
          Practise this job again
        </button>
        <Link to="/confidence-room" className={SECONDARY_BUTTON}>
          Back to the Confidence Room
        </Link>
      </div>
    </div>
  );
}

function RatingDots({
  rating,
  size = "small",
}: {
  rating: number;
  size?: "small" | "large";
}) {
  const dot = size === "large" ? "size-3" : "size-2";
  return (
    <span
      className={`flex shrink-0 gap-1 ${size === "large" ? "mt-3" : "mt-1"}`}
      role="img"
      aria-label={`${rating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`${dot} rounded-full ${n <= rating ? "bg-violet-600" : "bg-slate-200"}`}
        />
      ))}
    </span>
  );
}

function PointList({
  title,
  items,
  tone,
  mark,
}: {
  title: string;
  items: string[];
  tone: "teal" | "amber";
  mark: string;
}) {
  if (!items.length) return null;
  const colours =
    tone === "teal" ? "bg-teal-50 text-teal-900" : "bg-amber-50 text-amber-900";
  return (
    <section className={`rounded-xl px-4 py-3 ${colours}`}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true">{mark}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Waiting({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="mx-auto max-w-lg pt-16 text-center" role="status">
      <span
        aria-hidden="true"
        className="mx-auto block size-10 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600 motion-reduce:animate-none"
      />
      <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
    </div>
  );
}

export default ResultsView;
