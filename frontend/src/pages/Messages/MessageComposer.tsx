import {
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "../../supabaseClient";
import {
  ATTACHMENT_ACCEPT,
  checkAttachment,
  formatBytes,
  isImage,
  uploadAttachment,
} from "./attachments";
import {
  type ConversationKind,
  MESSAGE_MAX_LENGTH,
  type Message,
  conversationArgs,
} from "./messageTypes";

function MessageComposer({
  kind,
  id,
  isReady,
  onError,
  onSent,
}: {
  kind: ConversationKind;
  id: string;
  isReady: boolean;
  onError: (message: string | null) => void;
  onSent: (message: Message) => void;
}) {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    onError(problem);
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

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const body = draft.trim();
    if ((!body && !file) || isSending) return;

    setIsSending(true);
    onError(null);

    let attachmentPath: string | null = null;
    if (file) {
      try {
        attachmentPath = await uploadAttachment(kind, id, file);
      } catch (err) {
        setIsSending(false);
        onError(
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
      onError(error.message);
      return;
    }

    setDraft("");
    setFile(null);
    onSent(data);
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

  return (
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
            <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
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
          disabled={!isReady || isSending}
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
          placeholder={file ? "Add a message (optional)" : "Write a message"}
          disabled={!isReady}
          className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 field-sizing-content focus:border-teal-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={(!draft.trim() && !file) || isSending || !isReady}
          className="h-10 cursor-pointer rounded-xl bg-teal-700 px-4 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </form>
  );
}

export default MessageComposer;
