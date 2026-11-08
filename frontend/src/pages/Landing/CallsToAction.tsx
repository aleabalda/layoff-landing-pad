import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router";
import { FOCUS_RING } from "./styles";

function CallsToAction({ onDark = false }: { onDark?: boolean }) {
  const { isAuthenticated } = useAuth0();

  const primary = `inline-flex justify-center rounded-lg px-5 py-3 text-sm font-medium transition-colors ${FOCUS_RING} ${
    onDark
      ? "bg-white text-slate-900 hover:bg-teal-50"
      : "bg-teal-700 text-white hover:bg-teal-800"
  }`;
  const secondary = `inline-flex justify-center rounded-lg border px-5 py-3 text-sm font-medium transition-colors ${FOCUS_RING} ${
    onDark
      ? "border-slate-600 text-white hover:bg-slate-800"
      : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
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
