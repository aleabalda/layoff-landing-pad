import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import AppHeader from "../../components/AppHeader";
import { ErrorNote } from "../../components/Card";
import { useProfile } from "../../ProfileProvider";
import { ALL_TAGS } from "../../profileOptions";
import { supabase } from "../../supabaseClient";
import CrewCard from "./CrewCard";
import CrewForm from "./CrewForm";
import type { CrewSummary, CrewValues } from "./crewTypes";

function Crews() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const myTags = profile?.tags ?? [];

  const [crews, setCrews] = useState<CrewSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    supabase.rpc("list_crews").then(({ data, error }) => {
      if (!isCurrent) return;
      if (error) setError(error.message);
      else setCrews(data);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const createGroup = async (values: CrewValues) => {
    const { data, error } = await supabase.rpc("create_crew", {
      new_name: values.name,
      new_description: values.description,
      new_visibility: values.visibility,
      new_tags: values.tags,
    });
    if (error) return error.message;
    navigate(`/crews/${data}`);
    return null;
  };

  const join = async (crewId: string) => {
    setJoining(crewId);
    setError(null);
    const { error } = await supabase.rpc("join_crew", {
      target_crew: crewId,
    });
    setJoining(null);
    if (error) setError(error.message);
    else navigate(`/crews/${crewId}`);
  };

  const mine = crews?.filter((crew) => crew.my_role) ?? [];
  const sharedCount = (crew: CrewSummary) =>
    crew.tags.filter((tag) => myTags.includes(tag)).length;

  // Groups that share the most of the person's tags come first.
  const discover = (crews ?? [])
    .filter((crew) => !crew.my_role)
    .sort((a, b) => sharedCount(b) - sharedCount(a));
  const filterTags = ALL_TAGS.filter((tag) =>
    discover.some((crew) => crew.tags.includes(tag.value)),
  );
  const shown = tagFilter
    ? discover.filter((crew) => crew.tags.includes(tagFilter))
    : discover;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      {/*
        Full width. The title, "Create a crew" and the invite code sit on the
        left; your crews, then public crews, fill the rest. Phones stack them.
      */}
      <main className="grid items-start gap-8 px-4 pb-12 sm:px-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="space-y-5 pt-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Crews
            </h1>
            <p className="mt-2 text-slate-600">
              Find people who share your interests, or start your own crew.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            disabled={isCreating}
            className="w-full cursor-pointer rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-default disabled:bg-slate-300"
          >
            {isCreating ? "Creating a crew..." : "Create a crew"}
          </button>
          <JoinWithCode />
        </aside>

        <div className="min-w-0 space-y-8 lg:pt-4">
          {isCreating && (
            <CrewForm
              title="Create a crew"
              submitLabel="Create crew"
              onSubmit={createGroup}
              onCancel={() => setIsCreating(false)}
            />
          )}

          <ErrorNote message={error} />

          {crews === null && !error && (
            <p className="text-sm text-slate-500">Loading...</p>
          )}

          {crews && (
            <>
              <section aria-labelledby="my-crews-heading">
                <h2
                  id="my-crews-heading"
                  className="text-lg font-semibold tracking-tight text-slate-900"
                >
                  Your crews
                </h2>
                {mine.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    You haven't joined any crews yet.
                  </p>
                ) : (
                  <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {mine.map((crew) => (
                      <CrewCard key={crew.id} crew={crew} myTags={myTags} />
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="discover-heading">
                <h2
                  id="discover-heading"
                  className="text-lg font-semibold tracking-tight text-slate-900"
                >
                  Discover public crews
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Interests you share are highlighted.
                </p>

                {filterTags.length > 0 && (
                  <div
                    role="group"
                    aria-label="Filter by interest"
                    className="mt-4 flex flex-wrap gap-2"
                  >
                    {[{ value: null, label: "All" }, ...filterTags].map(
                      ({ value, label }) => (
                        <button
                          key={value ?? "all"}
                          type="button"
                          aria-pressed={tagFilter === value}
                          onClick={() => setTagFilter(value)}
                          className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors ${
                            tagFilter === value
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {label}
                        </button>
                      ),
                    )}
                  </div>
                )}

                {shown.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">
                    {discover.length === 0
                      ? "No other public crews yet. Why not start one?"
                      : "No crews with that interest yet."}
                  </p>
                ) : (
                  <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {shown.map((crew) => (
                      <CrewCard
                        key={crew.id}
                        crew={crew}
                        myTags={myTags}
                        action={
                          <button
                            type="button"
                            disabled={joining === crew.id}
                            onClick={() => join(crew.id)}
                            aria-label={`Join ${crew.name}`}
                            className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {joining === crew.id ? "Joining..." : "Join"}
                          </button>
                        }
                      />
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function JoinWithCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;

    setIsJoining(true);
    setError(null);
    const { data, error } = await supabase.rpc("join_crew_by_code", {
      code: code.trim(),
    });
    setIsJoining(false);

    if (error) setError(error.message);
    else navigate(`/crews/${data}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-dashed border-slate-300 bg-white p-5"
    >
      <label
        htmlFor="invite-code"
        className="text-sm font-medium text-slate-900"
      >
        Got an invite code for a private crew?
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="invite-code"
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="e.g. 4F9A1C27B3"
          autoComplete="off"
          className="w-full min-w-0 rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm tracking-wider text-slate-900 uppercase placeholder:tracking-normal placeholder:normal-case focus:border-teal-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isJoining || !code.trim()}
          className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isJoining ? "Joining..." : "Join"}
        </button>
      </div>
      <ErrorNote message={error} />
    </form>
  );
}

export default Crews;
