import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

type BackendTokens = {
  accessToken: string;
  refreshToken: string;
};

type SessionUser = {
  id: string;
  email: string;
  name: string;
};

declare module "next-auth" {
  interface Session {
    user: SessionUser;
    backendTokens: BackendTokens;
  }

  interface User extends SessionUser {
    backendTokens: BackendTokens;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user: SessionUser;
    backendTokens: BackendTokens;
  }
}
