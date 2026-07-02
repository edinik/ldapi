import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createTotpUri,
  generateTotpCode,
  isValidBase32Secret,
  normalizeTotpCode,
  verifyTotpCode,
} from "../src/lib/totp";

const rfcSecret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("totp helpers", () => {
  it("generates RFC 6238 compatible 6 digit codes", () => {
    assert.equal(generateTotpCode(rfcSecret, new Date(59_000)), "287082");
    assert.equal(generateTotpCode(rfcSecret, new Date(1_111_111_109_000)), "081804");
    assert.equal(generateTotpCode(rfcSecret, new Date(2_000_000_000_000)), "279037");
  });

  it("accepts the current, previous, or next time step only", () => {
    const now = new Date(59_000);
    assert.equal(verifyTotpCode(rfcSecret, "287082", now), true);
    assert.equal(verifyTotpCode(rfcSecret, "081804", now), false);
  });

  it("normalizes human-entered codes and rejects invalid input", () => {
    assert.equal(normalizeTotpCode(" 123 456 "), "123456");
    assert.equal(normalizeTotpCode("12345"), null);
    assert.equal(normalizeTotpCode("abcdef"), null);
  });

  it("validates base32 secrets and creates an authenticator URI", () => {
    assert.equal(isValidBase32Secret(rfcSecret), true);
    assert.equal(isValidBase32Secret("not-a-secret"), false);

    assert.equal(
      createTotpUri({ issuer: "LDAPI", accountName: "admin", secret: rfcSecret }),
      "otpauth://totp/LDAPI:admin?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=LDAPI&algorithm=SHA1&digits=6&period=30",
    );
  });
});
