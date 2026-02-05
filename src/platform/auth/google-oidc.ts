import { createRemoteJWKSet, jwtVerify } from "jose";

export type GoogleIdTokenClaims = {
  iss: string;
  aud: string | string[];
  sub: string;
  exp: number;
  iat: number;
  nonce?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

const googleIssuers = ["https://accounts.google.com", "accounts.google.com"];

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export const verifyGoogleIdToken = async (options: {
  idToken: string;
  clientId: string;
  expectedNonce: string;
}): Promise<GoogleIdTokenClaims> => {
  const { idToken, clientId, expectedNonce } = options;

  const { payload } = await jwtVerify(idToken, googleJwks, {
    issuer: googleIssuers,
    audience: clientId,
  });

  const claims = payload as unknown as Partial<GoogleIdTokenClaims>;

  if (typeof claims.sub !== "string" || !claims.sub) {
    throw new Error("Invalid Google ID token: missing sub");
  }

  if (typeof claims.nonce !== "string" || !claims.nonce) {
    throw new Error("Invalid Google ID token: missing nonce");
  }

  if (claims.nonce !== expectedNonce) {
    throw new Error("Invalid Google ID token nonce");
  }

  return claims as GoogleIdTokenClaims;
};
