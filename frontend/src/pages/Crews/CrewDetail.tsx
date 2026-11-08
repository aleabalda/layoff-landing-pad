import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import AppHeader from "../../components/AppHeader";
import { Card } from "../../components/Card";
import { supabase } from "../../supabaseClient";
import CrewForm from "./CrewForm";
import CrewInviteCard from "./CrewInviteCard";
import CrewMembers from "./CrewMembers";
import CrewOverviewCard from "./CrewOverviewCard";
import WorkroomCard from "./WorkroomCard";
import type { CrewDetails, CrewMember, CrewValues } from "./crewTypes";

function CrewDetail() {
  const { crewId = "" } = useParams();
  const navigate = useNavigate();

  const [crew, setCrew] = useState<CrewDetails | null>(null);
  const [members, setMembers] = useState<CrewMember[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false);

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
      <CrewOverviewCard
        crew={crew}
        isOwner={isOwner}
        isMember={isMember}
        busy={busy}
        error={error}
        onEdit={() => setIsEditing(true)}
        onJoin={join}
      />

      {isMember && <WorkroomCard crewId={crew.id} />}

      {isOwner && crew.visibility === "private" && crew.invite_code && (
        <CrewInviteCard
          inviteCode={crew.invite_code}
          busy={busy}
          onNewCode={newCode}
        />
      )}

      <CrewMembers
        members={members}
        isOwner={isOwner}
        isMember={isMember}
        busy={busy}
        onRemoveMember={removeMember}
        onLeave={leave}
        onDelete={remove}
      />
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

export default CrewDetail;
