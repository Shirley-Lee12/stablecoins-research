import { Router } from "express";
import { db, issuerDisclosuresTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAdmin, requireAuth } from "./auth";

const router = Router();
const REVIEW_STATES = new Set(["draft", "reviewed", "published"]);

function parseId(raw: string) {
  const id = Number.parseInt(raw, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function values(body: Record<string, unknown>) {
  return {
    issuerSlug: body.issuer_slug as string,
    issuerName: body.issuer_name as string,
    productSymbols: Array.isArray(body.product_symbols) ? body.product_symbols.map(String) : [],
    reportPeriodEnd: body.report_period_end as string,
    publishedAt: body.published_at ? new Date(String(body.published_at)) : null,
    sourceUrl: body.source_url as string,
    sourceType: body.source_type as string,
    reserveTotalUsd: body.reserve_total_usd == null ? null : Number(body.reserve_total_usd),
    reserveComponents: Array.isArray(body.reserve_components) ? body.reserve_components : [],
    maturityProfile: body.maturity_profile ? String(body.maturity_profile) : null,
    custodians: Array.isArray(body.custodians) ? body.custodians.map(String) : [],
    counterparties: Array.isArray(body.counterparties) ? body.counterparties.map(String) : [],
    redemptionTerms: body.redemption_terms ? String(body.redemption_terms) : null,
    assuranceProvider: body.assurance_provider ? String(body.assurance_provider) : null,
    assuranceType: body.assurance_type ? String(body.assurance_type) : null,
    assuranceLagDays: body.assurance_lag_days == null ? null : Number(body.assurance_lag_days),
    revenueStructure: body.revenue_structure ? String(body.revenue_structure) : null,
    reportedEarningsUsd: body.reported_earnings_usd == null ? null : Number(body.reported_earnings_usd),
    notes: body.notes ? String(body.notes) : null,
    reviewStatus: body.review_status ? String(body.review_status) : "draft",
  };
}

router.get("/issuer-disclosures", async (req, res) => {
  try {
    const rows = await db.select().from(issuerDisclosuresTable)
      .where(eq(issuerDisclosuresTable.reviewStatus, "published"))
      .orderBy(desc(issuerDisclosuresTable.reportPeriodEnd));
    res.json(rows);
  } catch (error) {
    req.log.error(error, "Unable to load issuer disclosures");
    res.status(500).json({ error: "Failed to fetch issuer disclosures" });
  }
});

router.get("/admin/issuer-disclosures", requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await db.select().from(issuerDisclosuresTable).orderBy(desc(issuerDisclosuresTable.reportPeriodEnd)));
  } catch (error) {
    req.log.error(error, "Unable to load issuer disclosure review queue");
    res.status(500).json({ error: "Failed to fetch issuer disclosure review queue" });
  }
});

router.post("/admin/issuer-disclosures", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const required = ["issuer_slug", "issuer_name", "report_period_end", "source_url", "source_type"];
    if (required.some((field) => !String(req.body[field] ?? "").trim())) {
      res.status(400).json({ error: "issuer_slug, issuer_name, report_period_end, source_url and source_type are required" });
      return;
    }
    const input = values(req.body);
    if (!REVIEW_STATES.has(input.reviewStatus)) {
      res.status(400).json({ error: "Invalid review_status" });
      return;
    }
    const [created] = await db.insert(issuerDisclosuresTable).values({ ...input, createdBy: req.user.userId }).returning();
    res.status(201).json(created);
  } catch (error) {
    req.log.error(error, "Unable to create issuer disclosure");
    res.status(500).json({ error: "Failed to create issuer disclosure" });
  }
});

router.patch("/admin/issuer-disclosures/:id", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid disclosure ID" }); return; }
    const nextStatus = req.body.review_status ? String(req.body.review_status) : undefined;
    if (nextStatus && !REVIEW_STATES.has(nextStatus)) { res.status(400).json({ error: "Invalid review_status" }); return; }
    const input = values({ ...req.body, review_status: nextStatus ?? "draft" });
    const updates = Object.fromEntries(Object.entries(input).filter(([key]) => {
      const snake = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      return Object.prototype.hasOwnProperty.call(req.body, snake);
    }));
    const publishing = nextStatus === "reviewed" || nextStatus === "published";
    const [updated] = await db.update(issuerDisclosuresTable).set({
      ...updates,
      ...(publishing ? { reviewedBy: req.user.userId, reviewedAt: new Date() } : {}),
      updatedAt: new Date(),
    }).where(eq(issuerDisclosuresTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Issuer disclosure not found" }); return; }
    res.json(updated);
  } catch (error) {
    req.log.error(error, "Unable to update issuer disclosure");
    res.status(500).json({ error: "Failed to update issuer disclosure" });
  }
});

export default router;
