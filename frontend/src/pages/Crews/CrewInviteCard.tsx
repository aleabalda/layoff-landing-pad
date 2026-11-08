import { useState } from "react";
import { Card } from "../../components/Card";

function CrewInviteCard({
  inviteCode,
  busy,
  onNewCode,
}: {
  inviteCode: string;
  busy: boolean;
  onNewCode: () => void;
}) {
  return (
    <Card labelledBy="invite-heading">
      <h2
        id="invite-heading"
        className="font-semibold tracking-tight text-slate-900"
      >
        Invite people
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Share this code. People enter it on the Crews page to join.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <code className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-lg tracking-widest text-slate-900">
          {inviteCode}
        </code>
        <CopyButton text={inviteCode} />
        <button
          type="button"
          disabled={busy}
          onClick={onNewCode}
          className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
        >
          New code
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        A new code stops the old one from working. People already in the crew
        stay in.
      </p>
    </Card>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      <span aria-live="polite">{copied ? "Copied ✓" : "Copy"}</span>
    </button>
  );
}

export default CrewInviteCard;
