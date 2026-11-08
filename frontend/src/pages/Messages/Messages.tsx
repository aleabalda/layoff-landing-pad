import { useCallback, useState } from "react";
import { Navigate, useParams } from "react-router";
import AppHeader from "../../components/AppHeader";
import ChatPane from "./ChatPane";
import ConversationList from "./ConversationList";
import type { ConversationKind } from "./messageTypes";

// /messages shows the list. /messages/:kind/:conversationId shows a chat,
// beside the list on wider screens and on its own on phones.
function Messages() {
  const { kind, conversationId } = useParams();
  const [refreshKey, setRefreshKey] = useState(0);

  // Stable, so the chat pane doesn't reload every time it's called.
  const handleRead = useCallback(() => setRefreshKey((key) => key + 1), []);

  // Crew chats used to live at /messages/group/:id.
  if (kind === "group" && conversationId) {
    return <Navigate to={`/messages/crew/${conversationId}`} replace />;
  }
  if (kind && kind !== "crew" && kind !== "direct") {
    return <Navigate to="/messages" replace />;
  }

  const activeKind = kind as ConversationKind | undefined;
  const isOpen = !!activeKind && !!conversationId;

  return (
    <div className="flex h-dvh flex-col bg-slate-50">
      <AppHeader />
      <main className="flex min-h-0 w-full flex-1 px-4 pb-4 sm:px-6">
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <aside
            aria-label="Conversations"
            className={`min-h-0 w-full flex-col border-slate-200 md:flex md:w-72 md:shrink-0 lg:w-80 md:border-r ${
              isOpen ? "hidden" : "flex"
            }`}
          >
            <ConversationList
              activeKind={activeKind}
              activeId={conversationId}
              refreshKey={refreshKey}
            />
          </aside>

          <section
            aria-label="Conversation"
            className={`min-h-0 flex-1 flex-col ${isOpen ? "flex" : "hidden md:flex"}`}
          >
            {isOpen ? (
              <ChatPane
                key={`${activeKind}:${conversationId}`}
                kind={activeKind}
                id={conversationId}
                onRead={handleRead}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-500">
                Pick a conversation, or start a new message with a friend.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Messages;
