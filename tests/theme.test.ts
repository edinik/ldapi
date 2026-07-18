import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getNextTheme,
  parseThemePreference,
  resolveTheme,
  themeStorageKey,
} from "../src/lib/theme";

describe("theme preference contract", () => {
  it("uses a stable browser-local storage key", () => {
    assert.equal(themeStorageKey, "ldapi-theme");
  });

  it("accepts only explicit light and dark preferences", () => {
    assert.equal(parseThemePreference("light"), "light");
    assert.equal(parseThemePreference("dark"), "dark");
    assert.equal(parseThemePreference("system"), null);
    assert.equal(parseThemePreference(""), null);
    assert.equal(parseThemePreference(null), null);
    assert.equal(parseThemePreference(undefined), null);
  });

  it("prefers a stored theme over the operating system", () => {
    assert.equal(resolveTheme("light", true), "light");
    assert.equal(resolveTheme("dark", false), "dark");
  });

  it("follows the operating system when no explicit preference exists", () => {
    assert.equal(resolveTheme(null, true), "dark");
    assert.equal(resolveTheme(null, false), "light");
  });

  it("toggles between light and dark", () => {
    assert.equal(getNextTheme("light"), "dark");
    assert.equal(getNextTheme("dark"), "light");
  });
});
