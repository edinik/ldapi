import { db } from "@/db";
import { requireAdmin } from "@/lib/session";
import { getHomeDirectoryData } from "./get-home-directory-data";
import { loadAuthenticatedDirectory } from "./load-authenticated-directory";

export function getHomePageData() {
  return loadAuthenticatedDirectory(requireAdmin, () => getHomeDirectoryData(db));
}
