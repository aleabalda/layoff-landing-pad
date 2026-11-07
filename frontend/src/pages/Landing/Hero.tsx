import { useAuth0 } from "@auth0/auth0-react";
import CallsToAction from "./CallsToAction";
import HomePreview from "./HomePreview";

// Decorative stars as [top %, left %].
const STARS = [
  [14, 8],
  [22, 46],
  [9, 62],
  [30, 88],
  [44, 4],
  [18, 78],
  [52, 52],
  [36, 30],
];

function Hero() {
  const { error } = useAuth0();

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-night via-dusk to-plum pt-48 text-white sm:pt-40">
      <div aria-hidden="true">
        {STARS.map(([top, left]) => (
          <span
            key={`${top}-${left}`}
            className="absolute size-1 rounded-full bg-white/60"
            style={{ top: `${top}%`, left: `${left}%` }}
          />
        ))}
        <div className="absolute -bottom-104 left-1/2 size-176 -translate-x-1/2 rounded-full bg-radial from-sun/60 via-peach/25 to-transparent to-70%" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-14 px-4 pb-20 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:pb-28">
        <div>
          {error && (
            <p
              role="alert"
              className="mb-8 rounded-2xl border border-peach/40 bg-night/60 px-5 py-3 text-sm text-peach"
            >
              We couldn't log you in: {error.message}
            </p>
          )}

          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm text-haze">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-sun" />
            For anyone who's been laid off, let go, or quit
          </p>

          <h1 className="mt-6 font-display text-5xl leading-[1.02] font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Losing your job is hard.{" "}
            <span className="bg-linear-to-r from-sun to-peach bg-clip-text text-transparent">
              Bouncing back shouldn't be lonely.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-pretty text-haze">
            Landing Pad gives you a personalized 30-day plan and a small crew of
            people going through the same thing, so you can steady yourself,
            rebuild, and relaunch.
          </p>

          <div className="mt-10">
            <CallsToAction tone="dark" />
          </div>
        </div>

        <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
          <HomePreview />
        </div>
      </div>
    </section>
  );
}

export default Hero;
