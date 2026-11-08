import { type ChangeEvent, useState } from "react";
import {
  checkResume,
  LINK_FIELDS,
  type LinkKind,
  type Links,
  MAX_RESUME_BYTES,
  formatBytes,
} from "../resume";

// Pick a PDF, or show the one already chosen with options to replace or
// remove it. Used in onboarding and on the Profile page.
export function ResumePicker({
  fileName,
  fileDetail,
  onChoose,
  onClear,
  clearLabel = "Remove",
}: {
  fileName: string | null;
  fileDetail?: string;
  onChoose: (file: File) => void;
  onClear?: () => void;
  clearLabel?: string;
}) {
  const [error, setError] = useState<string | null>(null);

  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // Lets them pick the same file again.
    if (!file) return;
    const problem = checkResume(file);
    setError(problem);
    if (!problem) onChoose(file);
  };

  const fileInput = (
    <input
      type="file"
      accept="application/pdf,.pdf"
      onChange={choose}
      className="sr-only"
    />
  );

  return (
    <div>
      <p className="text-sm font-medium text-slate-900">
        Resume (PDF, up to {formatBytes(MAX_RESUME_BYTES)})
      </p>
      {fileName ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-teal-600 bg-teal-50 px-3 py-2.5 text-sm">
          <span className="min-w-0 truncate text-teal-900">
            📄 {fileName}
            {fileDetail && (
              <span className="text-teal-800/70"> ({fileDetail})</span>
            )}
          </span>
          <span className="flex shrink-0 gap-3 font-medium text-teal-900">
            <label className="cursor-pointer underline-offset-4 hover:underline has-focus-visible:underline">
              Replace
              {fileInput}
            </label>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="cursor-pointer underline-offset-4 hover:underline"
              >
                {clearLabel}
              </button>
            )}
          </span>
        </div>
      ) : (
        <label className="mt-2 flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-slate-300 px-3 py-5 text-center text-sm text-slate-600 transition-colors hover:bg-slate-50 has-focus-visible:outline-2 has-focus-visible:outline-teal-600">
          <span className="font-medium text-slate-900">Choose a PDF</span>
          <span className="text-xs text-slate-500">
            Helps us suggest skills and roles later on.
          </span>
          {fileInput}
        </label>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function LinkInputs({
  links,
  errors,
  onChange,
}: {
  links: Links;
  errors: Partial<Links>;
  onChange: (kind: LinkKind, value: string) => void;
}) {
  return (
    <>
      {LINK_FIELDS.map(({ kind, label, placeholder, autoComplete }) => {
        const id = `link-${kind}`;
        const error = errors[kind];
        return (
          <div key={kind} className="mt-5">
            <label htmlFor={id} className="text-sm font-medium text-slate-900">
              {label} (optional)
            </label>
            <input
              id={id}
              type="text"
              inputMode="url"
              value={links[kind]}
              onChange={(event) => onChange(kind, event.target.value)}
              placeholder={placeholder}
              autoComplete={autoComplete ?? "off"}
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : undefined}
              className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none ${
                error
                  ? "border-red-400 focus:border-red-500"
                  : "border-slate-200 focus:border-teal-600"
              }`}
            />
            {error && (
              <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
        );
      })}
    </>
  );
}
