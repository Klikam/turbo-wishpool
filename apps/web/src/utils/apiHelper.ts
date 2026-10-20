import { getBackendUrl } from "@/lib/config";

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
    if (Array.isArray(message)) return message.join(", ");
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
  const response = await fetch(`${getBackendUrl()}/${path}`, {
    method,
    cache: "no-store",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}
