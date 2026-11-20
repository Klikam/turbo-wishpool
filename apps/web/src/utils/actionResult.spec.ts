import { describe, expect, it } from "vitest";
import { toResult } from "./actionResult";
import { ApiError } from "./apiHelper";

describe("toResult", () => {
  it("wraps a value", async () => {
    expect(await toResult(() => Promise.resolve(42))).toEqual({
      ok: true,
      data: 42,
    });
  });

  it("turns backend errors into a message for the UI", async () => {
    const result = await toResult(() =>
      Promise.reject(new ApiError(409, "Gift is already reserved")),
    );

    expect(result).toEqual({ ok: false, error: "Gift is already reserved" });
  });

  it("lets unexpected errors through", async () => {
    await expect(
      toResult(() => Promise.reject(new TypeError("bug"))),
    ).rejects.toThrow("bug");
  });
});
