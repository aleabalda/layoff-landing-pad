import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Card, ErrorNote } from "../../components/Card";
import { joinSpeech, useSpeechRecognition } from "../../voice/useSpeechRecognition";
import type { useSpeechSynthesis } from "../../voice/useSpeechSynthesis";
import FeedbackView from "./FeedbackView";
import {
  ANSWER_MAX_LENGTH,
  feedbackToSpeech,
  getFeedback,
  type InterviewAnswer,
  type InterviewQuestion,
  QUESTION_TYPE_LABELS,
} from "./interviewApi";

type Speech = ReturnType<typeof useSpeechSynthesis>;

const PRIMARY_BUTTON =
  "cursor-pointer rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300";
const SECONDARY_BUTTON =
  "cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300";

// One question: answer it by typing or speaking, then see the coach's feedback.
//
// Voice mode works like a real interview: the question is read aloud, the mic
// opens, and pressing "Done" sends the answer. The feedback is read back too.
// Keyed by question in InterviewRoom, so each question starts fresh.
function QuestionPractice({
  sessionId,
  question,
  number,
  total,
  attempts,
  voiceMode,
  readAloud,
  speech,
  onAnswered,
  onNext,
  nextLabel,
  isLast,
}: {
  sessionId: string;
  question: InterviewQuestion;
  number: number;
  total: number;
  // Earlier answers to this question, oldest first.
  attempts: InterviewAnswer[];
  voiceMode: boolean;
  readAloud: boolean;
  speech: Speech;
  onAnswered: (answer: InterviewAnswer) => void;
  onNext: () => void;
  nextLabel: string;
  isLast: boolean;
}) {
  const latest = attempts.at(-1) ?? null;
  const [isRetrying, setIsRetrying] = useState(false);
  const [answer, setAnswer] = useState("");
  // Text typed before the mic was turned on, which speech gets added to.
  const [textBeforeMic, setTextBeforeMic] = useState("");
  const [usedMic, setUsedMic] = useState(false);
  const [submitWhenStopped, setSubmitWhenStopped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speakIfWanted = (id: string, text: string) => {
    if (voiceMode || readAloud) speech.speak(id, text);
  };

  const submit = async (text: string, spoken: boolean) => {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const { answerId, feedback } = await getFeedback({
        sessionId,
        questionId: question.id,
        answer: trimmed,
        spoken,
      });
      onAnswered({
        id: answerId,
        question_id: question.id,
        answer: trimmed,
        spoken,
        feedback,
        created_at: new Date().toISOString(),
      });
      setIsRetrying(false);
      setAnswer("");
      setUsedMic(false);
      speakIfWanted(`feedback-${answerId}`, feedbackToSpeech(feedback));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setIsSubmitting(false);
  };

  const mic = useSpeechRecognition((heard) => {
    const text = joinSpeech(textBeforeMic, heard);
    setAnswer(text);
    if (submitWhenStopped) {
      setSubmitWhenStopped(false);
      void submit(text, true);
    }
  });

  const { start: startMic, isSupported: canListen } = mic;
  const { speak, stop: stopSpeaking } = speech;
  const startListening = useCallback(
    (currentText: string) => {
      stopSpeaking(); // So the mic doesn't hear the coach.
      setTextBeforeMic(currentText);
      setUsedMic(true);
      startMic();
    },
    [stopSpeaking, startMic],
  );

  // When a question opens (or voice mode is switched on), read it aloud. In
  // voice mode the mic opens as soon as it's been read.
  const alreadyAnswered = attempts.length > 0;
  useEffect(() => {
    if (alreadyAnswered) return;
    if (voiceMode) {
      speak(`question-${question.id}`, question.question, () => {
        if (canListen) startListening("");
      });
    } else if (readAloud) {
      speak(`question-${question.id}`, question.question);
    }
    // Only when the question opens or voice mode turns on, not on every answer.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode, question.id]);

  useEffect(() => () => stopSpeaking(), [stopSpeaking]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (mic.isListening) {
      setSubmitWhenStopped(true);
      mic.stop();
      return;
    }
    void submit(answer, usedMic);
  };

  const shownAnswer = mic.isListening ? joinSpeech(textBeforeMic, mic.transcript) : answer;
  const questionSpeechId = `question-${question.id}`;
  const showFeedback = !!latest && !isRetrying && !isSubmitting;

  return (
    <Card labelledBy="question-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Question {number} of {total}
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
              question.type === "technical"
                ? "bg-sky-50 text-sky-800"
                : "bg-violet-50 text-violet-800"
            }`}
          >
            {QUESTION_TYPE_LABELS[question.type]}
          </span>
        </p>
        <ListenButton
          speech={speech}
          id={questionSpeechId}
          text={question.question}
          label="Hear the question"
        />
      </div>

      <h2
        id="question-heading"
        className="mt-3 text-xl leading-snug font-semibold tracking-tight text-slate-900"
      >
        {question.question}
      </h2>

      {(question.looking_for || question.tip) && (
        <details className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-slate-700">
            Hints: what they're looking for
          </summary>
          {question.looking_for && (
            <p className="mt-2 text-slate-700">{question.looking_for}</p>
          )}
          {question.tip && (
            <p className="mt-2 text-slate-600">
              <span className="font-medium text-slate-800">Tip: </span>
              {question.tip}
            </p>
          )}
        </details>
      )}

      {isSubmitting ? (
        <div className="mt-8 flex flex-col items-center py-6 text-center" role="status">
          <span
            aria-hidden="true"
            className="size-8 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600 motion-reduce:animate-none"
          />
          <p className="mt-3 text-sm text-slate-600">
            Your coach is reviewing your answer...
          </p>
        </div>
      ) : showFeedback && latest ? (
        <div className="mt-6 space-y-5">
          <div>
            <h3 className="text-sm font-medium text-slate-900">
              Your answer
              {latest.spoken && (
                <span className="ml-2 text-xs font-normal text-slate-500">🎙️ spoken</span>
              )}
            </h3>
            <p className="mt-1 line-clamp-4 text-sm whitespace-pre-line text-slate-600">
              {latest.answer}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-semibold tracking-tight text-slate-900">
                Coach feedback
              </h3>
              <ListenButton
                speech={speech}
                id={`feedback-${latest.id}`}
                text={feedbackToSpeech(latest.feedback)}
                label="Hear the feedback"
              />
            </div>
            <FeedbackView feedback={latest.feedback} />
          </div>

          {attempts.length > 1 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-slate-600">
                Earlier attempts ({attempts.length - 1})
              </summary>
              <ol className="mt-2 space-y-3">
                {attempts.slice(0, -1).map((attempt, index) => (
                  <li key={attempt.id} className="rounded-xl border border-slate-100 px-3 py-2">
                    <p className="text-xs text-slate-500">Attempt {index + 1}</p>
                    <p className="mt-1 line-clamp-3 text-slate-700">{attempt.answer}</p>
                    <p className="mt-1 text-slate-600">{attempt.feedback.overall}</p>
                  </li>
                ))}
              </ol>
            </details>
          )}

          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
            <p className="mr-auto text-xs text-slate-500">
              {isLast
                ? "Finishing ends the interview and shows your overall review."
                : "Once you move on, you can't come back to this question."}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  speech.stop();
                  setIsRetrying(true);
                  if (voiceMode && canListen) startListening("");
                }}
                className={SECONDARY_BUTTON}
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => {
                  speech.stop();
                  onNext();
                }}
                className={PRIMARY_BUTTON}
              >
                {nextLabel}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6">
          <label htmlFor="answer" className="text-sm font-medium text-slate-900">
            Your answer
          </label>
          <textarea
            id="answer"
            rows={7}
            value={shownAnswer}
            readOnly={mic.isListening}
            onChange={(event) => setAnswer(event.target.value)}
            maxLength={ANSWER_MAX_LENGTH}
            placeholder={
              canListen
                ? "Type your answer, or press the mic and say it out loud."
                : "Type your answer here."
            }
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-relaxed text-slate-900 read-only:bg-slate-50 focus:border-violet-600 focus:outline-none"
          />

          {mic.isListening && (
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600" role="status">
              <span className="relative flex size-2.5" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
              </span>
              <span>
                Listening...
                {mic.interim && <span className="text-slate-400"> {mic.interim}</span>}
              </span>
            </p>
          )}
          {mic.error && <p className="mt-2 text-sm text-red-700">{mic.error}</p>}
          <ErrorNote message={error} />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {canListen ? (
              mic.isListening ? (
                <button type="button" onClick={mic.stop} className={SECONDARY_BUTTON}>
                  ■ Stop the mic
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => startListening(answer)}
                  className={SECONDARY_BUTTON}
                >
                  🎙️ {answer.trim() ? "Keep talking" : "Speak your answer"}
                </button>
              )
            ) : (
              <p className="text-xs text-slate-500">
                Speaking your answer needs Chrome, Edge or Safari.
              </p>
            )}

            <div className="flex gap-2">
              {latest && (
                <button
                  type="button"
                  onClick={() => {
                    mic.stop();
                    setIsRetrying(false);
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!shownAnswer.trim() && !mic.isListening}
                className={PRIMARY_BUTTON}
              >
                {mic.isListening ? "Done, get feedback" : "Get feedback"}
              </button>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Take a breath and answer as if you're in the room. One to two
            minutes is a good length.
            {canListen &&
              " When you speak, your browser turns it into text; we only keep the text."}
          </p>
        </form>
      )}
    </Card>
  );
}

// "Hear this" / "Stop" for one piece of text.
function ListenButton({
  speech,
  id,
  text,
  label,
}: {
  speech: Speech;
  id: string;
  text: string;
  label: string;
}) {
  if (!speech.isSupported) return null;
  const isSpeaking = speech.speakingId === id;
  return (
    <button
      type="button"
      onClick={() => (isSpeaking ? speech.stop() : speech.speak(id, text))}
      className="cursor-pointer rounded-lg px-2 py-1 text-sm font-medium text-violet-800 hover:bg-violet-50"
    >
      {isSpeaking ? "■ Stop" : `🔊 ${label}`}
    </button>
  );
}

export default QuestionPractice;
