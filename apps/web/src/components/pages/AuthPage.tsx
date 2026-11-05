"use client";

import { useEffect, useState } from "react";
import CredentialsPage from "./CredentialsPage";
import { SocialButton, ToastError } from "@repo/ui";
import { loginWithProvider, type SocialProvider } from "@/lib/auth";

// Sent by better-auth as `?error=` when the OAuth round trip or the email
// verification link fails.
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_token: "This verification link is invalid. Sign in to get a new one.",
  token_expired: "This verification link has expired. Sign in to get a new one.",
  account_not_linked:
    "This email belongs to an existing account that couldn't be linked.",
  unable_to_link_account:
    "This email belongs to an existing account that couldn't be linked.",
  access_denied: "Sign-in was cancelled.",
};
const DEFAULT_OAUTH_ERROR = "Social sign-in failed, please try again.";

export default function AuthPage() {
  const [socialError, setSocialError] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(
    null,
  );

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    if (code) {
      setSocialError(OAUTH_ERROR_MESSAGES[code] ?? DEFAULT_OAUTH_ERROR);
    }
  }, []);

  async function handleSocialLogin(provider: SocialProvider) {
    setSocialError(null);
    setPendingProvider(provider);

    const result = await loginWithProvider(provider);

    // On success the browser is already navigating to the provider.
    if (!result.ok) {
      setSocialError(result.error);
      setPendingProvider(null);
    }
  }

  return (
    <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
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
          <SocialButton
            provider="google"
            disabled={pendingProvider !== null}
            onClick={() => void handleSocialLogin("google")}
          />
          <SocialButton
            provider="facebook"
            disabled={pendingProvider !== null}
            onClick={() => void handleSocialLogin("facebook")}
          />
          {socialError && <ToastError message={socialError} />}
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
