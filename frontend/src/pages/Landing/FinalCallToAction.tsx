import CallsToAction from "./CallsToAction";

function FinalCallToAction() {
  return (
    <section className="bg-slate-900 py-20 text-white">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          The first 30 days decide a lot. Nobody should go through them alone.
        </h2>
        <p className="mt-4 text-slate-300">
          Start with one check-in. We'll take it from there.
        </p>
        <div className="mt-8 flex justify-center">
          <CallsToAction onDark />
        </div>
      </div>
    </section>
  );
}

export default FinalCallToAction;
