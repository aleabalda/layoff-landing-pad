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
      className="rounded-3xl border border-ink/10 bg-white p-6 text-left shadow-xl shadow-ink/10"
    >
      <p className="font-display text-lg font-medium text-ink">
        How are you feeling today?
      </p>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {PREVIEW_MOODS.map((emoji, index) => (
          <span
            key={emoji}
            className={`rounded-2xl border py-2 text-center text-xl ${
              index === 3 ? "border-sage-deep bg-sage" : "border-ink/10"
            }`}
          >
            {emoji}
          </span>
        ))}
      </div>

      <p className="mt-6 font-display text-lg font-medium text-ink">
        Today's 3 small wins
      </p>
      <ul className="mt-3 space-y-2.5 text-sm">
        {PREVIEW_WINS.map(({ task, done }) => (
          <li key={task} className="flex items-center gap-3">
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                done ? "border-clay bg-clay text-white" : "border-ink/25"
              }`}
            >
              {done && "✓"}
            </span>
            <span className={done ? "text-ink-soft line-through" : "text-ink"}>
              {task}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-6 rounded-2xl bg-cream px-4 py-3 text-sm text-ink-soft">
        3 of your crew checked in today.
      </p>
    </div>
  );
}

export default HomePreview;
