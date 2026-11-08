import type { Feedback } from "./interviewApi";

// The coach's feedback on one answer.
function FeedbackView({ feedback }: { feedback: Feedback }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-slate-800">{feedback.overall}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {feedback.strengths.length > 0 && (
          <section className="rounded-xl bg-teal-50 px-4 py-3">
            <h4 className="text-sm font-semibold text-teal-900">What worked</h4>
            <ul className="mt-2 space-y-1.5 text-sm text-teal-900">
              {feedback.strengths.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {feedback.improvements.length > 0 && (
          <section className="rounded-xl bg-amber-50 px-4 py-3">
            <h4 className="text-sm font-semibold text-amber-900">To make it stronger</h4>
            <ul className="mt-2 space-y-1.5 text-sm text-amber-900">
              {feedback.improvements.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {feedback.stronger_answer && (
        <details className="group rounded-xl border border-slate-200 px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-slate-900">
            A stronger answer could sound like...
          </summary>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-slate-700">
            {feedback.stronger_answer}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Swap anything in [brackets] for your own real details.
          </p>
        </details>
      )}

      {feedback.follow_up && (
        <div className="rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-900">
          <span className="font-semibold">They might follow up with: </span>
          {feedback.follow_up}
        </div>
      )}
    </div>
  );
}

export default FeedbackView;
