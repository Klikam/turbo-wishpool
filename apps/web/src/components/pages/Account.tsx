"use client";

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
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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

        <dl className="bg-card border border-border rounded-2xl p-6 grid gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium text-foreground">{user.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium text-foreground break-all">
              {user.email}
            </dd>
          </div>
        </dl>

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
