import type { Option } from "../../profileOptions";

export function StepHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}

export function TextField({
  id,
  label,
  hint,
  value,
  onChange,
  ...inputProps
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="mt-6">
      <label htmlFor={id} className="text-sm font-medium text-slate-900">
        {label}
      </label>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
        {...inputProps}
      />
    </div>
  );
}

export function ChoiceGroup({
  legend,
  options,
  value,
  onChange,
  columns = 2,
}: {
  legend: string;
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  columns?: 2 | 3;
}) {
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-medium text-slate-900">{legend}</legend>
      <div
        className={`mt-3 grid gap-2 ${
          columns === 3 ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
        }`}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center rounded-xl border px-3 py-2.5 text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-teal-600 ${
              value === option.value
                ? "border-teal-600 bg-teal-50 text-teal-900"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name={legend}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
