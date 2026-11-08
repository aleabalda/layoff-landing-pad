import type { ReactNode } from "react";
import Brand from "./Brand";

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
        <div className="mb-6 flex justify-center">
          <Brand />
        </div>

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
            className="mt-6 w-full cursor-pointer rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
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
