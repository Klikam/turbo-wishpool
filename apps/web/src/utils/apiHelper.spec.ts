import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const headers = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ headers }));

import { api, ApiError } from "./apiHelper";

const fetchMock = vi.fn();

const respond = (status: number, body?: unknown, raw?: string) =>
  fetchMock.mockResolvedValue(
    new Response(raw ?? (body === undefined ? null : JSON.stringify(body)), {
      status,
    }),
  );

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  headers.mockResolvedValue(new Headers());
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const lastRequest = () =>
  fetchMock.mock.calls[0] as [
    string,
    RequestInit & { headers: Record<string, string> },
  ];

describe("api", () => {
  it("calls the backend with the bearer token and parses JSON", async () => {
    respond(200, { id: 1 });

    await expect(api("wishlists", "tok")).resolves.toEqual({ id: 1 });

    const [url, init] = lastRequest();
    expect(url).toBe("http://backend.test/wishlists");
    expect(init).toMatchObject({ method: "GET", cache: "no-store" });
    expect(init.headers).toMatchObject({ Authorization: "Bearer tok" });
    expect(init.headers).not.toHaveProperty("Content-Type");
  });

  it("sends JSON bodies and omits the token for visitors", async () => {
    respond(201, { id: 2 });

    await api("wishlists", null, { method: "POST", body: { title: "x" } });

    const [, init] = lastRequest();
    expect(init.body).toBe('{"title":"x"}');
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("forwards the visitor's address for rate limiting", async () => {
    headers.mockResolvedValue(
      new Headers({ "x-forwarded-for": "203.0.113.9" }),
    );
    respond(200, {});

    await api("x", "tok");

    expect(lastRequest()[1].headers).toMatchObject({
      "X-Forwarded-For": "203.0.113.9",
    });
  });

  it("returns undefined for 204", async () => {
    respond(204);

    await expect(
      api("x", "tok", { method: "DELETE" }),
    ).resolves.toBeUndefined();
  });

  it("turns 429 into a friendly message", async () => {
    respond(429, { message: "ThrottlerException: Too Many Requests" });

    await expect(api("x", "tok")).rejects.toMatchObject({
      status: 429,
      message: "Too many attempts, try again in a minute",
    });
  });

  it("reads the NestJS error message", async () => {
    respond(409, { message: "Gift is already reserved" });

    await expect(api("x", "tok")).rejects.toMatchObject({
      status: 409,
      message: "Gift is already reserved",
    });
  });

  it("joins validation messages into sentences", async () => {
    respond(400, {
      message: ["Enter a gift name", "The price can't be negative"],
    });

    await expect(api("x", "tok")).rejects.toThrow(
      "Enter a gift name. The price can't be negative",
    );
  });

  it("falls back to the raw body when it is not JSON", async () => {
    respond(502, undefined, "Bad gateway");

    const error = await api("x", "tok").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe("Bad gateway");
  });
});
