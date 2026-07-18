import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  backupFilenameHeader,
  createBackupResponseHeaders,
  isSecureBackupRequest,
} from "../src/lib/backup-http";

describe("backup HTTP contract", () => {
  it("allows local HTTP outside production", () => {
    assert.equal(
      isSecureBackupRequest({
        nodeEnvironment: "development",
        requestUrl: "http://localhost:3000/api/backup",
        forwardedProto: null,
      }),
      true,
    );
  });

  it("requires direct or proxy HTTPS in production", () => {
    assert.equal(
      isSecureBackupRequest({
        nodeEnvironment: "production",
        requestUrl: "https://example.com/api/backup",
        forwardedProto: null,
      }),
      true,
    );
    assert.equal(
      isSecureBackupRequest({
        nodeEnvironment: "production",
        requestUrl: "http://127.0.0.1:3000/api/backup",
        forwardedProto: "https, http",
      }),
      true,
    );
    assert.equal(
      isSecureBackupRequest({
        nodeEnvironment: "production",
        requestUrl: "http://127.0.0.1:3000/api/backup",
        forwardedProto: "http",
      }),
      false,
    );
  });

  it("returns an attachment contract that forbids caching", () => {
    const filename = "ldapi-backup-20260718T080910123Z.sqlite";
    const headers = createBackupResponseHeaders(filename);

    assert.deepEqual(headers, {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "application/vnd.sqlite3",
      Pragma: "no-cache",
      [backupFilenameHeader]: filename,
    });
  });
});
