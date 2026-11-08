import { TAG_GROUPS } from "../profileOptions";

function TagPicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (tag: string) => void;
}) {
  return (
    <>
      {TAG_GROUPS.map(({ heading, tags }) => (
        <fieldset key={heading} className="mt-6">
          <legend className="text-sm font-medium text-slate-900">
            {heading}
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map(({ value, label }) => {
              const isSelected = selected.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onToggle(value)}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    isSelected
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {isSelected && <span aria-hidden="true">✓ </span>}
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </>
  );
}

export function toggleInList(list: string[], item: string) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export default TagPicker;
