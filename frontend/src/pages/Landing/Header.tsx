import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router";
import { FOCUS_RING } from "./styles";

function Header() {
  const { isAuthenticated } = useAuth0();

  return (
    <header className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 pt-6 sm:px-6">
      <div>
        <Link
          to="/"
          className={`inline-flex items-start gap-2 rounded font-display text-lg leading-tight font-semibold tracking-tight sm:text-xl ${FOCUS_RING}`}
        >
          <span
            aria-hidden="true"
            className="mt-2 size-2.5 shrink-0 rounded-full bg-clay"
          />
          Layoff Landing Pad
        </Link>

        <nav
          aria-label="Page sections"
          className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 pl-4.5"
        >
          <a
            href="#how-it-works"
            className="text-xs text-ink-soft underline-offset-4 hover:text-clay hover:underline"
          >
            How it works
          </a>
          <a
            href="#safety"
            className="text-xs text-ink-soft underline-offset-4 hover:text-clay hover:underline"
          >
            Our safety approach
          </a>
        </nav>
      </div>

      <nav
        aria-label="Account"
        className="flex shrink-0 items-center gap-4 text-sm"
      >
        {isAuthenticated ? (
          <Link
            to="/home"
            className={`rounded-full bg-ink px-5 py-2.5 font-medium text-cream transition-colors hover:bg-ink/85 ${FOCUS_RING}`}
          >
            Go to your home
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="font-medium text-ink underline-offset-4 hover:underline"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className={`rounded-full bg-ink px-5 py-2.5 font-medium text-cream transition-colors hover:bg-ink/85 ${FOCUS_RING}`}
            >
              Get started
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
