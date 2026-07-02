import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const homePageSource = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");

describe("page authentication", () => {
  it("requires admin authentication before rendering the homepage directory", () => {
    assert.match(homePageSource, /import \{ requireAdmin \} from "@\/lib\/session";/);

    const authCallIndex = homePageSource.indexOf("await requireAdmin();");
    const firstDirectoryQueryIndex = homePageSource.indexOf("db.query.sites.findMany");

    assert.notEqual(authCallIndex, -1);
    assert.ok(authCallIndex < firstDirectoryQueryIndex);
  });
});
