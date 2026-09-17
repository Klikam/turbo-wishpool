import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { login as onLogin, register as onRegister } from "../../api/auth";
import { getCredentialsSchema, type Credentials, type Mode } from "@repo/types";
import {
  CredentialsButton,
  NotImplementedAlert,
  ToastError,
  CredentialsField,
} from "@repo/ui";
import { signIn } from "next-auth/react";
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export default function CredentialsPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const router = useRouter();

  const onSubmit: SubmitHandler<Credentials> = async (data) => {
    // const call = mode === "register" ? register : signIn;
    const response = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false
    });
    if (response?.ok) {
      console.log(`Logged in as ${data.email}`);
      router.push("/dashboard");
    } else {
      console.log(
        response?.error ??
          `Something went wrong with the ${mode === "register" ? "registration" : "login"}`,
      );
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Credentials>({
    resolver: zodResolver(
      getCredentialsSchema(mode),
    ) as unknown as Resolver<Credentials>,
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
