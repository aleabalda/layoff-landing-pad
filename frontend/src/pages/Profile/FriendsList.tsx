import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card, ErrorNote } from "../../components/Card";
import PersonSummary, {
  type PublicPerson,
} from "../../components/PersonSummary";
import { supabase } from "../../supabaseClient";

type Friend = PublicPerson & { tags: string[]; friends_since: string | null };

function FriendsList() {
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    supabase.rpc("get_friends").then(({ data, error }) => {
      if (!isCurrent) return;
      if (error) setError(error.message);
      else setFriends(data);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const navigate = useNavigate();

  const message = async (userId: string) => {
    setError(null);
    const { data, error } = await supabase.rpc("start_direct_thread", {
      other_user: userId,
    });
    if (error) setError(error.message);
    else navigate(`/messages/direct/${data}`);
  };

  const remove = async (userId: string) => {
    setError(null);
    const { error } = await supabase.rpc("remove_friend", {
      other_user: userId,
    });
    setConfirming(null);
    if (error) setError(error.message);
    else
      setFriends(
        (current) => current?.filter((f) => f.user_id !== userId) ?? null,
      );
  };

  return (
    <Card labelledBy="friends-heading">
      <h2
        id="friends-heading"
        className="font-semibold tracking-tight text-slate-900"
      >
        Friends{friends && friends.length > 0 ? ` (${friends.length})` : ""}
      </h2>

      <ErrorNote message={error} />

      {friends === null && !error && (
        <p className="mt-4 text-sm text-slate-500">Loading...</p>
      )}

      {friends?.length === 0 && (
        <p className="mt-2 text-sm text-slate-500">
          No friends yet. Check "People in a similar spot" on your Today page.
        </p>
      )}

      {friends && friends.length > 0 && (
        <ul className="mt-4 grid gap-x-6 md:grid-cols-2">
          {friends.map((friend) => {
            const name = friend.display_name ?? "this friend";
            return (
              <li
                key={friend.user_id}
                className="border-t border-slate-100 py-4"
              >
                <PersonSummary
                  person={friend}
                  action={
                    confirming === friend.user_id ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Keep
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(friend.user_id)}
                          className="cursor-pointer rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => message(friend.user_id)}
                          aria-label={`Message ${name}`}
                          className="cursor-pointer rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Message
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(friend.user_id)}
                          aria-label={`Remove ${name} from friends`}
                          className="cursor-pointer rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export default FriendsList;
