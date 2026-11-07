function Footer() {
  return (
    <footer className="bg-night text-haze">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-xl font-bold tracking-tight text-white">
            Layoff Landing Pad
          </p>
          <p className="mt-1 text-sm">
            Landing Pad is here to support you, but it isn't therapy.
          </p>
        </div>

        <p className="max-w-lg rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-sm text-white">
          <span className="font-semibold">Having a hard time?</span> Call or
          text{" "}
          <a href="tel:988" className="font-semibold text-sun underline">
            9-8-8
          </a>{" "}
          any time for the Suicide Crisis Helpline, or dial{" "}
          <a href="tel:211" className="font-semibold text-sun underline">
            211
          </a>{" "}
          for local community services.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
