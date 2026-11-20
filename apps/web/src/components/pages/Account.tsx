"use client";

import { ChangeNameModal } from "@/components/sections/ChangeNameModal";
import { ChangePasswordModal } from "@/components/sections/ChangePasswordModal";
import { DeleteAccountModal } from "@/components/sections/DeleteAccountModal";
import type { SessionUser } from "@/lib/session";
import { BackButton } from "@repo/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AccountProps {
  user: Pick<SessionUser, "name" | "email">;
  /** Whether the account can sign in with a password (vs. only socially). */
  hasPassword: boolean;
}

export default function Account({ user, hasPassword }: AccountProps) {
  const router = useRouter();
  const [changingName, setChangingName] = useState(false);
  const [nameChanged, setNameChanged] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  return (
    <div className="flex-1 bg-background flex justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <BackButton
            onClick={() => {
              router.push("/dashboard");
            }}
          />
        </div>

        <h1 className="font-heading text-3xl font-semibold text-foreground mb-8">
          Your account
        </h1>

        {nameChanged && (
          <p
            role="status"
            className="text-xs text-foreground bg-secondary border border-border rounded-lg px-3 py-2 mb-4"
          >
            Your name has been changed.
          </p>
        )}

        <dl className="bg-card border border-border rounded-2xl p-6 grid gap-4 text-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium text-foreground">{user.name}</dd>
            </div>
            <button
              onClick={() => {
                setNameChanged(false);
                setChangingName(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-border text-foreground text-xs font-medium hover:bg-secondary transition-colors"
            >
              Change name
            </button>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium text-foreground break-all">
              {user.email}
            </dd>
          </div>
        </dl>

        {hasPassword && (
          <section className="mt-8 border border-border rounded-2xl p-6">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
              Password
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Forgot it? Sign out and use &ldquo;Forgot password?&rdquo; on the
              sign-in form.
            </p>
            {passwordChanged && (
              <p
                role="status"
                className="text-xs text-foreground bg-secondary border border-border rounded-lg px-3 py-2 mb-4"
              >
                Your password has been changed.
              </p>
            )}
            <button
              onClick={() => {
                setPasswordChanged(false);
                setChangingPassword(true);
              }}
              className="px-4 py-2 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors"
            >
              Change password
            </button>
          </section>
        )}

        <section className="mt-8 border border-destructive/30 rounded-2xl p-6">
          <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
            Delete account
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Deletes your account, wishlists and gifts for good.
          </p>
          <button
            onClick={() => {
              setConfirmingDelete(true);
            }}
            className="px-4 py-2 rounded-xl border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
          >
            Delete my account
          </button>
        </section>
      </div>

      {changingName && (
        <ChangeNameModal
          currentName={user.name}
          onClose={() => {
            setChangingName(false);
          }}
          onChanged={() => {
            setChangingName(false);
            setNameChanged(true);
            // The name is shown from the server-rendered session.
            router.refresh();
          }}
        />
      )}

      {changingPassword && (
        <ChangePasswordModal
          onClose={() => {
            setChangingPassword(false);
          }}
          onChanged={() => {
            setChangingPassword(false);
            setPasswordChanged(true);
          }}
        />
      )}

      {confirmingDelete && (
        <DeleteAccountModal
          hasPassword={hasPassword}
          onClose={() => {
            setConfirmingDelete(false);
          }}
        />
      )}
    </div>
  );
}
