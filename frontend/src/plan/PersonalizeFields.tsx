import { DIALOG_HEADING } from "./personalizeShared";

export function StepHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h2
        id={DIALOG_HEADING}
        className="text-xl font-semibold tracking-tight text-slate-900"
      >
        {title}
      </h2>
      <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}

export function TextArea({
  id,
  label,
  hint,
  value,
  onChange,
  maxLength,
  rows,
  placeholder,
  autoFocus,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  rows: number;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="mt-5">
      <label htmlFor={id} className="text-sm font-medium text-slate-900">
        {label}
      </label>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      <textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        // Focus moves here when each step opens, for keyboard and screen reader users.
        // oxlint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-violet-600 focus:outline-none"
      />
      {value.length > maxLength * 0.8 && (
        <p className="mt-1 text-right text-xs text-slate-500">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}
