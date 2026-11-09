import { createAuthClient } from "better-auth/client";

// Same-origin: requests to /api/auth/* are proxied to the backend (see
// `rewrites` in next.config.js), so the session cookie is set on the web origin.
export const authClient = createAuthClient();
