function Footer() {
  return (
    <footer className="border-t border-ink/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-xl font-semibold tracking-tight">
            Layoff Landing Pad
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Landing Pad is here to support you, but it isn't therapy.
          </p>
        </div>

        <p className="max-w-lg rounded-2xl bg-sage px-5 py-4 text-sm text-ink">
          <span className="font-semibold">Having a hard time?</span> Call or
          text{" "}
          <a href="tel:988" className="font-semibold underline">
            9-8-8
          </a>{" "}
          any time for the Suicide Crisis Helpline, or dial{" "}
          <a href="tel:211" className="font-semibold underline">
            211
          </a>{" "}
          for local community services.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
