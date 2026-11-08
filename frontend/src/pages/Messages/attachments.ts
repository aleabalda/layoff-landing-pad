import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import type { ConversationKind } from "./messageTypes";

// Must match the bucket settings in
// supabase/migrations/20261108040000_message_attachments.sql.
export const ATTACHMENT_BUCKET = "message-attachments";
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
export const ATTACHMENT_ACCEPT = Object.keys(ALLOWED_ATTACHMENT_TYPES).join(
  ",",
);

// Signed links are made fresh each time the chat opens, so an hour is plenty.
const SIGNED_URL_SECONDS = 60 * 60;

export function isImage(type: string | null | undefined) {
  return !!type && type.startsWith("image/");
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Returns a message to show, or null if the file is fine.
export function checkAttachment(file: File) {
  if (!ALLOWED_ATTACHMENT_TYPES[file.type]) {
    return "You can attach images (PNG, JPG, GIF, WebP) or PDFs.";
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_ATTACHMENT_BYTES)}.`;
  }
  return null;
}

// Uploads into the conversation's folder and returns the storage path. The
// file gets a random name; the original name is saved on the message.
export async function uploadAttachment(
  kind: ConversationKind,
  conversationId: string,
  file: File,
) {
  const extension = ALLOWED_ATTACHMENT_TYPES[file.type];
  const path = `${kind}/${conversationId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  return path;
}

// Signed links for the given storage paths, fetched in one batch for any
// paths that don't have one yet.
export function useSignedUrls(paths: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const missing = paths.filter((path) => !(path in urls));
  const missingKey = missing.join("|");

  useEffect(() => {
    if (!missingKey) return;
    let isCurrent = true;

    supabase.storage
      .from(ATTACHMENT_BUCKET)
      .createSignedUrls(missingKey.split("|"), SIGNED_URL_SECONDS)
      .then(({ data }) => {
        if (!isCurrent || !data) return;
        setUrls((current) => {
          const next = { ...current };
          for (const item of data) {
            if (item.path && item.signedUrl) next[item.path] = item.signedUrl;
          }
          return next;
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [missingKey]);

  return urls;
}
