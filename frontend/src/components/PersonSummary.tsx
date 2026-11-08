import type { ReactNode } from "react";
import {
  ALL_TAGS,
  EXPERIENCE_LEVELS,
  FIELDS,
  labelFor,
} from "../profileOptions";

// The profile fields other people are allowed to see.
export type PublicPerson = {
  user_id: string;
  display_name: string | null;
  field: string | null;
  experience_level: string | null;
  city: string | null;
  bio: string | null;
};

function PersonSummary({
  person,
  tags = [],
  tagsLabel,
  action,
}: {
  person: PublicPerson;
  tags?: string[];
  tagsLabel?: string;
  action?: ReactNode;
}) {
  const name = person.display_name?.trim() || "Someone";
  const details = [
    labelFor(FIELDS, person.field),
    labelFor(EXPERIENCE_LEVELS, person.experience_level),
    person.city,
  ].filter(Boolean);
  const tagLabels = tags
    .map((tag) => labelFor(ALL_TAGS, tag))
    .filter((label): label is string => !!label);

  return (
    <div className="flex items-start gap-3">
      <div
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-800"
      >
        {name.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {name}
            </p>
            {details.length > 0 && (
              <p className="truncate text-xs text-slate-600">
                {details.join(" · ")}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>

        {person.bio && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-700">
            {person.bio}
          </p>
        )}

        {tagLabels.length > 0 && (
          <p className="mt-2 text-xs text-slate-600">
            {tagsLabel && (
              <span className="font-medium text-slate-800">{tagsLabel} </span>
            )}
            {tagLabels.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

export default PersonSummary;
