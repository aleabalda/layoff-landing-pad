import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router";
import { FOCUS_RING } from "./styles";
import Brand from "../../components/Brand";

function Header() {
  const { isAuthenticated } = useAuth0();

  return (
    <header className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 py-5 sm:px-6">
      <div>
        <Brand />

        <nav
          aria-label="Page sections"
          className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm"
        >
          <a
            href="/#how-it-works"
            className="text-slate-600 hover:text-slate-900 text-xs"
          >
            How it works
          </a>
          <a
            href="/#safety"
            className="text-slate-600 hover:text-slate-900 text-xs"
          >
            Our safety approach
          </a>
          <Link
            to="/about"
            className="text-slate-600 hover:text-slate-900 text-xs"
          >
            About us
          </Link>
        </nav>
      </div>

      <nav
        aria-label="Account"
        className="flex shrink-0 items-center gap-5 text-sm"
      >
        {isAuthenticated ? (
          <Link
            to="/home"
            className={`rounded-lg bg-teal-700 px-4 py-2 font-medium text-white transition-colors hover:bg-teal-800 ${FOCUS_RING}`}
          >
            Go to your home
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="font-medium text-slate-700 hover:text-slate-900"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className={`rounded-lg bg-teal-700 px-4 py-2 font-medium text-white transition-colors hover:bg-teal-800 ${FOCUS_RING}`}
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
