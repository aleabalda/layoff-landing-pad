import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card, ErrorNote } from "../../components/Card";
import { isSpeechRecognitionSupported } from "../../voice/useSpeechRecognition";
import {
  isSpeechSynthesisSupported,
  useSpeechSynthesis,
} from "../../voice/useSpeechSynthesis";
import {
  type InterviewAnswer,
  type InterviewSession,
  loadSession,
  readSetting,
  saveSetting,
  STYLE_OPTIONS,
} from "./interviewApi";
import QuestionPractice from "./QuestionPractice";
import ResultsView from "./ResultsView";
import Toggle from "./Toggle";

// The first question without an answer. Once a question is behind you, it
// stays behind you, like a real interview. Equal to the number of questions
// when they've all been answered.
function firstOpenQuestion(session: InterviewSession, answers: InterviewAnswer[]) {
  const answered = new Set(answers.map((a) => a.question_id));
  const index = session.questions.findIndex((q) => !answered.has(q.id));
  return index === -1 ? session.questions.length : index;
}

// One mock interview, one question at a time: no skipping ahead and no going
// back. After the last question comes the overall review and rating.
function InterviewRoom({ sessionId }: { sessionId: string }) {
  const speech = useSpeechSynthesis();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
  const [current, setCurrent] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [error, setError] = useState<string | null>(null);

  const [voiceMode, setVoiceMode] = useState(
    () => isSpeechRecognitionSupported && readSetting("voiceMode", false),
  );
  const [readAloud, setReadAloud] = useState(
    () => isSpeechSynthesisSupported && readSetting("readAloud", false),
  );

  useEffect(() => {
    let isCurrent = true;
    loadSession(sessionId)
      .then((found) => {
        if (!isCurrent) return;
        if (!found) {
          setStatus("missing");
          return;
        }
        setSession(found.session);
        setAnswers(found.answers);
        setCurrent(firstOpenQuestion(found.session, found.answers));
        setStatus("ready");
      })
      .catch(
        (err) =>
          isCurrent && setError(err instanceof Error ? err.message : String(err)),
      );
    return () => {
      isCurrent = false;
    };
  }, [sessionId]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg pt-10">
        <ErrorNote message={`We couldn't open this interview: ${error}`} />
      </div>
    );
  }
  if (status === "missing") {
    return (
      <div className="mx-auto max-w-lg pt-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Interview not found</h1>
        <p className="mt-2 text-sm text-slate-600">It may have been deleted.</p>
        <Link
          to="/confidence-room"
          className="mt-4 inline-block text-sm font-medium text-violet-800 underline"
        >
          Back to the Confidence Room
        </Link>
      </div>
    );
  }
  if (!session) {
    return <p className="pt-10 text-center text-sm text-slate-500">Loading...</p>;
  }

  const questions = session.questions;
  const isFinished = current >= questions.length || !!session.completed_at;

  const header = (
    <div className="pt-4 pb-1">
      <Link
        to="/confidence-room"
        className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
      >
        ← Confidence Room
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {session.role}
        <span className="text-slate-500"> at {session.company}</span>
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Mock interview · {STYLE_OPTIONS.find((s) => s.value === session.style)?.label} ·{" "}
        {questions.length} questions
      </p>
    </div>
  );

  if (isFinished) {
    return (
      <div className="space-y-5">
        {header}
        <ResultsView
          session={session}
          answers={answers}
          speech={speech}
          speakResults={voiceMode || readAloud}
          onSummary={(summary, rating) =>
            setSession((s) =>
              s && { ...s, summary, rating, completed_at: new Date().toISOString() },
            )
          }
        />
      </div>
    );
  }

  const question = questions[current];
  const isLast = current === questions.length - 1;

  const changeVoiceMode = (on: boolean) => {
    setVoiceMode(on);
    saveSetting("voiceMode", on);
    if (!on) speech.stop();
  };
  const changeReadAloud = (on: boolean) => {
    setReadAloud(on);
    saveSetting("readAloud", on);
    if (!on) speech.stop();
  };

  return (
    <div className="space-y-5">
      {header}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="space-y-5 lg:sticky lg:top-4">
          <Card labelledBy="progress-heading">
            <div className="flex items-baseline justify-between gap-3">
              <h2
                id="progress-heading"
                className="text-sm font-semibold tracking-tight text-slate-900"
              >
                Your progress
              </h2>
              <p className="text-sm text-slate-600 tabular-nums">
                {current} of {questions.length} done
              </p>
            </div>
            <ol
              className="mt-3 flex gap-1"
              aria-label={`Question ${current + 1} of ${questions.length}`}
            >
              {questions.map((q, index) => (
                <li
                  key={q.id}
                  className={`h-2 flex-1 rounded-full ${
                    index < current
                      ? "bg-teal-600"
                      : index === current
                        ? "bg-violet-600"
                        : "bg-slate-200"
                  }`}
                />
              ))}
            </ol>
            <p className="mt-3 text-xs text-slate-500">
              Like a real interview, questions come one at a time. Retry the
              current one as often as you like. Once you move on, you can't go
              back. Your overall review comes at the end.
            </p>
          </Card>

          <Card labelledBy="voice-heading">
            <h2 id="voice-heading" className="sr-only">
              Voice settings
            </h2>
            <div className="space-y-4">
              <Toggle
                id="voice-mode"
                label="🎙️ Voice mode"
                hint={
                  isSpeechRecognitionSupported
                    ? "Questions are read aloud, then the mic opens for your answer."
                    : "Needs Chrome, Edge or Safari."
                }
                checked={voiceMode}
                disabled={!isSpeechRecognitionSupported}
                onChange={changeVoiceMode}
              />
              <Toggle
                id="read-aloud"
                label="🔊 Read aloud"
                hint={
                  isSpeechSynthesisSupported
                    ? voiceMode
                      ? "On in voice mode."
                      : "Hear each question and the feedback."
                    : "Your browser can't read text aloud."
                }
                checked={readAloud || voiceMode}
                disabled={!isSpeechSynthesisSupported || voiceMode}
                onChange={changeReadAloud}
              />
            </div>
          </Card>
        </div>

        <QuestionPractice
          key={question.id}
          sessionId={session.id}
          question={question}
          number={current + 1}
          total={questions.length}
          attempts={answers.filter((a) => a.question_id === question.id)}
          voiceMode={voiceMode}
          readAloud={readAloud}
          speech={speech}
          onAnswered={(answer) => setAnswers((list) => [...list, answer])}
          onNext={() => {
            speech.stop();
            setCurrent(current + 1);
          }}
          nextLabel={isLast ? "Finish interview" : "Next question"}
          isLast={isLast}
        />
      </div>
    </div>
  );
}

export default InterviewRoom;
