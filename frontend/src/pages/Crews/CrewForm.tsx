import { type FormEvent, useState } from "react";
import { ErrorNote } from "../../components/Card";
import TagPicker, { toggleInList } from "../../components/TagPicker";
import { FIELDS } from "../../profileOptions";
import {
  CREW_DESCRIPTION_MAX,
  CREW_NAME_MAX,
  CREW_NAME_MIN,
  CREW_TAGS_MAX,
  type CrewValues,
  type Visibility,
} from "./crewTypes";

const VISIBILITY_OPTIONS: { value: Visibility; label: string; hint: string }[] =
  [
    {
      value: "public",
      label: "Public",
      hint: "Anyone on Landing Pad can find and join it.",
    },
    {
      value: "private",
      label: "Private",
      hint: "Hidden. People join with an invite code you share.",
    },
  ];

const EMPTY: CrewValues = {
  name: "",
  description: "",
  visibility: "public",
  tags: [],
  target_field: "",
};

function CrewForm({
  initial = EMPTY,
  title,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: CrewValues;
  title: string;
  submitLabel: string;
  // Returns an error message, or null when it worked.
  onSubmit: (values: CrewValues) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<CrewValues>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CrewValues>(key: K, value: CrewValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const toggleTag = (tag: string) => {
    if (!values.tags.includes(tag) && values.tags.length >= CREW_TAGS_MAX) {
      setError(`Pick up to ${CREW_TAGS_MAX} interests.`);
      return;
    }
    setError(null);
    set("tags", toggleInList(values.tags, tag));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (values.name.trim().length < CREW_NAME_MIN) {
      setError(`Give the crew a name of at least ${CREW_NAME_MIN} characters.`);
      return;
    }

    setIsSaving(true);
    setError(null);
    const message = await onSubmit({
      ...values,
      name: values.name.trim(),
      description: values.description.trim(),
    });
    setIsSaving(false);
    if (message) setError(message);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">
        {title}
      </h2>

      <div className="mt-5">
        <label
          htmlFor="crew-name"
          className="text-sm font-medium text-slate-900"
        >
          Name
        </label>
        <input
          id="crew-name"
          type="text"
          value={values.name}
          maxLength={CREW_NAME_MAX}
          required
          placeholder="e.g. Calgary tech job hunters"
          onChange={(event) => set("name", event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
        />
      </div>

      <div className="mt-5">
        <label
          htmlFor="crew-target-field"
          className="text-sm font-medium text-slate-900"
        >
          What work field should this crew focus on?
        </label>
        <select
          id="crew-target-field"
          value={values.target_field}
          required
          onChange={(event) => set("target_field", event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
        >
          <option value="" disabled>
            Choose a work field
          </option>
          {FIELDS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-slate-500">
          People can find this crew by the field they selected on their profile.
        </p>
      </div>

      <div className="mt-5">
        <label
          htmlFor="crew-description"
          className="text-sm font-medium text-slate-900"
        >
          Description (optional)
        </label>
        <p className="mt-1 text-sm text-slate-500">
          Who it's for and what you'll do together.
        </p>
        <textarea
          id="crew-description"
          rows={4}
          maxLength={CREW_DESCRIPTION_MAX}
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
        />
        <p className="mt-1 text-right text-xs text-slate-500">
          {values.description.length}/{CREW_DESCRIPTION_MAX}
        </p>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-slate-900">
          Who can join
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {VISIBILITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-teal-600 ${
                values.visibility === option.value
                  ? "border-teal-600 bg-teal-50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="crew-visibility"
                value={option.value}
                checked={values.visibility === option.value}
                onChange={() => set("visibility", option.value)}
                className="sr-only"
              />
              <span className="block font-medium text-slate-900">
                {option.label}
              </span>
              <span className="mt-0.5 block text-slate-600">{option.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <h3 className="mt-6 text-sm font-medium text-slate-900">
        Interests (up to {CREW_TAGS_MAX})
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Helps people with the same tags find your crew.
      </p>
      <TagPicker selected={values.tags} onToggle={toggleTag} />

      <ErrorNote message={error} />

      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="cursor-pointer rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSaving ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default CrewForm;
