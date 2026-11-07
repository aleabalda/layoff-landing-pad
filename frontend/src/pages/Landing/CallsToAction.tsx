import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router";
import { FOCUS_RING } from "./styles";

// tone is the background the buttons sit on.
function CallsToAction({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { isAuthenticated } = useAuth0();

  const base = `inline-flex justify-center rounded-full border px-6 py-3 text-sm font-semibold transition-colors ${FOCUS_RING}`;
  const primary = `${base} ${
    tone === "dark"
      ? "border-sun bg-sun text-night hover:border-[#ffe09e] hover:bg-[#ffe09e]"
      : "border-night bg-night text-white hover:border-dusk hover:bg-dusk"
  }`;
  const secondary = `${base} ${
    tone === "dark"
      ? "border-white/30 text-white hover:bg-white/10"
      : "border-navy/25 text-navy hover:bg-navy/5"
  }`;

  if (isAuthenticated) {
    return (
      <Link to="/home" className={primary}>
        Go to your home
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link to="/register" className={primary}>
        Get started free
      </Link>
      <Link to="/login" className={secondary}>
        Log in
      </Link>
    </div>
  );
}

export default CallsToAction;
