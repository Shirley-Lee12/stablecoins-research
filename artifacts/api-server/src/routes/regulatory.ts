import { Router } from "express";
import { db, regulatoryEntriesTable } from "@workspace/db";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { requireAdmin, requireAuth } from "./auth";

const router = Router();

function serializeEntry(row: typeof regulatoryEntriesTable.$inferSelect) {
  return {
    id: row.id,
    country: row.country,
    region: row.region,
    authority: row.authority,
    title: row.title,
    title_zh: row.titleZh,
    summary: row.summary,
    summary_zh: row.summaryZh,
    document_url: row.documentUrl,
    effective_date: row.effectiveDate,
    category: row.category,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

function parseId(raw: string) {
  const id = Number.parseInt(raw, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.get("/regulatory-entries/timeline", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(regulatoryEntriesTable)
      .orderBy(desc(regulatoryEntriesTable.effectiveDate));

    const grouped = new Map<number, ReturnType<typeof serializeEntry>[]>();
    for (const row of rows) {
      const year = Number(row.effectiveDate.slice(0, 4));
      const entries = grouped.get(year) ?? [];
      entries.push(serializeEntry(row));
      grouped.set(year, entries);
    }

    res.json(
      Array.from(grouped, ([year, entries]) => ({ year, entries })).sort(
        (a, b) => b.year - a.year,
      ),
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch regulatory timeline" });
  }
});

router.get("/regulatory-entries/country-stats", async (req, res) => {
  try {
    const rows = await db
      .select({ country: regulatoryEntriesTable.country, count: count() })
      .from(regulatoryEntriesTable)
      .groupBy(regulatoryEntriesTable.country)
      .orderBy(desc(count()));
    res.json(rows.map((row) => ({ ...row, count: Number(row.count) })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch regulatory statistics" });
  }
});

router.get("/regulatory-entries", async (req, res) => {
  try {
    const { country, category, search } = req.query as Record<string, string>;
    const filters = [];
    if (country) filters.push(eq(regulatoryEntriesTable.country, country));
    if (category) filters.push(eq(regulatoryEntriesTable.category, category));
    if (search) {
      const pattern = `%${search}%`;
      filters.push(
        or(
          ilike(regulatoryEntriesTable.title, pattern),
          ilike(regulatoryEntriesTable.titleZh, pattern),
          ilike(regulatoryEntriesTable.summary, pattern),
          ilike(regulatoryEntriesTable.summaryZh, pattern),
          ilike(regulatoryEntriesTable.authority, pattern),
        )!,
      );
    }

    const rows = await db
      .select()
      .from(regulatoryEntriesTable)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(regulatoryEntriesTable.effectiveDate));
    res.json(rows.map(serializeEntry));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch regulatory entries" });
  }
});

router.get("/regulatory-entries/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid regulatory entry ID" });
      return;
    }
    const [row] = await db
      .select()
      .from(regulatoryEntriesTable)
      .where(eq(regulatoryEntriesTable.id, id))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Regulatory entry not found" });
      return;
    }
    res.json(serializeEntry(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch regulatory entry" });
  }
});

router.post(
  "/regulatory-entries",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        country,
        region,
        authority,
        title,
        title_zh,
        summary,
        summary_zh,
        document_url,
        effective_date,
        category,
      } = req.body;
      if (!country?.trim() || !title?.trim() || !effective_date) {
        res
          .status(400)
          .json({ error: "country, title, and effective_date are required" });
        return;
      }

      const [inserted] = await db
        .insert(regulatoryEntriesTable)
        .values({
          country: country.trim(),
          region: region?.trim() || null,
          authority: authority?.trim() || null,
          title: title.trim(),
          titleZh: title_zh?.trim() || null,
          summary: summary?.trim() || null,
          summaryZh: summary_zh?.trim() || null,
          documentUrl: document_url?.trim() || null,
          effectiveDate: effective_date,
          category: category?.trim() || null,
          createdBy: (req as any).user.userId,
        })
        .returning();
      res.status(201).json(serializeEntry(inserted));
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Failed to create regulatory entry" });
    }
  },
);

router.patch(
  "/regulatory-entries/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!id) {
        res.status(400).json({ error: "Invalid regulatory entry ID" });
        return;
      }
      const allowed = {
        country: req.body.country,
        region: req.body.region,
        authority: req.body.authority,
        title: req.body.title,
        titleZh: req.body.title_zh,
        summary: req.body.summary,
        summaryZh: req.body.summary_zh,
        documentUrl: req.body.document_url,
        effectiveDate: req.body.effective_date,
        category: req.body.category,
      };
      const updates = Object.fromEntries(
        Object.entries(allowed).filter(([, value]) => value !== undefined),
      );
      const [updated] = await db
        .update(regulatoryEntriesTable)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(regulatoryEntriesTable.id, id))
        .returning();
      if (!updated) {
        res.status(404).json({ error: "Regulatory entry not found" });
        return;
      }
      res.json(serializeEntry(updated));
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Failed to update regulatory entry" });
    }
  },
);

router.delete(
  "/regulatory-entries/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!id) {
        res.status(400).json({ error: "Invalid regulatory entry ID" });
        return;
      }
      const [deleted] = await db
        .delete(regulatoryEntriesTable)
        .where(eq(regulatoryEntriesTable.id, id))
        .returning({ id: regulatoryEntriesTable.id });
      if (!deleted) {
        res.status(404).json({ error: "Regulatory entry not found" });
        return;
      }
      res.status(204).send();
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Failed to delete regulatory entry" });
    }
  },
);

export default router;
