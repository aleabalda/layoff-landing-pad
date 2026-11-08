import { formatBytes, isImage } from "./attachments";
import type { Message } from "./messageTypes";

// An image thumbnail or a PDF card. Both open the full file in a new tab.
function AttachmentView({
  message,
  url,
  isMine,
  onLoad,
}: {
  message: Message;
  url: string | undefined;
  isMine: boolean;
  onLoad: () => void;
}) {
  const name = message.attachment_name ?? "Attachment";
  const corner = isMine ? "rounded-br-md" : "rounded-bl-md";

  if (isImage(message.attachment_type)) {
    return url ? (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={`block max-w-[80%] overflow-hidden rounded-2xl ${corner} border border-slate-200 bg-slate-100`}
      >
        <img
          src={url}
          alt={name}
          onLoad={onLoad}
          className="max-h-72 w-auto max-w-full object-contain"
        />
      </a>
    ) : (
      <div
        className={`flex h-40 w-56 items-center justify-center rounded-2xl ${corner} bg-slate-100 text-xs text-slate-500`}
      >
        Loading image...
      </div>
    );
  }

  const details = ["PDF", formatBytes(message.attachment_size)]
    .filter(Boolean)
    .join(" · ");

  const card = (
    <>
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs font-semibold text-red-700"
      >
        PDF
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-slate-900">
          {name}
        </span>
        <span className="block text-xs text-slate-500">
          {url ? `${details} · Open` : "Loading..."}
        </span>
      </span>
    </>
  );

  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`flex w-64 max-w-[80%] items-center gap-3 rounded-2xl ${corner} border border-slate-200 bg-white p-2.5 hover:bg-slate-50`}
    >
      {card}
    </a>
  ) : (
    <div
      className={`flex w-64 max-w-[80%] items-center gap-3 rounded-2xl ${corner} border border-slate-200 bg-white p-2.5`}
    >
      {card}
    </div>
  );
}

export default AttachmentView;
