const PREVIEW_MOODS = ["😣", "😔", "😐", "🙂", "😊"];

const PREVIEW_WINS = [
  { task: "Take a 15-minute walk", done: true },
  { task: "Update your LinkedIn headline", done: false },
  { task: "Reply in your crew chat", done: false },
];

// An illustration of the home screen, so it's hidden from screen readers.
function HomePreview() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70"
    >
      <p className="text-sm font-semibold tracking-tight text-slate-900">
        How are you feeling today?
      </p>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {PREVIEW_MOODS.map((emoji, index) => (
          <span
            key={emoji}
            className={`rounded-xl border py-2 text-center text-xl ${
              index === 3 ? "border-teal-600 bg-teal-50" : "border-slate-200"
            }`}
          >
            {emoji}
          </span>
        ))}
      </div>

      <p className="mt-6 text-sm font-semibold tracking-tight text-slate-900">
        Today's 3 small wins
      </p>
      <ul className="mt-3 space-y-2.5 text-sm">
        {PREVIEW_WINS.map(({ task, done }) => (
          <li key={task} className="flex items-center gap-3">
            <span
              className={`flex size-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                done
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-slate-300"
              }`}
            >
              {done && "✓"}
            </span>
            <span
              className={
                done ? "text-slate-400 line-through" : "text-slate-700"
              }
            >
              {task}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-6 rounded-lg bg-teal-50 px-3 py-2.5 text-sm text-teal-900">
        3 of your crew checked in today.
      </p>
    </div>
  );
}

export default HomePreview;
