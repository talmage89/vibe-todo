import { describe, expect, test } from "bun:test";
import { signJson, verifySignedJson } from "../crypto";

describe("auth/crypto", () => {
  test("signJson + verifySignedJson roundtrip", () => {
    const secret = "x".repeat(64);
    const value = signJson({ a: 1, b: "two" }, secret);

    const parsed = verifySignedJson(value, secret, (p): p is { a: number; b: string } => {
      if (!p || typeof p !== "object") return false;
      const obj = p as Record<string, unknown>;
      return typeof obj.a === "number" && typeof obj.b === "string";
    });

    expect(parsed).toEqual({ a: 1, b: "two" });
  });

  test("verifySignedJson rejects tampering", () => {
    const secret = "x".repeat(64);
    const value = signJson({ a: 1 }, secret);
    const tampered = `${value.slice(0, -1)}${value.slice(-1) === "A" ? "B" : "A"}`;

    const parsed = verifySignedJson(tampered, secret, (_): _ is { a: number } => true);
    expect(parsed).toBeNull();
  });

  test("verifySignedJson rejects wrong secret", () => {
    const value = signJson({ a: 1 }, "x".repeat(64));
    const parsed = verifySignedJson(value, "y".repeat(64), (_): _ is { a: number } => true);
    expect(parsed).toBeNull();
  });
});
