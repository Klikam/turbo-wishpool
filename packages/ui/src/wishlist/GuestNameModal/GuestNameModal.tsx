"use client";

import { useState } from "react";
import { Modal } from "../../common/Modal";
import { TextField } from "../../common/TextField";

interface GuestNameModalProps {
  /** Pre-filled with the name the guest used last time. */
  initialName?: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
  /** Shows a "sign in instead" link when provided. */
  onSignIn?: () => void;
}

export function GuestNameModal({
  initialName = "",
  onConfirm,
  onClose,
  onSignIn,
}: GuestNameModalProps) {
  const [name, setName] = useState(initialName);

  function handleConfirm() {
    if (!name.trim()) return;
    onConfirm(name.trim());
  }

  return (
    <Modal title="Who's gifting this?" onClose={onClose}>
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
        {onSignIn && (
          <p className="text-xs text-muted-foreground text-center">
            Have an account?{" "}
            <button
              onClick={onSignIn}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in instead
            </button>
          </p>
        )}
      </div>
    </Modal>
  );
}
