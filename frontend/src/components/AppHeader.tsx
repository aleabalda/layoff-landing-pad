import { useAuth0 } from "@auth0/auth0-react";
import { Link, NavLink } from "react-router";

const TABS = [
  { to: "/home", label: "Today" },
  { to: "/plan", label: "Plan" },
  { to: "/profile", label: "Profile" },
];

// `wide` matches pages that use the wider max-w-4xl layout.
function AppHeader({ wide = false }: { wide?: boolean }) {
  const { logout } = useAuth0();

  return (
    <header
      className={`mx-auto flex ${wide ? "max-w-4xl" : "max-w-2xl"} items-center justify-between gap-4 px-4 py-6`}
    >
      <Link
        to="/"
        className="text-sm font-semibold tracking-tight text-slate-500 hover:text-slate-900"
      >
        Layoff Landing Pad
      </Link>

      <div className="flex items-center gap-1 text-sm">
        <nav aria-label="Main" className="flex gap-1">
          {TABS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() =>
            logout({ logoutParams: { returnTo: window.location.origin } })
          }
          className="ml-2 cursor-pointer px-2 py-1.5 font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
        >
          Log out
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
