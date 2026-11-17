"use client";

import { useEffect, useState } from "react";
import CredentialsPage from "./CredentialsPage";
import { SocialButton, ToastError } from "@repo/ui";
import { socialSignIn, type SocialProvider } from "@/lib/auth";

// Sent by better-auth as `?error=` when the email verification link or a
// social sign-in fails.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_TOKEN: "This verification link is invalid. Sign in to get a new one.",
  TOKEN_EXPIRED: "This verification link has expired. Sign in to get a new one.",
  account_not_linked:
    "An account with this email already exists. Sign in with your password instead.",
  access_denied: "Sign-in was cancelled.",
  email_not_found:
    "We couldn't get your email address from this provider. Please use another sign-in method.",
};
const DEFAULT_AUTH_ERROR = "Sign-in failed. Please try again.";

export default function AuthPage() {
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(
    null,
  );

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    if (code) {
      setAuthError(AUTH_ERROR_MESSAGES[code] ?? DEFAULT_AUTH_ERROR);
    }
  }, []);

  // On success the browser leaves for the provider, so the button stays
  // disabled until then.
  async function handleSocialSignIn(provider: SocialProvider) {
    setAuthError(null);
    setPendingProvider(provider);
    try {
      await socialSignIn(provider);
    } catch {
      setAuthError(DEFAULT_AUTH_ERROR);
      setPendingProvider(null);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h2 className="font-['Playfair_Display'] text-3xl font-semibold text-foreground mb-2">
            Sign in
          </h2>
          <p className="text-muted-foreground text-sm">
            Use a social account to get started instantly.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {(["google", "facebook"] as const).map((provider) => (
            <SocialButton
              key={provider}
              provider={provider}
              disabled={pendingProvider !== null}
              onClick={() => void handleSocialSignIn(provider)}
            />
          ))}
          {authError && <ToastError message={authError} />}
        </div>

        <div className="flex items-center gap-3 mb-6 mt-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or use email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div>
          <CredentialsPage />
        </div>

        <p className="text-xs text-muted-foreground mt-6 text-center leading-relaxed">
          By signing in you agree to our terms. Your data stays private — gift
          selections are always anonymous to the wishlist owner.
        </p>
      </div>
    </div>
  );
}
