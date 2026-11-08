const PILLARS = [
  {
    name: "Steady",
    summary: "Look after yourself first.",
    points: [
      "Daily check-ins that take one tap",
      "Ways to manage stress and rebuild a routine",
      "Guided reflection to make sense of what happened",
    ],
  },
  {
    name: "Rebuild",
    summary: "Get the practical stuff under control.",
    points: [
      "A first-week checklist for EI, severance and benefits",
      "Help finding and closing your skill gaps",
      "An honest answer to “Why did you leave?”",
    ],
  },
  {
    name: "Crew",
    summary: "Go through it with people who get it.",
    points: [
      "A small group of 4–6 people in a similar spot",
      "An accountability buddy to check in with",
      "Mentors who've landed new jobs and come back to help",
    ],
  },
];

function Pillars() {
  return (
    <section className="border-y border-slate-200 bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Losing a job takes more than your paycheque
          </h2>
          <p className="mt-4 text-pretty text-slate-600">
            It knocks out your income, your routine, your sense of who you are,
            and your work friendships all at once. Most job-search tools only
            deal with finding the next job. We help with the rest of it too.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PILLARS.map(({ name, summary, points }) => (
            <article
              key={name}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
            >
              <h3 className="text-xl font-semibold tracking-tight text-teal-800">
                {name}
              </h3>
              <p className="mt-1 font-medium">{summary}</p>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                {points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pillars;
