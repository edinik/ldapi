import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { verifyTurnstileToken } from "../src/lib/turnstile";

describe("Turnstile verification", () => {
  it("returns true when TURNSTILE_SECRET_KEY is not configured", async () => {
    const originalKey = process.env.TURNSTILE_SECRET_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;

    const result = await verifyTurnstileToken("any-token");
    assert.equal(result, true);

    if (originalKey) {
      process.env.TURNSTILE_SECRET_KEY = originalKey;
    }
  });

  it("returns true for successful verification", async () => {
    const originalKey = process.env.TURNSTILE_SECRET_KEY;
    const originalFetch = global.fetch;

    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    global.fetch = mock.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response),
    );

    const result = await verifyTurnstileToken("valid-token");
    assert.equal(result, true);

    global.fetch = originalFetch;
    if (originalKey) {
      process.env.TURNSTILE_SECRET_KEY = originalKey;
    } else {
      delete process.env.TURNSTILE_SECRET_KEY;
    }
  });

  it("returns false for failed verification", async () => {
    const originalKey = process.env.TURNSTILE_SECRET_KEY;
    const originalFetch = global.fetch;

    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    global.fetch = mock.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            "error-codes": ["invalid-input-response"],
          }),
      } as Response),
    );

    const result = await verifyTurnstileToken("invalid-token");
    assert.equal(result, false);

    global.fetch = originalFetch;
    if (originalKey) {
      process.env.TURNSTILE_SECRET_KEY = originalKey;
    } else {
      delete process.env.TURNSTILE_SECRET_KEY;
    }
  });

  it("returns false when API request fails", async () => {
    const originalKey = process.env.TURNSTILE_SECRET_KEY;
    const originalFetch = global.fetch;

    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    global.fetch = mock.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      } as Response),
    );

    const result = await verifyTurnstileToken("any-token");
    assert.equal(result, false);

    global.fetch = originalFetch;
    if (originalKey) {
      process.env.TURNSTILE_SECRET_KEY = originalKey;
    } else {
      delete process.env.TURNSTILE_SECRET_KEY;
    }
  });

  it("returns false when network error occurs", async () => {
    const originalKey = process.env.TURNSTILE_SECRET_KEY;
    const originalFetch = global.fetch;

    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    global.fetch = mock.fn(() => Promise.reject(new Error("Network error")));

    const result = await verifyTurnstileToken("any-token");
    assert.equal(result, false);

    global.fetch = originalFetch;
    if (originalKey) {
      process.env.TURNSTILE_SECRET_KEY = originalKey;
    } else {
      delete process.env.TURNSTILE_SECRET_KEY;
    }
  });
});
