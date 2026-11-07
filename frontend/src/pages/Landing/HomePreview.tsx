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
      className="rounded-3xl bg-white p-6 text-left text-navy shadow-2xl shadow-night/40"
    >
      <p className="font-display text-lg font-bold tracking-tight">
        How are you feeling today?
      </p>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {PREVIEW_MOODS.map((emoji, index) => (
          <span
            key={emoji}
            className={`rounded-2xl py-2 text-center text-xl ${
              index === 3 ? "bg-sun ring-2 ring-night" : "bg-mist"
            }`}
          >
            {emoji}
          </span>
        ))}
      </div>

      <p className="mt-6 font-display text-lg font-bold tracking-tight">
        Today's 3 small wins
      </p>
      <ul className="mt-3 space-y-2.5 text-sm">
        {PREVIEW_WINS.map(({ task, done }) => (
          <li key={task} className="flex items-center gap-3">
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 text-[11px] font-bold ${
                done ? "border-night bg-night text-sun" : "border-navy/20"
              }`}
            >
              {done && "✓"}
            </span>
            <span className={done ? "text-muted line-through" : ""}>
              {task}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-6 flex items-center gap-2 rounded-2xl bg-mist px-4 py-3 text-sm text-muted">
        <span className="size-2 rounded-full bg-lilac" />
        3 of your crew checked in today.
      </p>
    </div>
  );
}

export default HomePreview;
