import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const source = resolve(
  root,
  "docs/source-packages/agentic_payments_codex_ready_v0.2",
);
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const generated = JSON.parse(
  read("artifacts/stablecoin-hub/src/data/agentic-payments-v02.generated.json"),
);
const qa = JSON.parse(
  read("docs/source-packages/agentic-payments-final-content-qa.json"),
);

test("frozen classifications, cards and copy are unchanged; timeline changes are limited to the authorized source addendum", () => {
  for (const [key, path] of [
    ["protocols", "cards/PROTOCOL_CARDS.json"],
    ["ecosystem", "cards/ECOSYSTEM_CARDS.json"],
    ["labels", "FACT_LABELS.json"],
  ])
    assert.deepEqual(
      generated[key],
      JSON.parse(readFileSync(resolve(source, path), "utf8")),
    );
  assert.equal(
    generated.copy.zh,
    readFileSync(resolve(source, "content/CONTENT_MASTER.zh-CN.md"), "utf8"),
  );
  assert.equal(
    generated.copy.en,
    readFileSync(resolve(source, "content/CONTENT_MASTER.en.md"), "utf8"),
  );
  const originalTimeline = JSON.parse(
    readFileSync(resolve(source, "visuals/TIMELINE_DATA.json"), "utf8"),
  );
  const expected = originalTimeline.map(
    (e: { date: string; title: string; source_id: string }) => ({
      ...e,
      source_id:
        qa.timeline_source_updates.find(
          (u: { date: string; title: string }) =>
            u.date === e.date && u.title === e.title,
        )?.source_id ?? e.source_id,
    }),
  );
  assert.deepEqual(generated.timeline, expected);
  assert.deepEqual(generated.finalContentQA, qa);
});
test("six frozen SVGs are copied byte-for-byte, without substituted screenshot assets", () => {
  const files = readdirSync(
    resolve(root, "artifacts/stablecoin-hub/public/agentic-payments/v0.2"),
  );
  assert.equal(files.length, 6);
  for (const file of files) {
    assert.match(file, /^AGT-D0[1-6].*\.svg$/);
    const original = readFileSync(resolve(source, "visuals/final", file));
    const output = readFileSync(
      resolve(
        root,
        "artifacts/stablecoin-hub/public/agentic-payments/v0.2",
        file,
      ),
    );
    assert.deepEqual(output, original);
    assert.equal(
      generated.hashes[file],
      createHash("sha256").update(original).digest("hex"),
    );
    assert.equal(generated.svg[file.slice(0, 7)], original.toString());
    assert.doesNotMatch(
      original.toString(),
      /<script|<image|<foreignObject|\son\w+=/i,
    );
  }
});
test("classification and UNKNOWN boundaries are preserved", () => {
  const find = (id: string) =>
    generated.protocols.find((p: { id: string }) => p.id === id);
  assert.equal(generated.protocols.length, 9);
  assert.equal(find("apop").artifact_type, "PROTOCOL_FRAMEWORK");
  assert.equal(find("a402").artifact_type, "PAYMENT_METHOD_SPEC");
  assert.equal(
    find("a402").detail_route,
    "/agentic-payments/scenarios#api-pay",
  );
  assert.equal(find("a2p2"), undefined);
  assert.equal(find("amp").stablecoin, "Unknown for nano-settlement");
  for (const id of ["act", "apop", "a402"])
    assert.equal(find(id).stablecoin, "No verified direct link");
  const jd = generated.ecosystem.find((e: { id: string }) => e.id === "jd");
  assert.equal(
    jd.protocols,
    "No independent public agent-payment protocol found",
  );
  const x = generated.ecosystem.find((e: { id: string }) => e.id === "x-xai");
  assert.equal(x.stablecoin, "No verified direct link");
});
test("official addendum closes two gaps; the unverified association notice remains UNKNOWN with no substitute link", () => {
  const ids = new Set(
    generated.sources.map((s: { source_id: string }) => s.source_id),
  );
  assert.equal(ids.size, 32);
  for (const p of generated.protocols)
    for (const id of p.source_ids.split(";")) assert.ok(ids.has(id), id);
  for (const e of generated.timeline)
    if (e.source_id) assert.ok(ids.has(e.source_id), e.source_id);
  assert.equal(
    generated.timeline.filter((e: { source_id: string }) => !e.source_id)
      .length,
    1,
  );
  assert.deepEqual(generated.sources.slice(30), qa.additional_sources);
  const unresolved = generated.timeline.find(
    (e: { date: string }) => e.date === "2026-08-24",
  );
  assert.equal(unresolved.source_id, "");
  assert.equal(
    qa.timeline_source_updates.find(
      (e: { date: string }) => e.date === "2026-08-24",
    ).status,
    "UNKNOWN",
  );
  for (const date of ["2025-09-04", "2026-05-08"]) {
    const event = generated.timeline.find(
      (e: { date: string }) => e.date === date,
    );
    const record = generated.sources.find(
      (s: { source_id: string }) => s.source_id === event.source_id,
    );
    assert.equal(record.status, "VERIFIED");
    assert.ok(
      ["www.ant-intl.com", "www.cac.gov.cn"].includes(
        new URL(record.url).hostname,
      ),
    );
  }
  assert.equal(qa.remaining_source_gaps, 1);
  for (const s of generated.sources)
    assert.equal(new URL(s.url).protocol, "https:");
});
test("APOP release/event date and official publication date remain distinct", () => {
  assert.equal(
    generated.protocols.find((p: { id: string }) => p.id === "apop")
      .first_release,
    "2026-04-02",
  );
  assert.equal(
    generated.timeline.find(
      (e: { source_id: string }) => e.source_id === "SRC-APOP-01",
    ).date,
    "2026-04-02",
  );
  assert.equal(
    generated.sources.find(
      (s: { source_id: string }) => s.source_id === "SRC-APOP-01",
    ).date,
    "2026-04-03",
  );
  assert.match(
    read("artifacts/stablecoin-hub/src/components/agentic-payment-ui.tsx"),
    /Source publication/,
  );
});
test("factual boundary wording remains explicit in both languages without promoting products or validation to protocols or availability", () => {
  assert.match(
    generated.copy.en,
    /Stablecoin is one payment rail, not the whole agentic-payment stack/,
  );
  assert.match(generated.copy.zh, /智能体支付不等于稳定币支付/);
  assert.match(
    generated.copy.en,
    /not a fully independent open standard|not label A402 as a fully independent open standard/i,
  );
  assert.match(generated.copy.zh, /完整字段级公开 specification 当前仍不足/);
  const page = read("artifacts/stablecoin-hub/src/pages/agentic-payments.tsx");
  assert.match(page, /生产系统验证，不等于全面开放/);
  assert.match(page, /Partnership|PARTNERSHIP/);
  assert.match(page, /Pilot|PILOT/);
  assert.match(generated.labels.artifact_type.PRODUCT, /product/i);
  assert.match(
    generated.labels.artifact_type.INFRASTRUCTURE,
    /infrastructure/i,
  );
  assert.match(
    generated.labels.maturity.PRODUCTION_VALIDATION,
    /not equivalent to general availability/i,
  );
  assert.match(generated.labels.maturity.PARTNERSHIP, /announcement/i);
});
test("canonical routes, compatibility alias and held-route redirect are implemented", () => {
  const app = read("artifacts/stablecoin-hub/src/App.tsx");
  const page = read("artifacts/stablecoin-hub/src/pages/agentic-payments.tsx");
  for (const route of [
    "/agentic-payments",
    "/agentic-payments/protocols",
    "/agentic-payments/scenarios",
    "/agentic-payments/ecosystem",
    "/agentic-payments/protocols/:id",
    "/protocols/:id",
  ])
    assert.ok(app.includes(`path="${route}"`), route);
  assert.match(page, /id === "a2p2"|id==='a2p2'/);
  assert.match(page, /Redirect/);
  assert.equal(
    generated.protocols.filter((p: { id: string }) => p.id !== "a402").length,
    8,
  );
});
