import { type ReactNode, useEffect, useRef } from "react";

// A centred dialog over a dimmed page. Built on <dialog>, so the browser keeps
// keyboard focus inside it and Escape closes it. Children only render while it's
// open, so their state starts fresh each time.
function Modal({
  open,
  onClose,
  labelledBy,
  canClose = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  // False while something is in progress, so Escape can't interrupt it.
  canClose?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        // Escape. We close it ourselves so React stays in charge of `open`.
        event.preventDefault();
        if (canClose) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50 open:flex open:flex-col"
    >
      {open && children}
    </dialog>
  );
}

export default Modal;
