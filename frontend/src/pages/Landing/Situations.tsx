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
    <div className="mt-20 rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
      <h2 className="text-2xl font-semibold tracking-tight text-balance">
        Built around how your job ended
      </h2>
      <p className="mt-2 text-pretty text-slate-600">
        Each situation feels different, so your plan starts from yours.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {SITUATIONS.map(({ title, description }) => (
          <div key={title}>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-pretty text-slate-600">
              {description}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <CallsToAction />
      </div>
    </div>
  );
}

export default Situations;
