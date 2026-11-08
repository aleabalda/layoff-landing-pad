function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-600 sm:px-6">
      <p>
        <span className="font-medium text-slate-800">Having a hard time?</span>{" "}
        Call or text{" "}
        <a href="tel:988" className="font-medium text-teal-800 underline">
          9-8-8
        </a>{" "}
        any time for the Suicide Crisis Helpline, or dial{" "}
        <a href="tel:211" className="font-medium text-teal-800 underline">
          211
        </a>{" "}
        for local community services.
      </p>
      <p className="mt-2 text-slate-500">
        Landing Pad is here to support you, but it isn't therapy.
      </p>
    </footer>
  );
}

export default Footer;
