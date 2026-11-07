import CallsToAction from "./CallsToAction";

function FinalCallToAction() {
  return (
    <section className="px-4 pb-24 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-linear-to-br from-sun via-peach to-lilac px-6 py-16 text-center text-navy sm:px-12 sm:py-24">
        <div
          aria-hidden="true"
          className="absolute -top-40 left-1/2 size-80 -translate-x-1/2 rounded-full bg-white/40 blur-3xl"
        />
        <div className="relative">
          <h2 className="mx-auto max-w-3xl font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl">
            The first 30 days decide a lot. Nobody should go through them
            alone.
          </h2>
          <p className="mt-5 text-lg">
            Start with one check-in. We'll take it from there.
          </p>
          <div className="mt-10 flex justify-center">
            <CallsToAction />
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCallToAction;
