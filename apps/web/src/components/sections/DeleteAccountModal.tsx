"use client";

import { Modal, TextField, ToastError } from "@repo/ui";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { deleteAccount, logout } from "@/lib/auth";
import { NEXT_PARAM } from "@/utils/redirectHelper";

interface DeleteAccountModalProps {
  /** Accounts made with email and password confirm with it. */
  hasPassword: boolean;
  onClose: () => void;
}

/** Asks for confirmation (and the password, if any) before deleting the account. */
export function DeleteAccountModal({
  hasPassword,
  onClose,
}: DeleteAccountModalProps) {
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const [needsRecentSignIn, setNeedsRecentSignIn] = useState(false);

  async function handleDelete() {
    if (deleting || (hasPassword && !password)) return;
    setDeleting(true);
    setError(undefined);

    const result = await deleteAccount(hasPassword ? password : undefined);
    if (result.ok) {
      // A full load, so nothing from the deleted account stays on screen.
      window.location.assign("/");
      return;
    }

    setError(result.error);
    setNeedsRecentSignIn(result.needsRecentSignIn ?? false);
    setDeleting(false);
  }

  async function handleSignInAgain() {
    await logout();
    window.location.assign(`/?${NEXT_PARAM}=${encodeURIComponent("/account")}`);
  }

  return (
    <Modal title="Delete your account?" onClose={onClose}>
      <div className="p-6 flex flex-col gap-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your account, all your wishlists and their gifts will be deleted for
          good, and your share links will stop working. Gifts you reserved on
          other people&apos;s lists become free again. This can&apos;t be
          undone.
        </p>
        {hasPassword && (
          <TextField
            label="Your password"
            type="password"
            value={password}
            onChange={setPassword}
            compact
          />
        )}
        {error && (
          <div role="alert">
            <ToastError message={error} />
          </div>
        )}
        {needsRecentSignIn ? (
          <button
            onClick={() => void handleSignInAgain()}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors"
          >
            Sign in again
          </button>
        ) : (
          <button
            onClick={() => void handleDelete()}
            disabled={deleting || (hasPassword && !password)}
            aria-busy={deleting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-destructive text-white rounded-xl font-medium text-sm hover:bg-destructive/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {deleting ? "Deleting…" : "Delete my account"}
          </button>
        )}
      </div>
    </Modal>
  );
}
