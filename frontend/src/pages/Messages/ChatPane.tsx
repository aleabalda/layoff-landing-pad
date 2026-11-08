import { useAuth0 } from "@auth0/auth0-react";
import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import WorkroomBanner from "../Workroom/WorkroomBanner";
import ChatHeader from "./ChatHeader";
import MessageComposer from "./MessageComposer";
import MessageList from "./MessageList";
import type { ConversationKind, Message } from "./messageTypes";
import useConversation from "./useConversation";

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

  const { header, messages, names, hasOlder, loadError, loadOlder, addMessage } =
    useConversation(kind, id, myId, onRead);
  const [sendError, setSendError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const keepScrollFrom = useRef<number | null>(null);

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

  const handleLoadOlder = async () => {
    const problem = await loadOlder(() => {
      const el = scrollRef.current;
      if (el) keepScrollFrom.current = el.scrollHeight - el.scrollTop;
    });
    if (problem) setSendError(problem);
  };

  // Images change the height once loaded.
  const handleAttachmentLoad = () => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  };

  const handleSent = (message: Message) => {
    stickToBottom.current = true;
    addMessage(message);
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
      <ChatHeader header={header} kind={kind} id={id} />

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
              onClick={handleLoadOlder}
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

        <MessageList
          messages={messages}
          names={names}
          myId={myId}
          kind={kind}
          onAttachmentLoad={handleAttachmentLoad}
        />
      </div>

      <div className="border-t border-slate-200 p-3">
        {header && !header.canSend ? (
          <p className="px-1 py-2 text-sm text-slate-500">
            {header.cannotSendReason}
          </p>
        ) : (
          <MessageComposer
            kind={kind}
            id={id}
            isReady={header !== null}
            onError={setSendError}
            onSent={handleSent}
          />
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
