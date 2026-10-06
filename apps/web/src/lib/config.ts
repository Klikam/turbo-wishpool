export function getBackendUrl() {
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    throw new Error("BACKEND_URL is not defined");
  }

  return backendUrl;
}

export function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is not defined");
  }

  return secret;
}
