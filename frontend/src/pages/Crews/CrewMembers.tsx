import { useState } from "react";
import { Card } from "../../components/Card";
import { EXPERIENCE_LEVELS, FIELDS, labelFor } from "../../profileOptions";
import type { CrewMember } from "./crewTypes";

function CrewMembers({
  members,
  isOwner,
  isMember,
  busy,
  onRemoveMember,
  onLeave,
  onDelete,
}: {
  members: CrewMember[];
  isOwner: boolean;
  isMember: boolean;
  busy: boolean;
  onRemoveMember: (userId: string) => void;
  onLeave: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <Card labelledBy="members-heading">
        <h2
          id="members-heading"
          className="font-semibold tracking-tight text-slate-900"
        >
          Members
        </h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {members.map((member) => {
            const name = member.display_name?.trim() || "Someone";
            const details = [
              labelFor(FIELDS, member.field),
              labelFor(EXPERIENCE_LEVELS, member.experience_level),
              member.city,
            ].filter(Boolean);
            return (
              <li
                key={member.user_id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800"
                  >
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {name}
                      {member.role === "owner" && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          Owner
                        </span>
                      )}
                    </p>
                    {details.length > 0 && (
                      <p className="truncate text-xs text-slate-600">
                        {details.join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                {isOwner && member.role !== "owner" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onRemoveMember(member.user_id)}
                    aria-label={`Remove ${name} from the crew`}
                    className="cursor-pointer rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {isMember && (
        <LeaveOrDelete
          isOwner={isOwner}
          hasOtherMembers={members.length > 1}
          busy={busy}
          onLeave={onLeave}
          onDelete={onDelete}
        />
      )}
    </>
  );
}

function LeaveOrDelete({
  isOwner,
  hasOtherMembers,
  busy,
  onLeave,
  onDelete,
}: {
  isOwner: boolean;
  hasOtherMembers: boolean;
  busy: boolean;
  onLeave: () => void;
  onDelete: () => void;
}) {
  const [confirm, setConfirm] = useState<"leave" | "delete" | null>(null);

  return (
    <div className="flex flex-wrap justify-end gap-3 px-1">
      {confirm ? (
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
          <span className="text-slate-700">
            {confirm === "delete"
              ? "Delete this crew for everyone? This can't be undone."
              : isOwner && hasOtherMembers
                ? "Leave? The longest-standing member will become the owner."
                : isOwner
                  ? "You're the only member, so leaving deletes the crew."
                  : "Leave this crew?"}
          </span>
          <button
            type="button"
            onClick={() => setConfirm(null)}
            className="cursor-pointer rounded-lg px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={confirm === "delete" ? onDelete : onLeave}
            className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {confirm === "delete" ? "Delete crew" : "Leave crew"}
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setConfirm("leave")}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Leave crew
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={() => setConfirm("delete")}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Delete crew
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default CrewMembers;
