import { Link } from "react-router";
import { Card, ErrorNote } from "../../components/Card";
import { useProfile } from "../../ProfileProvider";
import { FIELDS, labelFor } from "../../profileOptions";
import { TagList, VisibilityBadge } from "./CrewCard";
import type { CrewDetails } from "./crewTypes";

function CrewOverviewCard({
  crew,
  isOwner,
  isMember,
  busy,
  error,
  onEdit,
  onJoin,
}: {
  crew: CrewDetails;
  isOwner: boolean;
  isMember: boolean;
  busy: boolean;
  error: string | null;
  onEdit: () => void;
  onJoin: () => void;
}) {
  const { profile } = useProfile();

  return (
    <Card labelledBy="crew-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1
              id="crew-heading"
              className="text-2xl font-semibold tracking-tight text-slate-900"
            >
              {crew.name}
            </h1>
            <VisibilityBadge visibility={crew.visibility} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {crew.member_count} {crew.member_count === 1 ? "member" : "members"}
          </p>
        </div>

        <div className="flex gap-2">
          {isMember && (
            <Link
              to={`/messages/crew/${crew.id}`}
              className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
            >
              Open chat
            </Link>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={onEdit}
              className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </button>
          )}
          {!isMember && (
            <button
              type="button"
              disabled={busy}
              onClick={onJoin}
              className="cursor-pointer rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:bg-slate-300"
            >
              Join crew
            </button>
          )}
        </div>
      </div>

      {crew.description ? (
        <p className="mt-5 text-sm whitespace-pre-line text-slate-700">
          {crew.description}
        </p>
      ) : (
        <p className="mt-5 text-sm text-slate-500">
          No description yet.
          {isOwner && " Add one so people know what the crew is for."}
        </p>
      )}

      <div className="mt-4">
        <p className="text-sm text-slate-600">
          Focus:{" "}
          <span className="font-medium text-slate-800">
            {labelFor(FIELDS, crew.target_field) ?? "Any work field"}
          </span>
        </p>
        <TagList tags={crew.tags} highlight={profile?.tags} />
      </div>

      <ErrorNote message={error} />
    </Card>
  );
}

export default CrewOverviewCard;
