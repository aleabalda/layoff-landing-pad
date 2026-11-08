import { Link } from "react-router";
import type { ConversationKind } from "./messageTypes";
import type { ConversationHeader } from "./useConversation";

function ChatHeader({
  header,
  kind,
  id,
}: {
  header: ConversationHeader | null;
  kind: ConversationKind;
  id: string;
}) {
  return (
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
  );
}

export default ChatHeader;
