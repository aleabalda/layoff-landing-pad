import type { ReactNode } from "react";
import { Link } from "react-router";
import { ALL_TAGS, labelFor } from "../../profileOptions";
import type { CrewSummary } from "./crewTypes";

export function VisibilityBadge({ visibility }: { visibility: string }) {
  return visibility === "private" ? (
    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-white">
      🔒 Private
    </span>
  ) : (
    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-900">
      Public
    </span>
  );
}

export function TagList({
  tags,
  highlight = [],
}: {
  tags: string[];
  highlight?: string[];
}) {
  if (tags.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Interests">
      {tags.map((tag) => {
        const isShared = highlight.includes(tag);
        return (
          <li
            key={tag}
            className={`rounded-full px-2.5 py-0.5 text-xs ${
              isShared
                ? "bg-teal-100 text-teal-900"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {isShared && <span className="sr-only">Shared interest: </span>}
            {labelFor(ALL_TAGS, tag) ?? tag}
          </li>
        );
      })}
    </ul>
  );
}

function CrewCard({
  crew,
  myTags,
  action,
}: {
  crew: CrewSummary;
  myTags: string[];
  action?: ReactNode;
}) {
  return (
    <li className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/crews/${crew.id}`}
          className="min-w-0 font-semibold tracking-tight text-slate-900 hover:underline"
        >
          {crew.name}
        </Link>
        <VisibilityBadge visibility={crew.visibility} />
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {crew.member_count} {crew.member_count === 1 ? "member" : "members"}
        {crew.my_role === "owner" && " · You run this crew"}
      </p>
      {crew.description && (
        <p className="mt-3 line-clamp-3 text-sm text-slate-700">
          {crew.description}
        </p>
      )}
      <div className="mt-3">
        <TagList tags={crew.tags} highlight={myTags} />
      </div>
      {action && <div className="mt-auto pt-4">{action}</div>}
    </li>
  );
}

export default CrewCard;
