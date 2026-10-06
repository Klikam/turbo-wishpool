import type { RegisterCredentials } from "@repo/types";

export const register = async (credentials: RegisterCredentials) => {
  const response = await fetch(`/backend/auth/register`, {
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
