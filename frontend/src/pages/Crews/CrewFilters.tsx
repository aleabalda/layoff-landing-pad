import { ALL_TAGS, FIELDS } from "../../profileOptions";

function CrewFilters({
  search,
  onSearchChange,
  fieldFilter,
  onFieldFilterChange,
  tagFilter,
  onTagFilterChange,
}: {
  search: string;
  onSearchChange: (search: string) => void;
  fieldFilter: string | null;
  onFieldFilterChange: (field: string | null) => void;
  tagFilter: string | null;
  onTagFilterChange: (tag: string | null) => void;
}) {
  return (
    <section
      aria-labelledby="crew-filters-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2
        id="crew-filters-heading"
        className="font-semibold tracking-tight text-slate-900"
      >
        Find a crew
      </h2>
      <div className="mt-4">
        <label
          htmlFor="crew-search"
          className="text-sm font-medium text-slate-700"
        >
          Search
        </label>
        <input
          id="crew-search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Crew name, description, or interest"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
        />
      </div>
      <div className="mt-4">
        <label
          htmlFor="crew-field-filter"
          className="text-sm font-medium text-slate-700"
        >
          Filter by work field
        </label>
        <select
          id="crew-field-filter"
          value={fieldFilter ?? ""}
          onChange={(event) => onFieldFilterChange(event.target.value || null)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
        >
          <option value="">All fields</option>
          {FIELDS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4">
        <label
          htmlFor="crew-tag-filter"
          className="text-sm font-medium text-slate-700"
        >
          Filter by interest
        </label>
        <select
          id="crew-tag-filter"
          value={tagFilter ?? ""}
          onChange={(event) => onTagFilterChange(event.target.value || null)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
        >
          <option value="">All interests</option>
          {ALL_TAGS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

export default CrewFilters;
