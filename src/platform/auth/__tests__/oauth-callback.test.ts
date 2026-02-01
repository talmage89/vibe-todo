import { describe, expect, test } from "bun:test";
import { parseOAuthCallbackQuery } from "../oauth-callback";

describe("auth/oauth-callback", () => {
  test("rejects invalid query shape", () => {
    const result = parseOAuthCallbackQuery({ code: 123 });
    expect(result.ok).toBe(false);
  });

  test("rejects explicit provider error", () => {
    const result = parseOAuthCallbackQuery({ error: "access_denied" });
    expect(result).toEqual({
      ok: false,
      status: 400,
      body: { error: "Authorization failed", details: "access_denied" },
    });
  });

  test("rejects missing code/state", () => {
    const result = parseOAuthCallbackQuery({ state: "x" });
    expect(result.ok).toBe(false);
  });

  test("accepts code+state", () => {
    const result = parseOAuthCallbackQuery({ code: "c", state: "s" });
    expect(result).toEqual({ ok: true, code: "c", state: "s" });
  });
});
