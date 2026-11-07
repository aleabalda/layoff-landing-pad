const PROMISES = [
  {
    title: "Private by default",
    description:
      "Your moods and journal stay yours. Your crew only sees what you choose to share, and former employers never see anything.",
  },
  {
    title: "Support, not therapy",
    description:
      "We say that plainly, and point you to crisis lines and affordable counselling when you need more.",
  },
  {
    title: "No guilt, ever",
    description:
      "No red badges and no “you're behind.” On a hard day, rest counts as progress.",
  },
];

function Safety() {
  return (
    <section id="safety" className="scroll-mt-4 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
        <h2 className="font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl lg:sticky lg:top-12 lg:self-start">
          Built with care for hard days
        </h2>

        <ul className="divide-y divide-navy/10 border-y border-navy/10">
          {PROMISES.map(({ title, description }) => (
            <li key={title} className="flex gap-5 py-8">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lilac font-bold text-navy"
              >
                ✓
              </span>
              <div>
                <h3 className="font-display text-2xl font-bold tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 text-pretty text-muted">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Safety;
