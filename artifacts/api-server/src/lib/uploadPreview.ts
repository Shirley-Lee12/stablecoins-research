import { randomBytes } from "node:crypto";

interface PreviewRecord {
  userId: number;
  tagIds: number[];
  tagScores: Record<number, number>;
  expiresAt: number;
}

const previews = new Map<string, PreviewRecord>();
const PREVIEW_TTL_MS = 15 * 60 * 1000;

export function createUploadPreview(userId: number, tagIds: number[], tagScores: Record<number, number>): string {
  const now = Date.now();
  for (const [id, record] of previews) if (record.expiresAt <= now) previews.delete(id);
  const id = randomBytes(32).toString("base64url");
  previews.set(id, { userId, tagIds: [...new Set(tagIds)], tagScores, expiresAt: now + PREVIEW_TTL_MS });
  return id;
}

export function consumeUploadPreview(id: string, userId: number): PreviewRecord | null {
  const record = previews.get(id);
  previews.delete(id);
  if (!record || record.userId !== userId || record.expiresAt <= Date.now()) return null;
  return record;
}
