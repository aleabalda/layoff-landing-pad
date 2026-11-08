import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  type ConversationKind,
  type Message,
  conversationArgs,
} from "./messageTypes";

const PAGE_SIZE = 50;

export type ConversationHeader = {
  title: string;
  subtitle: string | null;
  link: string | null;
  canSend: boolean;
  cannotSendReason: string | null;
};

// Loads one conversation and keeps it up to date as messages arrive.
function useConversation(
  kind: ConversationKind,
  id: string,
  myId: string | undefined,
  onRead: () => void,
) {
  const [header, setHeader] = useState<ConversationHeader | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [hasOlder, setHasOlder] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const markRead = useCallback(async () => {
    const { error } = await supabase.rpc(
      "mark_conversation_read",
      conversationArgs(kind, id),
    );
    if (!error) onRead();
  }, [kind, id, onRead]);

  // Names of everyone who can post here, for messages that arrive live.
  const loadNames = useCallback(async () => {
    if (kind !== "crew") return;
    const { data } = await supabase.rpc("get_crew_members", {
      target_crew: id,
    });
    if (data) {
      setNames(
        Object.fromEntries(
          data.map((m: { user_id: string; display_name: string | null }) => [
            m.user_id,
            m.display_name ?? "Someone",
          ]),
        ),
      );
    }
  }, [kind, id]);

  // Load the conversation's header and latest messages.
  useEffect(() => {
    // The parent remounts this pane per conversation, so state starts empty.
    let isCurrent = true;

    const loadHeader = async (): Promise<ConversationHeader> => {
      if (kind === "crew") {
        const { data, error } = await supabase
          .rpc("get_crew", { target_crew: id })
          .single<{
            name: string;
            member_count: number;
            my_role: string | null;
          }>();
        if (error) throw error;
        return {
          title: data.name,
          subtitle: `${data.member_count} ${data.member_count === 1 ? "member" : "members"}`,
          link: `/crews/${id}`,
          canSend: data.my_role !== null,
          cannotSendReason: "Join the crew to send messages.",
        };
      }
      const { data, error } = await supabase
        .rpc("get_direct_thread", { target_thread: id })
        .single<{
          other_user_id: string;
          display_name: string | null;
          can_send: boolean;
        }>();
      if (error) throw error;
      setNames((current) => ({
        ...current,
        [data.other_user_id]: data.display_name ?? "Someone",
      }));
      return {
        title: data.display_name ?? "Someone",
        subtitle: null,
        link: null,
        canSend: data.can_send,
        cannotSendReason:
          "You're no longer friends, so you can't send new messages here.",
      };
    };

    Promise.all([
      loadHeader(),
      supabase.rpc("get_messages", {
        ...conversationArgs(kind, id),
        max_results: PAGE_SIZE,
      }),
      loadNames(),
    ])
      .then(([loadedHeader, result]) => {
        if (!isCurrent) return;
        if (result.error) throw result.error;
        setHeader(loadedHeader);
        setMessages([...(result.data as Message[])].reverse());
        setHasOlder(result.data.length === PAGE_SIZE);
        markRead();
      })
      .catch((err) => {
        if (isCurrent)
          setLoadError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      isCurrent = false;
    };
  }, [kind, id, loadNames, markRead]);

  // New messages arrive live through Supabase Realtime.
  useEffect(() => {
    const column = kind === "crew" ? "crew_id" : "thread_id";
    const channel = supabase
      .channel(`chat:${kind}:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `${column}=eq.${id}`,
        },
        (payload) => {
          const row = payload.new as Message;
          setMessages((current) =>
            current.some((m) => m.id === row.id) ? current : [...current, row],
          );
          if (row.sender_id !== myId) markRead();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kind, id, myId, markRead]);

  // Someone new posted in a crew: fetch the member list again for their
  // name. Each unknown sender is only looked up once, since someone who has
  // left the crew won't be in the list.
  const lookedUp = useRef(new Set<string>());
  useEffect(() => {
    if (kind !== "crew") return;
    const unknown = messages
      .map((m) => m.sender_id)
      .filter(
        (sender): sender is string =>
          !!sender && !(sender in names) && !lookedUp.current.has(sender),
      );
    if (unknown.length === 0) return;
    unknown.forEach((sender) => lookedUp.current.add(sender));
    loadNames();
  }, [kind, messages, names, loadNames]);

  // Returns an error message if it failed. `beforePrepend` runs just before
  // the older messages go in, so the caller can remember its scroll position.
  const loadOlder = async (
    beforePrepend: () => void,
  ): Promise<string | null> => {
    const oldest = messages[0];
    if (!oldest) return null;
    const { data, error } = await supabase.rpc("get_messages", {
      ...conversationArgs(kind, id),
      older_than: oldest.created_at,
      max_results: PAGE_SIZE,
    });
    if (error) return error.message;
    beforePrepend();
    setMessages((current) => [
      ...[...(data as Message[])].reverse(),
      ...current,
    ]);
    setHasOlder(data.length === PAGE_SIZE);
    return null;
  };

  const addMessage = (message: Message) => {
    setMessages((current) =>
      current.some((m) => m.id === message.id) ? current : [...current, message],
    );
  };

  return { header, messages, names, hasOlder, loadError, loadOlder, addMessage };
}

export default useConversation;
