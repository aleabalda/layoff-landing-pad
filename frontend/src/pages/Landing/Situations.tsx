import CallsToAction from "./CallsToAction";

const SITUATIONS = [
  {
    title: "Laid off",
    description:
      "Get organized fast, and get a steady reminder that it wasn't personal.",
  },
  {
    title: "Let go",
    description:
      "Work through what happened and find a confident way to explain it in interviews.",
  },
  {
    title: "I quit",
    description:
      "Recover from burnout and explore what's next before rushing back.",
  },
];

function Situations() {
  return (
    <div className="mt-24 grid gap-10 rounded-[2rem] bg-sand p-6 sm:p-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
      <div className="lg:self-center">
        <h2 className="font-display text-3xl leading-tight font-medium tracking-tight text-balance sm:text-4xl">
          Built around how your job ended
        </h2>
        <p className="mt-4 text-pretty text-ink-soft">
          Each situation feels different, so your plan starts from yours.
        </p>
        <div className="mt-8">
          <CallsToAction />
        </div>
      </div>

      <ul className="space-y-3">
        {SITUATIONS.map(({ title, description }) => (
          <li key={title} className="rounded-2xl bg-cream p-5 sm:p-6">
            <h3 className="font-display text-xl font-medium">{title}</h3>
            <p className="mt-1 text-sm text-pretty text-ink-soft">
              {description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Situations;
