import { useAuth0 } from "@auth0/auth0-react";
import { Link, NavLink } from "react-router";

const TABS = [
  { to: "/home", label: "Today" },
  { to: "/crews", label: "Crews" },
  { to: "/messages", label: "Messages" },
  { to: "/profile", label: "Profile" },
];

// Full width on every page, so the logo and tabs stay put when switching
// tabs. w-full matters on pages laid out as a flex column (Messages), where
// the header would otherwise shrink to its contents.
function AppHeader() {
  const { logout } = useAuth0();

  return (
    <header className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-6 sm:px-6">
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
