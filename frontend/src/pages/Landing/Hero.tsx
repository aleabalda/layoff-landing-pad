import CallsToAction from "./CallsToAction";
import HomePreview from "./HomePreview";

function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-16 pb-24 text-center sm:px-6 lg:pt-24">
      <p className="inline-flex rounded-full border border-ink/15 bg-white/60 px-4 py-1.5 text-sm text-ink-soft">
        For anyone who's been laid off, let go, or quit
      </p>

      <h1 className="mx-auto mt-8 max-w-4xl font-display text-5xl leading-[1.05] font-medium tracking-tight text-balance sm:text-6xl lg:text-7xl">
        Losing your job is hard.{" "}
        <em className="text-clay">Bouncing back shouldn't be lonely.</em>
      </h1>

      <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-ink-soft">
        Landing Pad gives you a personalized 30-day plan and a small crew of
        people going through the same thing, so you can steady yourself,
        rebuild, and relaunch.
      </p>

      <div className="mt-10 flex justify-center">
        <CallsToAction />
      </div>

      <div className="relative mx-auto mt-20 max-w-md">
        <div
          aria-hidden="true"
          className="absolute -inset-5 rotate-3 rounded-[2.5rem] bg-sage sm:-inset-8"
        />
        <div className="relative -rotate-1">
          <HomePreview />
        </div>
      </div>
    </section>
  );
}

export default Hero;
