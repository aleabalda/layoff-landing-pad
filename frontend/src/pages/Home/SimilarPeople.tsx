import { useEffect, useState } from "react";
import { ErrorNote } from "../../components/Card";
import PersonSummary, {
  type PublicPerson,
} from "../../components/PersonSummary";
import { supabase } from "../../supabaseClient";

type Suggestion = PublicPerson & { shared_tags: string[]; score: number };

// What happened after clicking "Add friend". `accepted` means they had already
// sent a request, so adding them back made you friends.
type RequestState = "sending" | "pending" | "accepted";

function SimilarPeople({ className = "" }: { className?: string }) {
  const [people, setPeople] = useState<Suggestion[] | null>(null);
  const [requests, setRequests] = useState<Record<string, RequestState>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    supabase
      .rpc("suggest_people", { max_results: 4 })
      .then(({ data, error }) => {
        if (!isCurrent) return;
        if (error) setError(error.message);
        else setPeople(data);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const setRequest = (userId: string, state: RequestState | null) =>
    setRequests((current) => {
      const next = { ...current };
      if (state) next[userId] = state;
      else delete next[userId];
      return next;
    });

  const addFriend = async (userId: string) => {
    setError(null);
    setRequest(userId, "sending");

    const { data, error } = await supabase.rpc("send_friend_request", {
      to_user: userId,
    });

    if (error) {
      setError(error.message);
      setRequest(userId, null);
    } else {
      setRequest(userId, data === "accepted" ? "accepted" : "pending");
    }
  };

  const cancelRequest = async (userId: string) => {
    setError(null);
    const { error } = await supabase.rpc("remove_friend", {
      other_user: userId,
    });
    if (error) setError(error.message);
    else setRequest(userId, null);
  };

  return (
    <section
      aria-labelledby="similar-heading"
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      <h2
        id="similar-heading"
        className="font-semibold tracking-tight text-slate-900"
      >
        People in a similar spot
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Matched on your field and the tags you picked.
      </p>

      <ErrorNote message={error} />

      {people === null && !error && (
        <p className="mt-4 text-sm text-slate-500">Loading...</p>
      )}

      {people?.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          No one to suggest yet. As more people join, they'll show up here.
        </p>
      )}

      {people && people.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100">
          {people.map((person) => {
            const state = requests[person.user_id];
            return (
              <li key={person.user_id} className="py-4 first:pt-0 last:pb-0">
                <PersonSummary
                  person={person}
                  tags={person.shared_tags}
                  tagsLabel="You both picked:"
                  action={
                    state === "accepted" ? (
                      <span className="text-sm font-medium text-teal-800">
                        ✓ Friends
                      </span>
                    ) : state === "pending" ? (
                      <button
                        type="button"
                        onClick={() => cancelRequest(person.user_id)}
                        className="group cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <span className="group-hover:hidden">Request sent</span>
                        <span className="hidden group-hover:inline">
                          Cancel request
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={state === "sending"}
                        onClick={() => addFriend(person.user_id)}
                        aria-label={`Add ${person.display_name ?? "this person"} as a friend`}
                        className="cursor-pointer rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:bg-slate-300"
                      >
                        {state === "sending" ? "Sending..." : "Add friend"}
                      </button>
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default SimilarPeople;
