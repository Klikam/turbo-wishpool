import { describe, expect, it } from "vitest";
import { getCredentialsSchema, nameSchema, passwordSchema } from "../index";

const messages = (result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}) => result.error?.issues.map((i) => i.message) ?? [];

describe("nameSchema", () => {
  it("trims the name", () => {
    expect(nameSchema.parse("  Ann Lee ")).toBe("Ann Lee");
  });

  it("requires at least 2 characters once trimmed", () => {
    expect(messages(nameSchema.safeParse(" A "))).toEqual([
      "Name must contain at least 2 characters",
    ]);
  });

  it("allows at most 100 characters", () => {
    expect(nameSchema.safeParse("a".repeat(100)).success).toBe(true);
    expect(messages(nameSchema.safeParse("a".repeat(101)))).toEqual([
      "Name must contain no more than 100 characters",
    ]);
  });
});

describe("passwordSchema", () => {
  it.each(["12345678", "a".repeat(64), "pässwörd1"])(
    "accepts %j",
    (password) => {
      expect(passwordSchema.safeParse(password).success).toBe(true);
    },
  );

  it("requires at least 8 characters", () => {
    expect(messages(passwordSchema.safeParse("1234567"))).toEqual([
      "Password must contain at least 8 characters",
    ]);
  });

  it("allows at most 64 characters", () => {
    expect(messages(passwordSchema.safeParse("a".repeat(65)))).toContain(
      "Password must contain no more than 64 characters",
    );
  });

  // bcrypt, which better-auth-style hashing builds on, ignores bytes past 72.
  it("limits the size in bytes, not just characters", () => {
    const tooManyBytes = "€".repeat(30); // 30 characters, 90 bytes

    expect(messages(passwordSchema.safeParse(tooManyBytes))).toEqual([
      "Password is too long, use fewer special characters",
    ]);
    expect(passwordSchema.safeParse("€".repeat(24)).success).toBe(true); // 72 bytes
  });
});

describe("getCredentialsSchema", () => {
  const valid = {
    name: "Ann",
    email: "ann@example.com",
    password: "secret123",
  };

  it("sign-in needs only email and password", () => {
    const schema = getCredentialsSchema("signin");

    expect(
      schema.safeParse({ email: valid.email, password: valid.password })
        .success,
    ).toBe(true);
    expect(
      schema.safeParse({ email: "nope", password: valid.password }).success,
    ).toBe(false);
  });

  it("registration trims the name and caps it at 100 characters", () => {
    const schema = getCredentialsSchema("register");

    expect(schema.safeParse({ ...valid, name: "  Ann Lee " })).toMatchObject({
      success: true,
      data: { name: "Ann Lee" },
    });
    expect(
      schema.safeParse({ ...valid, name: "a".repeat(100) }).success,
    ).toBe(true);
    expect(
      messages(schema.safeParse({ ...valid, name: "a".repeat(101) })),
    ).toEqual(["Name must contain no more than 100 characters"]);
  });

  it("registration also needs a name of at least 2 characters", () => {
    const schema = getCredentialsSchema("register");

    expect(schema.safeParse(valid).success).toBe(true);
    expect(messages(schema.safeParse({ ...valid, name: "A" }))).toEqual([
      "Name must contain at least 2 characters",
    ]);
    expect(
      schema.safeParse({ email: valid.email, password: valid.password })
        .success,
    ).toBe(false);
  });
});
