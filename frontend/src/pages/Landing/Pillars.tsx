const PILLARS = [
  {
    name: "Steady",
    summary: "Look after yourself first.",
    points: [
      "Daily check-ins that take one tap",
      "Ways to manage stress and rebuild a routine",
      "Guided reflection to make sense of what happened",
    ],
    badge: "bg-lilac",
  },
  {
    name: "Rebuild",
    summary: "Get the practical stuff under control.",
    points: [
      "A first-week checklist for EI, severance and benefits",
      "Help finding and closing your skill gaps",
      "An honest answer to “Why did you leave?”",
    ],
    badge: "bg-peach",
  },
  {
    name: "Crew",
    summary: "Go through it with people who get it.",
    points: [
      "A small group of 4–6 people in a similar spot",
      "An accountability buddy to check in with",
      "Mentors who've landed new jobs and come back to help",
    ],
    badge: "bg-sun",
  },
];

function Pillars() {
  return (
    <section className="py-24">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2">
        <div className="flex flex-col justify-end rounded-[2rem] bg-night p-8 text-white sm:p-10">
          <h2 className="font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl">
            Losing a job takes more than your paycheque
          </h2>
          <p className="mt-5 text-pretty text-haze">
            It knocks out your income, your routine, your sense of who you are,
            and your work friendships all at once. Most job-search tools only
            deal with finding the next job. We help with the rest of it too.
          </p>
        </div>

        {PILLARS.map(({ name, summary, points, badge }) => (
          <article
            key={name}
            className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-navy/5 sm:p-10"
          >
            <span
              className={`inline-flex rounded-full px-3 py-1 font-display text-sm font-bold text-navy ${badge}`}
            >
              {name}
            </span>
            <h3 className="mt-5 font-display text-2xl font-bold tracking-tight">
              {summary}
            </h3>
            <ul className="mt-5 space-y-3 text-muted">
              {points.map((point) => (
                <li key={point} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-2 size-2 shrink-0 rounded-full ${badge}`}
                  />
                  {point}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Pillars;
