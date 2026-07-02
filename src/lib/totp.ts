import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;

export function normalizeTotpCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s/g, "");
  return /^\d{6}$/.test(normalized) ? normalized : null;
}

export function generateTotpSecret(): string {
  return encodeBase32(randomBytes(20));
}

export function isValidBase32Secret(secret: string): boolean {
  try {
    decodeBase32(secret);
    return true;
  } catch {
    return false;
  }
}

export function generateTotpCode(secret: string, now = new Date()): string {
  const counter = Math.floor(now.getTime() / 1000 / TOTP_PERIOD_SECONDS);
  return generateHotpCode(secret, counter);
}

export function verifyTotpCode(secret: string, code: unknown, now = new Date()): boolean {
  const normalizedCode = normalizeTotpCode(code);
  if (!normalizedCode) return false;

  const counter = Math.floor(now.getTime() / 1000 / TOTP_PERIOD_SECONDS);
  return [-1, 0, 1].some((windowOffset) => {
    const expected = generateHotpCode(secret, counter + windowOffset);
    return secureCompare(expected, normalizedCode);
  });
}

export function createTotpUri({
  issuer,
  accountName,
  secret,
}: {
  issuer: string;
  accountName: string;
  secret: string;
}) {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}

function generateHotpCode(secret: string, counter: number): string {
  const key = decodeBase32(secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

function encodeBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function decodeBase32(secret: string): Buffer {
  const normalized = secret.replace(/\s/g, "").replace(/=+$/g, "").toUpperCase();
  if (!normalized || /[^A-Z2-7]/.test(normalized)) {
    throw new Error("Invalid base32 secret");
  }

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of normalized) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(char);
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function secureCompare(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}
