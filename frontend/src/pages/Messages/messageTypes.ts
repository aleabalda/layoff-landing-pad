export type ConversationKind = "crew" | "direct";

export type Conversation = {
  kind: ConversationKind;
  id: string;
  title: string | null;
  other_user_id: string | null;
  last_message: string | null;
  last_sender_id: string | null;
  last_sender_name: string | null;
  last_activity_at: string | null;
  unread_count: number;
};

export type Message = {
  id: string;
  sender_id: string | null;
  sender_name: string | null;
  body: string;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
  created_at: string;
};

// Must match the check in supabase/migrations/20261108030000_messages.sql.
export const MESSAGE_MAX_LENGTH = 2000;

// The RPC arguments that pick one conversation.
export function conversationArgs(kind: ConversationKind, id: string) {
  return kind === "crew"
    ? { target_crew: id, target_thread: null }
    : { target_crew: null, target_thread: id };
}

export function conversationPath(kind: ConversationKind, id: string) {
  return `/messages/${kind}/${id}`;
}
