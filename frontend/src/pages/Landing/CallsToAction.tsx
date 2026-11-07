import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router";
import { FOCUS_RING } from "./styles";

// onDark is for buttons sitting on the terracotta call-to-action block.
function CallsToAction({ onDark = false }: { onDark?: boolean }) {
  const { isAuthenticated } = useAuth0();

  const base = `inline-flex justify-center rounded-full px-6 py-3 text-sm font-medium transition-colors ${FOCUS_RING}`;
  const primary = `${base} ${
    onDark
      ? "bg-cream text-ink hover:bg-white"
      : "bg-ink text-cream hover:bg-ink/85"
  }`;
  const secondary = `${base} border ${
    onDark
      ? "border-cream/60 text-cream hover:bg-cream/10"
      : "border-ink/25 text-ink hover:bg-ink/5"
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
