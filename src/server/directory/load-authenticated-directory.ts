import type { HomeDirectoryData } from "./types";

export async function loadAuthenticatedDirectory(
  authenticate: () => Promise<unknown>,
  loadDirectory: () => Promise<HomeDirectoryData>,
) {
  await authenticate();
  return loadDirectory();
}
