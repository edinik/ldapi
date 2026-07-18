export const backupFilenameHeader = "X-LDAPI-Backup-Filename";

type SecureBackupRequestInput = {
  nodeEnvironment: string | undefined;
  requestUrl: string;
  forwardedProto: string | null;
};

export function isSecureBackupRequest({
  nodeEnvironment,
  requestUrl,
  forwardedProto,
}: SecureBackupRequestInput) {
  if (nodeEnvironment !== "production") {
    return true;
  }

  const directProtocol = new URL(requestUrl).protocol;
  const proxyProtocol = forwardedProto?.split(",", 1)[0]?.trim().toLowerCase();
  return directProtocol === "https:" || proxyProtocol === "https";
}

export function createBackupResponseHeaders(filename: string) {
  return {
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Type": "application/vnd.sqlite3",
    Pragma: "no-cache",
    [backupFilenameHeader]: filename,
  };
}
