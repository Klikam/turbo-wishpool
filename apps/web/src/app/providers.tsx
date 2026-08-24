"use client";

import { UserContextProvider } from "@/context/UserContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <UserContextProvider>{children}</UserContextProvider>;
}
