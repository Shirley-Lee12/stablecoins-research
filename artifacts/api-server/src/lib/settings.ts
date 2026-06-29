import { db, appSettingsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

/** Admin-editable settings keys. DB value wins; falls back to the matching env var. */
export const SETTINGS_KEYS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "LLM_API_KEY"] as const;
export type SettingsKey = (typeof SETTINGS_KEYS)[number];

export async function getSetting(key: SettingsKey): Promise<string | undefined> {
  const [row] = await db.select({ value: appSettingsTable.value }).from(appSettingsTable).where(eq(appSettingsTable.key, key)).limit(1);
  return row?.value ?? process.env[key];
}

export async function getAllSettings(): Promise<Record<SettingsKey, string | undefined>> {
  const rows = await db.select().from(appSettingsTable).where(inArray(appSettingsTable.key, SETTINGS_KEYS as unknown as string[]));
  const fromDb = new Map(rows.map((r) => [r.key, r.value]));
  const result = {} as Record<SettingsKey, string | undefined>;
  for (const key of SETTINGS_KEYS) {
    result[key] = fromDb.get(key) ?? process.env[key];
  }
  return result;
}

export async function setSetting(key: SettingsKey, value: string): Promise<void> {
  await db
    .insert(appSettingsTable)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettingsTable.key, set: { value, updatedAt: new Date() } });
}
