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
    <section
      id="safety"
      className="scroll-mt-4 border-y border-slate-200 bg-white py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance">
          Built with care for hard days
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {PROMISES.map(({ title, description }) => (
            <div key={title}>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-pretty text-slate-600">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Safety;
