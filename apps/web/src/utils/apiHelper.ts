export async function api<T>(
  path: string,
  accessToken: string,
  method: "GET" | "POST" | "DELETE" | "PUT" = "GET",
): Promise<T> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${path}`, {
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
