import { createHash, randomBytes } from "node:crypto";
import { base64urlEncode } from "./crypto";

export const createState = (bytes = 16) => base64urlEncode(randomBytes(bytes));
export const createNonce = (bytes = 16) => base64urlEncode(randomBytes(bytes));

export const createPkcePair = () => {
  // Base64url(32 bytes) => 43 chars, valid for PKCE code_verifier length requirements.
  const codeVerifier = base64urlEncode(randomBytes(32));
  const codeChallenge = base64urlEncode(createHash("sha256").update(codeVerifier).digest());
  return { codeVerifier, codeChallenge };
};

export const createOAuthStateAndPkce = (options?: { includeNonce?: boolean }) => {
  const state = createState();
  const { codeVerifier, codeChallenge } = createPkcePair();
  const nonce = options?.includeNonce ? createNonce() : undefined;
  return { state, codeVerifier, codeChallenge, nonce };
};
