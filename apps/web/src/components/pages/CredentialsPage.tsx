import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Resolver, type SubmitHandler, useForm } from "react-hook-form";
import {
  getCredentialsSchema,
  type Mode,
  type RegisterCredentials,
} from "@repo/types";
import { CredentialsButton, CredentialsField, ToastError } from "@repo/ui";
import { login as onLogin, register as onRegister } from "@/lib/auth";
import { DEFAULT_CALLBACK_URL } from "@/utils/redirectHelper";

interface CredentialsPageProps {
  /** Where to go once signed in (also used by the verification email). */
  callbackURL?: string;
}

export default function CredentialsPage({
  callbackURL = DEFAULT_CALLBACK_URL,
}: CredentialsPageProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Signed in and on the way to callbackURL; keeps the button blocked.
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  const onSubmit: SubmitHandler<RegisterCredentials> = async (data) => {
    setSubmitError(null);
    setNotice(null);

    if (mode === "register") {
      const response = await onRegister(data, callbackURL);

      if (response.ok) {
        setMode("signin");
        setNotice(
          `Almost there! We sent a verification link to ${data.email}. Open it to finish creating your account.`,
        );
      } else {
        setSubmitError(response.error);
      }
      return;
    }

    const response = await onLogin(data, callbackURL);

    if (response.ok) {
      setRedirecting(true);
      router.push(callbackURL);
      router.refresh();
    } else {
      setSubmitError(response.error);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterCredentials>({
    resolver: zodResolver(
      getCredentialsSchema(mode),
    ) as unknown as Resolver<RegisterCredentials>,
  });
  const busy = isSubmitting || redirecting;

  return (
    <>
      <div className="flex rounded-xl border border-border bg-secondary p-1 mb-5">
        <CredentialsButton
          label="Sign in"
          mode={mode}
          handleModeChange={() => {
            setMode("signin");
            setSubmitError(null);
            setNotice(null);
          }}
        />
        <CredentialsButton
          label="Register"
          mode={mode}
          handleModeChange={() => {
            setMode("register");
            setSubmitError(null);
            setNotice(null);
          }}
        />
      </div>

      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className="flex flex-col gap-3"
      >
        {mode === "register" && (
          <CredentialsField
            label="Full name"
            field="name"
            placeholder="Emma Thornton"
            type="text"
            register={register}
          />
        )}

        <CredentialsField
          label="Email"
          field="email"
          placeholder="you@example.com"
          type="email"
          register={register}
        />

        <CredentialsField
          label="Password"
          field="password"
          placeholder="••••••••"
          type="password"
          register={register}
        />

        {mode === "signin" && (
          <Link
            href="/forgot-password"
            className="self-end text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Forgot password?
          </Link>
        )}

        {errors.email?.message && <ToastError message={errors.email.message} />}

        {mode === "register" && errors.name?.message && (
          <ToastError message={errors.name.message} />
        )}

        {errors.password?.message && (
          <ToastError message={errors.password.message} />
        )}

        {submitError && <ToastError message={submitError} />}

        {mode === "signin" && notice && (
          <p
            role="status"
            className="text-xs text-foreground bg-secondary border border-border rounded-lg px-3 py-2"
          >
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors mt-1 disabled:opacity-60 disabled:cursor-wait"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
    </>
  );
}
