import { useEffect, useState } from "react";
import { ErrorNote } from "../../components/Card";
import PersonSummary, {
  type PublicPerson,
} from "../../components/PersonSummary";
import { supabase } from "../../supabaseClient";

type Request = PublicPerson & {
  request_id: string;
  shared_tags: string[];
  sent_at: string;
};

// Shows nothing when there are no pending requests.
function FriendRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    supabase.rpc("get_friend_requests").then(({ data, error }) => {
      if (!isCurrent) return;
      if (error) setError(error.message);
      else setRequests(data);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const respond = async (request: Request, accept: boolean) => {
    setBusy(request.request_id);
    setError(null);

    const { error } = await supabase.rpc("respond_to_friend_request", {
      request_id: request.request_id,
      accept,
    });

    setBusy(null);

    if (error) {
      setError(error.message);
    } else if (accept) {
      setAccepted((current) => [...current, request.request_id]);
    } else {
      setRequests((current) =>
        current.filter((r) => r.request_id !== request.request_id),
      );
    }
  };

  if (requests.length === 0 && !error) return null;

  return (
    <section
      aria-labelledby="requests-heading"
      className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm"
    >
      <h2
        id="requests-heading"
        className="font-semibold tracking-tight text-slate-900"
      >
        Friend requests
      </h2>

      <ErrorNote message={error} />

      <ul className="mt-4 divide-y divide-slate-100">
        {requests.map((request) => {
          const isAccepted = accepted.includes(request.request_id);
          const name = request.display_name ?? "this person";
          return (
            <li key={request.request_id} className="py-4 first:pt-0 last:pb-0">
              <PersonSummary
                person={request}
                tags={request.shared_tags}
                tagsLabel="You both picked:"
                action={
                  isAccepted ? (
                    <span className="text-sm font-medium text-teal-800">
                      ✓ Friends
                    </span>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy === request.request_id}
                        onClick={() => respond(request, false)}
                        aria-label={`Decline request from ${name}`}
                        className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        disabled={busy === request.request_id}
                        onClick={() => respond(request, true)}
                        aria-label={`Accept request from ${name}`}
                        className="cursor-pointer rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                      >
                        Accept
                      </button>
                    </div>
                  )
                }
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default FriendRequests;
