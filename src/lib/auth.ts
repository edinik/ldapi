import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { sessions, adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const hashBuffer = Buffer.from(hash, "hex");
  const testBuffer = scryptSync(password, salt, 64);
  return timingSafeEqual(hashBuffer, testBuffer);
}

export function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: number): Promise<string> {
  const id = generateSessionId();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await db.insert(sessions).values({ id, userId, expiresAt });
  return id;
}

export async function validateSession(sessionId: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return null;
  }
  return session;
}

export async function deleteSession(sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function getAdminUser(username: string) {
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, username))
    .limit(1);
  return user ?? null;
}
