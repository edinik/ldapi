import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadAuthenticatedDirectory } from "../src/server/directory/load-authenticated-directory";

describe("page authentication", () => {
  it("authenticates before loading homepage directory data", async () => {
    const calls: string[] = [];
    const directory = { sites: [], models: [], resources: [] };

    const result = await loadAuthenticatedDirectory(
      async () => {
        calls.push("authenticate");
      },
      async () => {
        calls.push("load-directory");
        return directory;
      },
    );

    assert.deepEqual(calls, ["authenticate", "load-directory"]);
    assert.equal(result, directory);
  });

  it("does not load directory data when authentication fails", async () => {
    let loaded = false;

    await assert.rejects(
      loadAuthenticatedDirectory(
        async () => {
          throw new Error("redirect");
        },
        async () => {
          loaded = true;
          return { sites: [], models: [], resources: [] };
        },
      ),
      /redirect/,
    );

    assert.equal(loaded, false);
  });
});
