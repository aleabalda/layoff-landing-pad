import CallsToAction from "./CallsToAction";

function FinalCallToAction() {
  return (
    <section className="px-4 pb-24 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-[2.5rem] bg-clay px-6 py-16 text-center text-cream sm:px-12 sm:py-24">
        <h2 className="mx-auto max-w-3xl font-display text-4xl leading-tight font-medium tracking-tight text-balance sm:text-5xl">
          The first 30 days decide a lot.{" "}
          <em>Nobody should go through them alone.</em>
        </h2>
        <p className="mt-5 text-lg">
          Start with one check-in. We'll take it from there.
        </p>
        <div className="mt-10 flex justify-center">
          <CallsToAction onDark />
        </div>
      </div>
    </section>
  );
}

export default FinalCallToAction;
