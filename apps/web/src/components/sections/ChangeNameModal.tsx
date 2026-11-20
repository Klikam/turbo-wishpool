"use client";

import { Modal, TextField, ToastError } from "@repo/ui";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { nameSchema } from "@repo/types";
import { changeName } from "@/lib/auth";

interface ChangeNameModalProps {
  currentName: string;
  onClose: () => void;
  /** Called once the name has been changed. */
  onChanged: () => void;
}

/** Asks for a new display name. */
export function ChangeNameModal({
  currentName,
  onClose,
  onChanged,
}: ChangeNameModalProps) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const unchanged = name.trim() === currentName;

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (saving || unchanged) return;

    const parsed = nameSchema.safeParse(name);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }

    setSaving(true);
    setError(undefined);
    const result = await changeName(parsed.data);

    if (result.ok) {
      onChanged();
      return;
    }

    setError(result.error);
    setSaving(false);
  }

  return (
    <Modal title="Change your name" onClose={onClose}>
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="p-6 flex flex-col gap-4"
      >
        <TextField label="Name" value={name} onChange={setName} compact />
        <p className="text-xs text-muted-foreground">
          This is the name people see on your wishlists and in the emails we
          send for you.
        </p>
        {error && (
          <div role="alert">
            <ToastError message={error} />
          </div>
        )}
        <button
          type="submit"
          disabled={saving || unchanged}
          aria-busy={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving…" : "Save name"}
        </button>
      </form>
    </Modal>
  );
}
