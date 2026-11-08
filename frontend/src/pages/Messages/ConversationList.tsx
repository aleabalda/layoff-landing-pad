import { useAuth0 } from "@auth0/auth0-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ErrorNote } from "../../components/Card";
import { formatShortTime } from "../../dates";
import { supabase } from "../../supabaseClient";
import {
  type Conversation,
  type ConversationKind,
  conversationPath,
} from "./messageTypes";

type Friend = { user_id: string; display_name: string | null };

function ConversationList({
  activeKind,
  activeId,
  refreshKey,
}: {
  activeKind?: ConversationKind;
  activeId?: string;
  // Bumped by the chat pane after it marks a conversation read.
  refreshKey: number;
}) {
  const { user } = useAuth0();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_conversations");
    if (error) setError(error.message);
    else {
      setError(null);
      setConversations(data);
    }
  }, []);

  useEffect(() => {
    // Fetches on mount, and again whenever refreshKey changes.
    load();
  }, [load, refreshKey]);

  // Any new message the person can read updates previews and unread counts.
  useEffect(() => {
    const channel = supabase
      .channel("conversation-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const startPicking = async () => {
    setIsPicking(true);
    if (friends) return;
    const { data, error } = await supabase.rpc("get_friends");
    if (error) setError(error.message);
    else setFriends(data);
  };

  const messageFriend = async (friendId: string) => {
    const { data, error } = await supabase.rpc("start_direct_thread", {
      other_user: friendId,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setIsPicking(false);
    navigate(conversationPath("direct", data));
  };

  const crews = conversations?.filter((c) => c.kind === "crew") ?? [];
  const directs = conversations?.filter((c) => c.kind === "direct") ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 p-4">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">
          Messages
        </h1>
        <button
          type="button"
          onClick={isPicking ? () => setIsPicking(false) : startPicking}
          className="cursor-pointer rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          {isPicking ? "Cancel" : "New message"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-4">
          <ErrorNote message={error} />
        </div>

        {isPicking && (
          <div className="border-b border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">
              Message a friend
            </p>
            {friends === null ? (
              <p className="mt-2 text-sm text-slate-500">Loading...</p>
            ) : friends.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                You can message people once you're friends. Find people on your{" "}
                <Link
                  to="/home"
                  className="font-medium text-teal-800 underline"
                >
                  Today page
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {friends.map((friend) => (
                  <li key={friend.user_id}>
                    <button
                      type="button"
                      onClick={() => messageFriend(friend.user_id)}
                      className="w-full cursor-pointer rounded-lg px-2 py-1.5 text-left text-sm text-slate-800 hover:bg-white"
                    >
                      {friend.display_name ?? "Friend"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {conversations === null && !error && (
          <p className="p-4 text-sm text-slate-500">Loading...</p>
        )}

        {conversations?.length === 0 && !isPicking && (
          <p className="p-4 text-sm text-slate-500">
            No conversations yet. Join a crew or message a friend to get
            started.
          </p>
        )}

        {directs.length > 0 && (
          <Section heading="Direct messages">
            {directs.map((c) => (
              <Row
                key={c.id}
                conversation={c}
                myId={user?.sub}
                isActive={activeKind === "direct" && activeId === c.id}
              />
            ))}
          </Section>
        )}

        {crews.length > 0 && (
          <Section heading="Crews">
            {crews.map((c) => (
              <Row
                key={c.id}
                conversation={c}
                myId={user?.sub}
                isActive={activeKind === "crew" && activeId === c.id}
              />
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="py-2">
      <h2 className="px-4 pt-2 pb-1 text-xs font-medium tracking-wide text-slate-500 uppercase">
        {heading}
      </h2>
      <ul>{children}</ul>
    </section>
  );
}

function Row({
  conversation: c,
  myId,
  isActive,
}: {
  conversation: Conversation;
  myId?: string;
  isActive: boolean;
}) {
  const title = c.title?.trim() || (c.kind === "crew" ? "Crew" : "Someone");
  const preview = c.last_message
    ? `${
        c.last_sender_id === myId
          ? "You: "
          : c.kind === "crew" && c.last_sender_name
            ? `${c.last_sender_name}: `
            : ""
      }${c.last_message}`
    : "No messages yet";
  const hasUnread = c.unread_count > 0 && !isActive;

  return (
    <li>
      <Link
        to={conversationPath(c.kind, c.id)}
        aria-current={isActive ? "page" : undefined}
        className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
          isActive ? "bg-teal-50" : "hover:bg-slate-50"
        }`}
      >
        <div
          aria-hidden="true"
          className={`flex size-9 shrink-0 items-center justify-center text-sm font-semibold ${
            c.kind === "crew"
              ? "rounded-lg bg-slate-200 text-slate-700"
              : "rounded-full bg-teal-100 text-teal-800"
          }`}
        >
          {title.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={`truncate text-sm ${
                hasUnread
                  ? "font-semibold text-slate-900"
                  : "font-medium text-slate-800"
              }`}
            >
              {title}
            </p>
            {c.last_message && c.last_activity_at && (
              <span className="shrink-0 text-[11px] text-slate-500">
                {formatShortTime(c.last_activity_at)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p
              className={`truncate text-xs ${
                hasUnread ? "text-slate-800" : "text-slate-500"
              }`}
            >
              {preview}
            </p>
            {hasUnread && (
              <span className="shrink-0 rounded-full bg-teal-700 px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                {c.unread_count > 99 ? "99+" : c.unread_count}
                <span className="sr-only"> unread</span>
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}

export default ConversationList;
