import { Link } from "react-router";

// The app's logo: a sun rising over the horizon (a new start), in the app's
// teal. public/favicon.svg is the same mark.
export function BrandMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="brand-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#brand-bg)" />
      {/* Sun */}
      <path d="M9.5 20a6.5 6.5 0 0 1 13 0Z" fill="#fef3c7" />
      {/* Rays */}
      <g stroke="#fef3c7" strokeWidth="1.8" strokeLinecap="round">
        <path d="M16 8.5v2.2" />
        <path d="M9.4 11.4l1.5 1.5" />
        <path d="M22.6 11.4l-1.5 1.5" />
      </g>
      {/* Horizon */}
      <path
        d="M7 22.5h18"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// "Layoff Landing Pad" with the mark. Links home unless `to` is null.
function Brand({
  to = "/",
  className = "",
}: {
  to?: string | null;
  className?: string;
}) {
  const content = (
    <>
      <BrandMark />
      <span className="text-[15px] leading-none tracking-tight">
        <span className="font-medium text-teal-700">Layoff</span>{" "}
        <span className="font-bold text-slate-900">Landing Pad</span>
      </span>
    </>
  );
  const classes = `inline-flex items-center gap-2 rounded-lg ${className}`;

  return to === null ? (
    <span className={classes}>{content}</span>
  ) : (
    <Link
      to={to}
      aria-label="Layoff Landing Pad home"
      className={`${classes} transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600`}
    >
      {content}
    </Link>
  );
}

export default Brand;
