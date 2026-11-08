import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import AppHeader from "../../components/AppHeader";
import { Card, ErrorNote } from "../../components/Card";
import { useProfile } from "../../ProfileProvider";
import { EXPERIENCE_LEVELS, FIELDS, labelFor } from "../../profileOptions";
import { supabase } from "../../supabaseClient";
import { TagList, VisibilityBadge } from "./CrewCard";
import CrewForm from "./CrewForm";
import type { CrewDetails, CrewMember, CrewValues } from "./crewTypes";

function CrewDetail() {
  const { crewId = "" } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();

  const [crew, setCrew] = useState<CrewDetails | null>(null);
  const [members, setMembers] = useState<CrewMember[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"leave" | "delete" | null>(null);

  const load = useCallback(async () => {
    const [crewResult, membersResult] = await Promise.all([
      supabase.rpc("get_crew", { target_crew: crewId }).single(),
      supabase.rpc("get_crew_members", { target_crew: crewId }),
    ]);
    if (crewResult.error) throw crewResult.error;
    if (membersResult.error) throw membersResult.error;
    return {
      crew: crewResult.data as CrewDetails,
      members: membersResult.data as CrewMember[],
    };
  }, [crewId]);

  const refresh = useCallback(async () => {
    try {
      const result = await load();
      setCrew(result.crew);
      setMembers(result.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [load]);

  useEffect(() => {
    let isCurrent = true;

    load()
      .then((result) => {
        if (!isCurrent) return;
        setCrew(result.crew);
        setMembers(result.members);
      })
      .catch(
        (err) =>
          isCurrent &&
          setLoadError(err instanceof Error ? err.message : String(err)),
      );

    return () => {
      isCurrent = false;
    };
  }, [load]);

  // Runs one change, then reloads the crew. Returns false if it failed.
  const run = async (
    fn: string,
    args: Record<string, unknown>,
  ): Promise<boolean> => {
    setBusy(true);
    setError(null);
    const { error } = await supabase.rpc(fn, args);
    setBusy(false);
    if (error) {
      setError(error.message);
      return false;
    }
    return true;
  };

  const join = async () => {
    if (await run("join_crew", { target_crew: crewId })) await refresh();
  };

  const leave = async () => {
    if (await run("leave_crew", { target_crew: crewId })) navigate("/crews");
  };

  const remove = async () => {
    if (await run("delete_crew", { target_crew: crewId })) navigate("/crews");
  };

  const removeMember = async (member: string) => {
    if (await run("remove_crew_member", { target_crew: crewId, member }))
      await refresh();
  };

  const newCode = async () => {
    if (await run("regenerate_invite_code", { target_crew: crewId }))
      await refresh();
  };

  const save = async (values: CrewValues) => {
    const { error } = await supabase.rpc("update_crew", {
      target_crew: crewId,
      new_name: values.name,
      new_description: values.description,
      new_visibility: values.visibility,
      new_tags: values.tags,
      new_target_field: values.target_field,
    });
    if (error) return error.message;
    await refresh();
    setIsEditing(false);
    return null;
  };

  if (loadError) {
    return (
      <Shell>
        <Card labelledBy="missing-heading">
          <h1
            id="missing-heading"
            className="text-xl font-semibold text-slate-900"
          >
            We couldn't open this crew
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            It may be private, or it may have been deleted. ({loadError})
          </p>
          <Link
            to="/crews"
            className="mt-4 inline-block text-sm font-medium text-teal-800 underline"
          >
            Back to crews
          </Link>
        </Card>
      </Shell>
    );
  }

  if (!crew) {
    return (
      <Shell>
        <p className="text-sm text-slate-500">Loading...</p>
      </Shell>
    );
  }

  const isOwner = crew.my_role === "owner";
  const isMember = crew.my_role !== null;
  const otherMembers = members.length - (isMember ? 1 : 0);

  if (isEditing) {
    return (
      <Shell>
        <CrewForm
          title="Edit crew"
          submitLabel="Save changes"
          initial={{
            name: crew.name,
            description: crew.description ?? "",
            visibility: crew.visibility,
            tags: crew.tags,
            target_field: crew.target_field ?? "",
          }}
          onSubmit={save}
          onCancel={() => setIsEditing(false)}
        />
      </Shell>
    );
  }

  return (
    <Shell>
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
              {crew.member_count}{" "}
              {crew.member_count === 1 ? "member" : "members"}
            </p>
          </div>

          <div className="flex gap-2">
            {isMember && (
              <Link
                to={`/messages/crew/${crew.id}`}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                Open chat
              </Link>
            )}
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit
              </button>
            )}
            {!isMember && (
              <button
                type="button"
                disabled={busy}
                onClick={join}
                className="cursor-pointer rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-300"
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

      {isOwner && crew.visibility === "private" && crew.invite_code && (
        <Card labelledBy="invite-heading">
          <h2
            id="invite-heading"
            className="font-semibold tracking-tight text-slate-900"
          >
            Invite people
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Share this code. People enter it on the Crews page to join.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <code className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-lg tracking-widest text-slate-900">
              {crew.invite_code}
            </code>
            <CopyButton text={crew.invite_code} />
            <button
              type="button"
              disabled={busy}
              onClick={newCode}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            >
              New code
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            A new code stops the old one from working. People already in the
            crew stay in.
          </p>
        </Card>
      )}

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
                    onClick={() => removeMember(member.user_id)}
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
        <div className="flex flex-wrap justify-end gap-3 px-1">
          {confirm ? (
            <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
              <span className="text-slate-700">
                {confirm === "delete"
                  ? "Delete this crew for everyone? This can't be undone."
                  : isOwner && otherMembers > 0
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
                onClick={confirm === "delete" ? remove : leave}
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
      )}
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-4xl space-y-5 px-4 pb-12">
        <Link
          to="/crews"
          className="inline-block pt-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← All crews
        </Link>
        {children}
      </main>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      <span aria-live="polite">{copied ? "Copied ✓" : "Copy"}</span>
    </button>
  );
}

export default CrewDetail;
