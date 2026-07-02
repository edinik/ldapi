import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const loginRouteSource = readFileSync(join(process.cwd(), "src/app/api/auth/login/route.ts"), "utf8");

describe("login TOTP route", () => {
  it("requires a valid TOTP code when the admin user has a TOTP secret", () => {
    assert.match(loginRouteSource, /import \{ verifyTotpCode \} from "@\/lib\/totp";/);
    assert.match(loginRouteSource, /const \{ username, password, totpCode \} = await req\.json\(\);/);
    assert.match(loginRouteSource, /user\.totpSecret && !verifyTotpCode\(user\.totpSecret, totpCode\)/);
    assert.match(loginRouteSource, /验证码错误/);
  });
});
