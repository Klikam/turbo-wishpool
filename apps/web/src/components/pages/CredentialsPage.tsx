import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Resolver, type SubmitHandler, useForm } from "react-hook-form";
import {
  getCredentialsSchema,
  type Mode,
  type RegisterCredentials,
} from "@repo/types";
import { CredentialsButton, CredentialsField, ToastError } from "@repo/ui";
import { login as onLogin, register as onRegister } from "../../lib/auth";

export default function CredentialsPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const router = useRouter();

  const onSubmit: SubmitHandler<RegisterCredentials> = async (data) => {
    if (mode === "register") {
      try {
        await onRegister(data);
        setMode("signin");
      } catch (error) {
        console.log(
          error instanceof Error ? error.message : "Registration failed",
        );
      }
      return;
    }

    const response = await onLogin(data);

    if (response?.ok) {
      console.log(`Logged in as ${data.email}`);
      router.push("/dashboard");
      router.refresh();
    } else {
      console.log(response?.error ?? "Something went wrong with the login");
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterCredentials>({
    resolver: zodResolver(
      getCredentialsSchema(mode),
    ) as unknown as Resolver<RegisterCredentials>,
  });

  return (
    <>
      <div className="flex rounded-xl border border-border bg-secondary p-1 mb-5">
        <CredentialsButton
          label="Sign in"
          mode={mode}
          handleModeChange={() => {
            setMode("signin");
          }}
        />
        <CredentialsButton
          label="Register"
          mode={mode}
          handleModeChange={() => {
            setMode("register");
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

        {errors.email?.message && <ToastError message={errors.email.message} />}

        {mode === "register" && errors.name?.message && (
          <ToastError message={errors.name.message} />
        )}

        {errors.password?.message && (
          <ToastError message={errors.password.message} />
        )}

        <button
          type="submit"
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-[#3a1232] transition-colors mt-1"
        >
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
    </>
  );
}
