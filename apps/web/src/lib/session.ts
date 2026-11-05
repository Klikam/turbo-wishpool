export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

// better-auth prefixes the cookie name with `__Secure-` over https.
export const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
] as const;
