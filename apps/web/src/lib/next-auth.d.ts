import type { DefaultSession } from "next-auth";

type BackendTokens = {
  accessToken: string;
  refreshToken: string;
};

type SessionUser = {
  id: string;
  email: string;
  name: string;
} & DefaultSession["user"];

declare module "next-auth" {
  interface Session {
    user: SessionUser;
    backendTokens: BackendTokens;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    backendTokens: BackendTokens;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user: SessionUser;
    backendTokens: BackendTokens;
  }
}

export {};
