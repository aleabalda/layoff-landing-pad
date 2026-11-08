import type { ReactNode } from "react";
import { Link } from "react-router";

type AuthCardProps = {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  error?: Error;
  footer: ReactNode;
};

function AuthCard({
  title,
  subtitle,
  actionLabel,
  onAction,
  error,
  footer,
}: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-sm font-semibold tracking-tight text-slate-500">
          <Link to="/" className="hover:text-slate-900">
            Layoff Landing Pad
          </Link>
        </p>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>

          {error && (
            <p
              role="alert"
              className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error.message}
            </p>
          )}

          <button
            type="button"
            onClick={onAction}
            className="mt-6 w-full cursor-pointer rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            {actionLabel}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>
      </div>
    </main>
  );
}

export default AuthCard;
