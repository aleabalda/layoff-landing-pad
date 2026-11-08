// Read once when the app loads.
const YEAR = new Date().getFullYear();

// The footer on the landing page and the Today page: crisis lines, a
// reminder that this isn't therapy, and the copyright. Centered.
// `spacing` replaces the default vertical padding.
function SiteFooter({ spacing = "pt-6 pb-2" }: { spacing?: string }) {
  return (
    <footer
      className={`mx-auto max-w-3xl px-4 text-center text-sm text-slate-600 ${spacing}`}
    >
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
      <p className="mt-4 text-xs text-slate-400">
        © {YEAR} CozyFleece. All rights reserved.
      </p>
    </footer>
  );
}

export default SiteFooter;
