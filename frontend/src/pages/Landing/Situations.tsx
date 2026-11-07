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
    <div className="mt-24 rounded-[2rem] bg-night p-8 text-white sm:p-12">
      <h2 className="font-display text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">
        Built around how your job ended
      </h2>
      <p className="mt-3 text-pretty text-haze">
        Each situation feels different, so your plan starts from yours.
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {SITUATIONS.map(({ title, description }) => (
          <div key={title} className="border-l-2 border-sun pl-5">
            <h3 className="font-display text-xl font-bold">{title}</h3>
            <p className="mt-2 text-sm text-pretty text-haze">{description}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <CallsToAction tone="dark" />
      </div>
    </div>
  );
}

export default Situations;
