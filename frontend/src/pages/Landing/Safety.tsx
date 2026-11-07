const PROMISES = [
  {
    title: "Private by default",
    description:
      "Your moods and journal stay yours. Your crew only sees what you choose to share, and former employers never see anything.",
    tile: "bg-sage",
  },
  {
    title: "Support, not therapy",
    description:
      "We say that plainly, and point you to crisis lines and affordable counselling when you need more.",
    tile: "bg-sand",
  },
  {
    title: "No guilt, ever",
    description:
      "No red badges and no “you're behind.” On a hard day, rest counts as progress.",
    tile: "bg-white",
  },
];

function Safety() {
  return (
    <section id="safety" className="scroll-mt-4 pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl font-display text-4xl leading-tight font-medium tracking-tight text-balance sm:text-5xl">
          Built with care for hard days
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PROMISES.map(({ title, description, tile }) => (
            <div
              key={title}
              className={`rounded-[2rem] border border-ink/10 p-8 ${tile}`}
            >
              <h3 className="font-display text-2xl font-medium tracking-tight">
                {title}
              </h3>
              <p className="mt-3 text-pretty text-ink-soft">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Safety;
