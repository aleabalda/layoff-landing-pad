import { formatClockTime, formatDayHeading, localDate } from "../../dates";
import AttachmentView from "./AttachmentView";
import { useSignedUrls } from "./attachments";
import type { ConversationKind, Message } from "./messageTypes";

function MessageList({
  messages,
  names,
  myId,
  kind,
  onAttachmentLoad,
}: {
  messages: Message[];
  names: Record<string, string>;
  myId: string | undefined;
  kind: ConversationKind;
  onAttachmentLoad: () => void;
}) {
  const attachmentUrls = useSignedUrls(
    messages.flatMap((m) => (m.attachment_path ? [m.attachment_path] : [])),
  );

  return (
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
                  onLoad={onAttachmentLoad}
                />
              )}
              {message.body.trim() && (
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm wrap-break-word whitespace-pre-wrap ${
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
  );
}

export default MessageList;
