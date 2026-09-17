"use client";

import { UserContextProvider } from "@/context/UserContext";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserContextProvider>
      <SessionProvider>{children}</SessionProvider>
    </UserContextProvider>
  );
}
