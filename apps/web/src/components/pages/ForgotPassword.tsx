"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { TextField, ToastError } from "@repo/ui";
import { requestPasswordReset } from "@/lib/auth";

/** Asks for an email address and sends it a link to choose a new password. */
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string>();
  const [error, setError] = useState<string>();

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (sending) return;

    const address = email.trim();
    if (!z.email().safeParse(address).success) {
      setError("Enter a valid email address");
      return;
    }

    setSending(true);
    setError(undefined);
    const result = await requestPasswordReset(address);
    setSending(false);

    if (result.ok) setSentTo(address);
    else setError(result.error);
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">
          Forgot your password?
        </h1>

        {sentTo ? (
          <p
            role="status"
            className="text-sm text-muted-foreground leading-relaxed mb-6"
          >
            If there&apos;s an account for {sentTo}, we&apos;ve sent it a link
            to choose a new password. It works for an hour. Accounts that only
            use Google or Facebook sign-in can keep using them.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              Enter your email and we&apos;ll send you a link to choose a new
              one.
            </p>
            <form
              onSubmit={(e) => void handleSubmit(e)}
              className="flex flex-col gap-3"
              noValidate
            >
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
              />
              {error && (
                <div role="alert">
                  <ToastError message={error} />
                </div>
              )}
              <button
                type="submit"
                disabled={sending}
                aria-busy={sending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors mt-1 disabled:opacity-60 disabled:cursor-wait"
              >
                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                Send reset link
              </button>
            </form>
          </>
        )}

        <Link
          href="/"
          className="block mt-6 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
