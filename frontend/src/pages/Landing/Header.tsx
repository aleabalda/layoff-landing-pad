import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router";
import { FOCUS_RING } from "./styles";

// Sits on top of the dark hero.
function Header() {
  const { isAuthenticated } = useAuth0();

  return (
    <header className="absolute inset-x-0 top-0 z-10">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 pt-6 sm:px-6">
        <div>
          <Link
            to="/"
            className={`inline-flex items-start gap-2 rounded font-display text-lg leading-tight font-bold tracking-tight text-white sm:text-xl ${FOCUS_RING}`}
          >
            <span
              aria-hidden="true"
              className="mt-1 size-4 shrink-0 rounded-full bg-linear-to-b from-sun to-peach"
            />
            Layoff Landing Pad
          </Link>

          <nav
            aria-label="Page sections"
            className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 pl-6"
          >
            <a
              href="#how-it-works"
              className="text-xs text-haze transition-colors hover:text-white"
            >
              How it works
            </a>
            <a
              href="#safety"
              className="text-xs text-haze transition-colors hover:text-white"
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
              className={`rounded-full bg-sun px-5 py-2.5 font-semibold text-night transition-colors hover:bg-[#ffe09e] ${FOCUS_RING}`}
            >
              Go to your home
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="font-medium text-white/90 transition-colors hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className={`rounded-full bg-sun px-5 py-2.5 font-semibold text-night transition-colors hover:bg-[#ffe09e] ${FOCUS_RING}`}
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
