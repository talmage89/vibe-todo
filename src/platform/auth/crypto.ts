import { createHmac, timingSafeEqual } from "node:crypto";

export const base64urlEncode = (input: Buffer) =>
  input.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

export const base64urlDecode = (input: string) => {
  const padded = input.replaceAll("-", "+").replaceAll("_", "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLen), "base64");
};

export const signJson = (payload: unknown, secret: string) => {
  const payloadB64 = base64urlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = base64urlEncode(createHmac("sha256", secret).update(payloadB64).digest());
  return `${payloadB64}.${sig}`;
};

export const verifySignedJson = <T>(
  value: string | undefined,
  secret: string,
  validate: (payload: unknown) => payload is T,
): T | null => {
  if (!value) return null;

  const [payloadB64, sigB64] = value.split(".");
  if (!payloadB64 || !sigB64) return null;

  const expectedSig = base64urlEncode(createHmac("sha256", secret).update(payloadB64).digest());
  const expectedSigBuf = Buffer.from(expectedSig, "utf8");
  const actualSigBuf = Buffer.from(sigB64, "utf8");
  if (expectedSigBuf.length !== actualSigBuf.length) return null;
  if (!timingSafeEqual(expectedSigBuf, actualSigBuf)) return null;

  try {
    const parsed = JSON.parse(base64urlDecode(payloadB64).toString("utf8")) as unknown;
    return validate(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
