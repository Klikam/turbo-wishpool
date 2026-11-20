"use client";

import { Modal, TextField, ToastError } from "@repo/ui";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { passwordSchema } from "@repo/types";
import { changePassword } from "@/lib/auth";

interface ChangePasswordModalProps {
  onClose: () => void;
  /** Called once the password has been changed. */
  onChanged: () => void;
}

/** Asks for the current password and a new one. */
export function ChangePasswordModal({
  onClose,
  onChanged,
}: ChangePasswordModalProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (saving || !current || !next) return;

    const parsed = passwordSchema.safeParse(next);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    if (next !== confirmation) {
      setError("The two new passwords don't match");
      return;
    }
    if (next === current) {
      setError("Your new password must differ from the current one");
      return;
    }

    setSaving(true);
    setError(undefined);
    const result = await changePassword(current, next);

    if (result.ok) {
      onChanged();
      return;
    }

    setError(result.error);
    setSaving(false);
  }

  return (
    <Modal title="Change your password" onClose={onClose}>
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="p-6 flex flex-col gap-4"
      >
        <TextField
          label="Current password"
          type="password"
          value={current}
          onChange={setCurrent}
          compact
        />
        <TextField
          label="New password"
          type="password"
          value={next}
          onChange={setNext}
          compact
        />
        <TextField
          label="Repeat new password"
          type="password"
          value={confirmation}
          onChange={setConfirmation}
          compact
        />
        <p className="text-xs text-muted-foreground">
          You&apos;ll stay signed in here; your other devices are signed out.
        </p>
        {error && (
          <div role="alert">
            <ToastError message={error} />
          </div>
        )}
        <button
          type="submit"
          disabled={saving || !current || !next}
          aria-busy={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving…" : "Change password"}
        </button>
      </form>
    </Modal>
  );
}
