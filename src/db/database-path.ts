import path from "node:path";

export function getDatabasePath(rootDirectory = process.cwd()) {
  return path.join(rootDirectory, "data", "sqlite.db");
}

export const databasePath = getDatabasePath();
