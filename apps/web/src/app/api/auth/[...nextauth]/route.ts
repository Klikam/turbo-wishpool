import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

type BackendLoginResponse = {
  user: {
    id: number | string;
    email: string;
    name: string;
  };
  backendTokens: {
    accessToken: string;
    refreshToken: string;
  };
};

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

        if (!backendUrl) {
          throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
        }

        const response = await fetch(`${backendUrl}/auth/login`, {
          method: "POST",
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as BackendLoginResponse;

        return {
          id: String(data.user.id),
          email: data.user.email,
          name: data.user.name,
          backendTokens: data.backendTokens,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = {
          id: user.id,
          email: user.email,
          name: user.name,
        };

        token.backendTokens = user.backendTokens;
      }

      return token;
    },
    async session({ session, token }) {
      session.user = token.user;
      session.backendTokens = token.backendTokens;

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
