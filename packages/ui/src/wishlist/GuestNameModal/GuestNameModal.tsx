"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { TextField } from "../../common/TextField";

interface GuestNameModalProps {
  /** Pre-filled with the name the guest used last time. */
  initialName?: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
}

export function GuestNameModal({
  initialName = "",
  onConfirm,
  onClose,
}: GuestNameModalProps) {
  const [name, setName] = useState(initialName);

  function handleConfirm() {
    if (!name.trim()) return;
    onConfirm(name.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-heading text-xl font-semibold">
            Who&apos;s gifting this?
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your name is shown to other guests so nobody buys the same gift. The
            wishlist owner never sees it.
          </p>
          <TextField
            label="Your name *"
            placeholder="e.g. Noah"
            value={name}
            onChange={setName}
            compact
          />
          <button
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            I&apos;ll gift this
          </button>
        </div>
      </div>
    </div>
  );
}
