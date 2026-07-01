import "dotenv/config";
import { db, rejectionReasonsTable, pool, type InsertRejectionReason } from "@workspace/db";

// Source: docs/planning/12-必填规则与审核拒绝理由.md §2.2.
// Idempotent — re-running only fills in reasons that don't exist yet (matched by slug).

const rejectionReasons: InsertRejectionReason[] = [
  { slug: "invalid_url_doi", nameZh: "URL/DOI 失效或不符", nameEn: "Invalid or mismatched URL/DOI" },
  { slug: "author_error", nameZh: "作者信息有误", nameEn: "Incorrect author information" },
  { slug: "year_error", nameZh: "年份错误", nameEn: "Incorrect publication year" },
  { slug: "low_quality_source", nameZh: "来源质量存疑", nameEn: "Questionable source quality" },
  { slug: "off_topic", nameZh: "与稳定币研究方向无关", nameEn: "Not related to stablecoin research" },
  { slug: "duplicate", nameZh: "重复资源", nameEn: "Duplicate resource" },
  { slug: "incomplete_info", nameZh: "摘要/关键信息不完整", nameEn: "Incomplete abstract or key information" },
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
