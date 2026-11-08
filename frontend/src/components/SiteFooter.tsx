// Read once when the app loads.
const YEAR = new Date().getFullYear();

// The footer on the landing page and the Today page: a reminder that this
// isn't therapy, and the copyright. Centered.
// `spacing` replaces the default vertical padding.
function SiteFooter({ spacing = "pt-6 pb-2" }: { spacing?: string }) {
  return (
    <footer
      className={`mx-auto max-w-3xl px-4 text-center text-sm text-slate-600 ${spacing}`}
    >
      <p className="text-slate-500">
        Landing Pad is here to support you, but it isn't therapy.
      </p>
      <p className="mt-4 text-xs text-slate-400">
        © {YEAR} CozyFleece. All rights reserved.
      </p>
    </footer>
  );
}

export default SiteFooter;
