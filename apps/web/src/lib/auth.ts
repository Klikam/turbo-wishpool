import type { RegisterCredentials, SignInCredentials } from "@repo/types";
import { signIn, signOut } from "next-auth/react";

export const register = async (credentials: RegisterCredentials) => {
  const response = await fetch(`backend/auth/register`, {
    method: "POST",
    body: JSON.stringify({
      name: credentials.name,
      email: credentials.email,
      password: credentials.password,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
};

export const login = async (credentials: SignInCredentials) => {
  return await signIn("credentials", {
    email: credentials.email,
    password: credentials.password,
    redirect: false,
    callbackUrl: "/dashboard",
  });
};

export const logout = async () => {
  return await signOut({
    callbackUrl: "/",
    redirect: false
  })
}
