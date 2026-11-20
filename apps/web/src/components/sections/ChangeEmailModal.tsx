"use client";

import { Modal, TextField, ToastError } from "@repo/ui";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { changeEmail } from "@/lib/auth";

interface ChangeEmailModalProps {
  currentEmail: string;
  onClose: () => void;
  /** Called with the new address once the verification link has been sent. */
  onRequested: (newEmail: string) => void;
}

/** Asks for a new email address and sends it a verification link. */
export function ChangeEmailModal({
  currentEmail,
  onClose,
  onRequested,
}: ChangeEmailModalProps) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (saving || !email.trim()) return;

    const address = email.trim();
    if (!z.email().safeParse(address).success) {
      setError("Enter a valid email address");
      return;
    }
    if (address.toLowerCase() === currentEmail.toLowerCase()) {
      setError("That is already your email address");
      return;
    }

    setSaving(true);
    setError(undefined);
    const result = await changeEmail(address);

    if (result.ok) {
      onRequested(address);
      return;
    }

    setError(result.error);
    setSaving(false);
  }

  return (
    <Modal title="Change your email" onClose={onClose}>
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(e)}
        className="p-6 flex flex-col gap-4"
      >
        <TextField
          label="New email"
          type="email"
          value={email}
          onChange={setEmail}
          compact
        />
        <p className="text-xs text-muted-foreground">
          We&apos;ll send a link to the new address. Your email changes once
          you open it; until then you keep signing in with {currentEmail}.
        </p>
        {error && (
          <div role="alert">
            <ToastError message={error} />
          </div>
        )}
        <button
          type="submit"
          disabled={saving || !email.trim()}
          aria-busy={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Sending…" : "Send verification link"}
        </button>
      </form>
    </Modal>
  );
}
