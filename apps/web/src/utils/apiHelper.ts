import { headers as requestHeaders } from "next/headers";
import { getBackendUrl } from "@/lib/config";

const TOO_MANY_REQUESTS = 429;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

/** Extracts the NestJS error message(s) from a failed response body. */
async function readErrorMessage(response: Response) {
  const text = await response.text();
  try {
    const { message } = JSON.parse(text) as { message?: string | string[] };
    // Validation errors come as one sentence per field.
    if (Array.isArray(message)) return message.join(". ");
    if (message) return message;
  } catch {
    // not JSON, fall through to the raw body
  }
  return text || response.statusText;
}

/**
 * Server-side call to the backend. `accessToken` is optional so the same
 * helper serves the public (visitor) endpoints.
 */
export async function api<T>(
  path: string,
  accessToken: string | null,
  { method = "GET", body, headers }: ApiOptions = {},
): Promise<T> {
  // Passes on the visitor's address, so the backend can tell visitors apart
  // (e.g. to rate-limit reservations) instead of seeing only this server.
  const forwardedFor = (await requestHeaders()).get("x-forwarded-for");

  const response = await fetch(`${getBackendUrl()}/${path}`, {
    method,
    cache: "no-store",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === TOO_MANY_REQUESTS) {
    throw new ApiError(
      response.status,
      "Too many attempts, try again in a minute",
    );
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}
