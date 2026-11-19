"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: ReactNode;
  /** Short line under the title, read out together with it. */
  subtitle?: ReactNode;
  /** Escape and the close button call this; the parent unmounts the modal. */
  onClose: () => void;
  /** Tailwind max-width class. */
  maxWidth?: string;
  children: ReactNode;
}

/**
 * A native modal <dialog>: it closes on Escape, keeps keyboard focus inside
 * and is announced as a dialog with its title. Render it to open it.
 */
export function Modal({
  title,
  subtitle,
  onClose,
  maxWidth = "max-w-sm",
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const subtitleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog.showModal();
    // Start in the first field rather than on the close button.
    dialog.querySelector<HTMLElement>("input, textarea, select")?.focus();
    return () => {
      dialog.close();
      opener?.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={subtitle ? subtitleId : undefined}
      // Handled here as well as on cancel: password manager extensions can
      // swallow Escape before the browser turns it into a cancel event.
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        onClose();
      }}
      onCancel={(e) => {
        // Other ways to dismiss, e.g. Android's back gesture. Let the parent
        // unmount it instead of the browser hiding it.
        e.preventDefault();
        onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] ${maxWidth} max-h-[calc(100dvh-2rem)] overflow-y-auto bg-card text-foreground rounded-2xl shadow-2xl border border-border backdrop:bg-black/40 backdrop:backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h2 id={titleId} className="font-heading text-xl font-semibold">
            {title}
          </h2>
          {subtitle && (
            <p id={subtitleId} className="text-xs text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
