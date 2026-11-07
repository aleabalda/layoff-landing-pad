import CallsToAction from "./CallsToAction";
import HomePreview from "./HomePreview";

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-20 lg:pb-28">
      <div>
        <p className="text-sm font-medium text-teal-800">
          For anyone who's been laid off, let go, or quit
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Losing your job is hard. Bouncing back shouldn't be lonely.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-pretty text-slate-600">
          Landing Pad gives you a personalized 30-day plan and a small crew of
          people going through the same thing, so you can steady yourself,
          rebuild, and relaunch.
        </p>
        <div className="mt-8">
          <CallsToAction />
        </div>
      </div>

      <HomePreview />
    </section>
  );
}

export default Hero;
