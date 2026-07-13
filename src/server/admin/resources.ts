import { eq } from "drizzle-orm";
import { resources } from "@/db/schema";
import type { AppDb } from "@/db/types";

export type ResourceWrite = typeof resources.$inferInsert;

export async function createResource(database: AppDb, data: ResourceWrite) {
  const [resource] = await database.insert(resources).values(data).returning();
  return resource;
}

export async function updateResource(database: AppDb, resourceId: number, data: ResourceWrite) {
  await database
    .update(resources)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(resources.id, resourceId));
}

export async function deleteResource(database: AppDb, resourceId: number) {
  await database.delete(resources).where(eq(resources.id, resourceId));
}
