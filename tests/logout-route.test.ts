import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const logoutRouteSource = readFileSync(join(process.cwd(), "src/app/api/auth/logout/route.ts"), "utf8");

describe("logout route", () => {
  it("redirects browser form submissions to the login page after clearing the session", () => {
    assert.match(logoutRouteSource, /NextResponse\.redirect/);
    assert.match(logoutRouteSource, /new URL\("\/login", req\.url\)/);
  });
});
