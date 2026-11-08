import { useAuth0 } from "@auth0/auth0-react";
import {
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router";
import { formatClockTime, formatDayHeading, localDate } from "../../dates";
import { supabase } from "../../supabaseClient";
import WorkroomBanner from "../Workroom/WorkroomBanner";
import AttachmentView from "./AttachmentView";
import {
  ATTACHMENT_ACCEPT,
  checkAttachment,
  formatBytes,
  isImage,
  uploadAttachment,
  useSignedUrls,
} from "./attachments";
import {
  type ConversationKind,
  MESSAGE_MAX_LENGTH,
  type Message,
  conversationArgs,
} from "./messageTypes";

const PAGE_SIZE = 50;

type Header = {
  title: string;
  subtitle: string | null;
  link: string | null;
  canSend: boolean;
  cannotSendReason: string | null;
};

function ChatPane({
  kind,
  id,
  onRead,
}: {
  kind: ConversationKind;
  id: string;
  onRead: () => void;
}) {
  const { user } = useAuth0();
  const myId = user?.sub;

  const [header, setHeader] = useState<Header | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [hasOlder, setHasOlder] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachmentUrls = useSignedUrls(
    messages.flatMap((m) => (m.attachment_path ? [m.attachment_path] : [])),
  );

  // A local preview of an image before it's sent.
  useEffect(() => {
    if (!file || !isImage(file.type)) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const chooseFile = (chosen: File | undefined) => {
    if (!chosen) return;
    const problem = checkAttachment(chosen);
    setSendError(problem);
    setFile(problem ? null : chosen);
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    chooseFile(event.target.files?.[0]);
    // Lets the same file be picked again after removing it.
    event.target.value = "";
  };

  // Pasting a screenshot attaches it.
  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = event.clipboardData.files[0];
    if (pasted) {
      event.preventDefault();
      chooseFile(pasted);
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const keepScrollFrom = useRef<number | null>(null);

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

    const loadHeader = async (): Promise<Header> => {
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

  // Stay pinned to the newest message unless the person scrolled up, and keep
  // their place when older messages load above.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (keepScrollFrom.current !== null) {
      el.scrollTop = el.scrollHeight - keepScrollFrom.current;
      keepScrollFrom.current = null;
    } else if (stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (el)
      stickToBottom.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const loadOlder = async () => {
    const oldest = messages[0];
    if (!oldest) return;
    const { data, error } = await supabase.rpc("get_messages", {
      ...conversationArgs(kind, id),
      older_than: oldest.created_at,
      max_results: PAGE_SIZE,
    });
    if (error) {
      setSendError(error.message);
      return;
    }
    const el = scrollRef.current;
    if (el) keepScrollFrom.current = el.scrollHeight - el.scrollTop;
    setMessages((current) => [
      ...[...(data as Message[])].reverse(),
      ...current,
    ]);
    setHasOlder(data.length === PAGE_SIZE);
  };

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const body = draft.trim();
    if ((!body && !file) || isSending) return;

    setIsSending(true);
    setSendError(null);

    let attachmentPath: string | null = null;
    if (file) {
      try {
        attachmentPath = await uploadAttachment(kind, id, file);
      } catch (err) {
        setIsSending(false);
        setSendError(
          `Couldn't upload the file: ${err instanceof Error ? err.message : String(err)}`,
        );
        return;
      }
    }

    const { data, error } = await supabase
      .rpc("send_message", {
        message: body,
        ...conversationArgs(kind, id),
        new_attachment_path: attachmentPath,
        new_attachment_name: file?.name ?? null,
      })
      .single<Message>();
    setIsSending(false);

    if (error) {
      setSendError(error.message);
      return;
    }

    setDraft("");
    setFile(null);
    stickToBottom.current = true;
    setMessages((current) =>
      current.some((m) => m.id === data.id) ? current : [...current, data],
    );
  };

  // Enter sends, Shift+Enter adds a new line.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      send();
    }
  };

  if (loadError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-slate-700">
          We couldn't open this conversation. ({loadError})
        </p>
        <Link
          to="/messages"
          className="text-sm font-medium text-teal-800 underline"
        >
          Back to messages
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <Link
          to="/messages"
          aria-label="Back to conversations"
          className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold tracking-tight text-slate-900">
            {header?.title ?? "Loading..."}
          </h2>
          {header?.subtitle && (
            <p className="text-xs text-slate-500">
              {header.subtitle}
              {header.link && (
                <>
                  {" · "}
                  <Link to={header.link} className="underline">
                    Crew details
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
        {kind === "crew" && (
          <Link
            to={`/crews/${id}/workroom`}
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Workroom
          </Link>
        )}
      </div>

      {kind === "crew" && <WorkroomBanner crewId={id} />}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-label="Messages"
      >
        {hasOlder && (
          <div className="mb-4 text-center">
            <button
              type="button"
              onClick={loadOlder}
              className="cursor-pointer rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Load earlier messages
            </button>
          </div>
        )}

        {header && messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-slate-500">
            No messages yet. Say hello 👋
          </p>
        )}

        <ol className="space-y-1">
          {messages.map((message, index) => {
            const previous = messages[index - 1];
            const isMine = message.sender_id === myId;
            const newDay =
              !previous ||
              localDate(new Date(previous.created_at)) !==
                localDate(new Date(message.created_at));
            const showName =
              kind === "crew" &&
              !isMine &&
              (newDay || previous?.sender_id !== message.sender_id);
            const name =
              message.sender_name ??
              (message.sender_id ? names[message.sender_id] : null) ??
              "Someone";

            return (
              <li key={message.id}>
                {newDay && (
                  <p className="my-4 text-center text-xs font-medium text-slate-500">
                    {formatDayHeading(message.created_at)}
                  </p>
                )}
                <div
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"} ${
                    showName ? "mt-3" : ""
                  }`}
                >
                  {showName && (
                    <span className="mb-0.5 px-1 text-xs font-medium text-slate-600">
                      {name}
                    </span>
                  )}
                  <span className="sr-only">{isMine ? "You" : name}: </span>
                  {message.attachment_path && (
                    <AttachmentView
                      message={message}
                      url={attachmentUrls[message.attachment_path]}
                      isMine={isMine}
                      onLoad={() => {
                        // Images change the height once loaded.
                        const el = scrollRef.current;
                        if (el && stickToBottom.current)
                          el.scrollTop = el.scrollHeight;
                      }}
                    />
                  )}
                  {message.body.trim() && (
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm break-words whitespace-pre-wrap ${
                        message.attachment_path ? "mt-1" : ""
                      } ${
                        isMine
                          ? "rounded-br-md bg-teal-700 text-white"
                          : "rounded-bl-md bg-slate-100 text-slate-900"
                      }`}
                    >
                      {message.body}
                    </div>
                  )}
                  <time
                    dateTime={message.created_at}
                    className="mt-0.5 px-1 text-[11px] text-slate-400"
                  >
                    {formatClockTime(message.created_at)}
                  </time>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="border-t border-slate-200 p-3">
        {header && !header.canSend ? (
          <p className="px-1 py-2 text-sm text-slate-500">
            {header.cannotSendReason}
          </p>
        ) : (
          <form onSubmit={send}>
            {file && (
              <div className="mb-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
                {filePreview ? (
                  <img
                    src={filePreview}
                    alt=""
                    className="size-12 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex size-12 items-center justify-center rounded-lg bg-red-50 text-xs font-semibold text-red-700"
                  >
                    PDF
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  disabled={isSending}
                  aria-label={`Remove ${file.name}`}
                  className="cursor-pointer rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={ATTACHMENT_ACCEPT}
                onChange={handleFileInput}
                className="hidden"
                tabIndex={-1}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!header || isSending}
                aria-label="Attach an image or PDF"
                title="Attach an image or PDF"
                className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                >
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <label htmlFor="message-input" className="sr-only">
                Write a message
              </label>
              <textarea
                id="message-input"
                rows={1}
                value={draft}
                maxLength={MESSAGE_MAX_LENGTH}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={
                  file ? "Add a message (optional)" : "Write a message"
                }
                disabled={!header}
                className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 [field-sizing:content] focus:border-teal-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={(!draft.trim() && !file) || isSending || !header}
                className="h-10 cursor-pointer rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        )}
        {sendError && (
          <p role="alert" className="mt-2 px-1 text-sm text-red-700">
            {sendError}
          </p>
        )}
      </div>
    </div>
  );
}

export default ChatPane;
