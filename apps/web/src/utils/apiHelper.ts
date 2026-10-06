import { getBackendUrl } from "@/lib/config";

export async function api<T>(
  path: string,
  accessToken: string,
  method: "GET" | "POST" | "DELETE" | "PUT" = "GET",
): Promise<T> {
  const response = await fetch(`${getBackendUrl()}/${path}`, {
    credentials: "include",
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }

  return (await response.json()) as T;
}
