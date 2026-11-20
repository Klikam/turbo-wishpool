"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { passwordSchema } from "@repo/types";
import { TextField, ToastError } from "@repo/ui";
import { resetPassword } from "@/lib/auth";

interface ResetPasswordProps {
  /** From the link in the email; missing or rejected when the link is bad. */
  token?: string;
  /** Set by better-auth (`INVALID_TOKEN`) when it already refused the link. */
  linkError?: boolean;
}

/** Lets someone who followed the emailed link choose a new password. */
export default function ResetPassword({ token, linkError }: ResetPasswordProps) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (saving || !token) return;

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    if (password !== confirmation) {
      setError("The two passwords don't match");
      return;
    }

    setSaving(true);
    setError(undefined);
    const result = await resetPassword(password, token);
    setSaving(false);

    if (result.ok) setDone(true);
    else setError(result.error);
  }

  const badLink = !token || linkError;

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">
          Choose a new password
        </h1>

        {done ? (
          <>
            <p role="status" className="text-sm text-muted-foreground mb-6">
              Your password has been changed. Sign in with it now.
            </p>
            <Link
              href="/"
              className="block w-full text-center py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors"
            >
              Sign in
            </Link>
          </>
        ) : badLink ? (
          <>
            <p role="alert" className="text-sm text-muted-foreground mb-6">
              This reset link is invalid or has expired.
            </p>
            <Link
              href="/forgot-password"
              className="block w-full text-center py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors"
            >
              Request a new link
            </Link>
          </>
        ) : (
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="flex flex-col gap-3 mt-6"
          >
            <TextField
              label="New password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />
            <TextField
              label="Repeat new password"
              type="password"
              value={confirmation}
              onChange={setConfirmation}
              placeholder="••••••••"
            />
            {error && (
              <div role="alert">
                <ToastError message={error} />
              </div>
            )}
            <button
              type="submit"
              disabled={saving || !password}
              aria-busy={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors mt-1 disabled:opacity-60 disabled:cursor-wait"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Change password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
