import { describe, expect, test } from "bun:test";
import { createNonce, createOAuthStateAndPkce, createPkcePair, createState } from "../oauth-flow";

describe("auth/oauth-flow", () => {
  test("createState looks URL-safe", () => {
    const state = createState();
    expect(state.length).toBeGreaterThanOrEqual(16);
    expect(state).not.toMatch(/[+/=]/);
  });

  test("createNonce looks URL-safe", () => {
    const nonce = createNonce();
    expect(nonce.length).toBeGreaterThanOrEqual(16);
    expect(nonce).not.toMatch(/[+/=]/);
  });

  test("createPkcePair produces verifier + S256 challenge", () => {
    const { codeVerifier, codeChallenge } = createPkcePair();
    // Commonly 43 chars when using 32 random bytes base64url.
    expect(codeVerifier.length).toBe(43);
    expect(codeVerifier).not.toMatch(/[+/=]/);
    expect(codeChallenge).not.toMatch(/[+/=]/);
  });

  test("createOAuthStateAndPkce supports nonce option", () => {
    const withNonce = createOAuthStateAndPkce({ includeNonce: true });
    expect(withNonce.nonce).toBeTruthy();

    const withoutNonce = createOAuthStateAndPkce();
    expect(withoutNonce.nonce).toBeUndefined();
  });
});
