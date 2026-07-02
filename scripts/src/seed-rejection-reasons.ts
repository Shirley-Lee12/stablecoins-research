import "dotenv/config";
import { db, rejectionReasonsTable, pool, type InsertRejectionReason } from "@workspace/db";

// Source: docs/planning/15-用户反馈批量修复与优化.md §0.3.
// Trimmed from the original 9 (docs/planning/12 §2.2) down to 3 — the other 6 now each correspond
// to one of the four self-service states (incomplete/disputed/off_topic/duplicate) that get
// auto-detected and routed back to the submitter before ever reaching an admin, so they're no
// longer meaningful as a *manually selected* rejection reason. What's left is genuinely only
// choosable by an admin's own judgment call, not something a system check can determine.
// Idempotent — re-running only fills in reasons that don't exist yet (matched by slug).

const rejectionReasons: InsertRejectionReason[] = [
  { slug: "low_quality_source", nameZh: "来源质量存疑", nameEn: "Questionable source quality" },
  { slug: "authenticity_concern", nameZh: "信息真实性存疑", nameEn: "Authenticity concern" },
  { slug: "other", nameZh: "其他(见补充说明)", nameEn: "Other (see notes)" },
];

async function main() {
  const inserted = await db
    .insert(rejectionReasonsTable)
    .values(rejectionReasons)
    .onConflictDoNothing({ target: rejectionReasonsTable.slug })
    .returning({ slug: rejectionReasonsTable.slug });

  console.log(`Inserted ${inserted.length} new rejection reasons (${rejectionReasons.length - inserted.length} already existed, skipped).`);
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
