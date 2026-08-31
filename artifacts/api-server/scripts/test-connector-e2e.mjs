import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "../../../lib/db/node_modules/pg/esm/index.mjs";

const { Pool } = pg;
const apiBase = process.env.CONNECTOR_TEST_API || "http://127.0.0.1:3001/api";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const pool = new Pool({ connectionString: databaseUrl });
const marker = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
const email = `connector-e2e-${marker}@example.test`;
const password = `Connector-${crypto.randomBytes(12).toString("base64url")}`;
let userId = null;
let jobId = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, init = {}, expected = [200]) {
  const response = await fetch(`${apiBase}${path}`, init);
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  assert(expected.includes(response.status), `${init.method || "GET"} ${path} returned ${response.status}: ${body?.error || "unexpected response"}`);
  return { response, body };
}

try {
  const passwordHash = await bcrypt.hash(password, 10);
  const inserted = await pool.query(
    `insert into users (email, name, password_hash, role, email_verified, notification_email)
     values ($1, $2, $3, 'user', true, false) returning id`,
    [email, "Connector E2E", passwordHash],
  );
  userId = inserted.rows[0].id;

  const login = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const userToken = login.body.token;
  assert(typeof userToken === "string", "Login did not return a user token");

  const clientId = crypto.randomUUID();
  const created = await request("/connector/pairings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientName: "Connector E2E Browser" }),
  }, [201]);
  assert(created.body.code && created.body.pollSecret && created.body.pairingId, "Pairing response is incomplete");

  await request(`/connector/pairings/code/${encodeURIComponent(created.body.code)}`);
  const pending = await request(`/connector/pairings/${created.body.pairingId}/poll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pollSecret: created.body.pollSecret }),
  });
  assert(pending.body.status === "pending", "Pairing was not pending before authorization");

  await request(`/connector/pairings/${encodeURIComponent(created.body.code)}/authorize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const authorized = await request(`/connector/pairings/${created.body.pairingId}/poll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pollSecret: created.body.pollSecret }),
  });
  const connectorToken = authorized.body.token;
  assert(authorized.body.status === "authorized" && typeof connectorToken === "string", "Authorization did not issue a connector token");

  await request(`/connector/pairings/${created.body.pairingId}/poll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pollSecret: created.body.pollSecret }),
  }, [410]);
  await request("/connector/session", { headers: { Authorization: `Bearer ${connectorToken}` } });

  const title = `Stablecoin reserve transparency browser capture ${marker}`;
  const submitted = await request("/resources/upload/jobs/browser-capture", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${connectorToken}` },
    body: JSON.stringify({
      pageUrl: `https://example.org/stablecoin-research/${marker}`,
      metadata: {
        title,
        authors: ["Connector E2E Researcher"],
        abstract: "This research report evaluates stablecoin reserve transparency, redemption liquidity, issuer governance, and disclosure standards across regulated digital asset markets.",
        doi: "",
        publishedDate: "2026-08-31",
        keywords: ["stablecoin", "reserves", "transparency", "liquidity"],
        publisher: "ZIBS Connector Test",
        siteName: "Example Research",
        sourceType: "report",
        extractionMethod: "mixed",
      },
      visibleText: "Stablecoin reserve transparency requires verifiable reserve assets, liquid redemption channels, independent attestations, and clear issuer governance. This report compares disclosure standards and liquidity safeguards.",
    }),
  }, [202]);
  jobId = submitted.body.jobId;
  assert(Number.isInteger(jobId), "Capture did not create an upload job");

  let job = null;
  for (let attempt = 0; attempt < 45; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    const result = await request(`/resources/upload/jobs/${jobId}`, { headers: { Authorization: `Bearer ${userToken}` } });
    job = result.body;
    if (job.status === "ready_for_review" || job.status === "failed") break;
  }
  assert(job?.type === "browser_capture", "Created job has the wrong type");
  assert(job?.status === "ready_for_review", `Capture processing ended in ${job?.status || "unknown"}: ${job?.error || "no error"}`);
  assert(job.result?.draft?.title?.toLowerCase() === title.toLowerCase(), "Captured page title was not preserved");
  assert(job.result?.draft?.url?.includes("example.org/stablecoin-research/"), "Captured page URL was not preserved");
  assert(Array.isArray(job.result?.tags), "Capture result has no tag review data");

  await request("/connector/session", { method: "DELETE", headers: { Authorization: `Bearer ${connectorToken}` } }, [204]);
  await request("/connector/session", { headers: { Authorization: `Bearer ${connectorToken}` } }, [401]);

  console.log(JSON.stringify({
    ok: true,
    checks: ["login", "pairing", "single-use token delivery", "browser capture", "review queue", "server-side revoke"],
    jobStatus: job.status,
  }));
} finally {
  if (userId != null) await pool.query("delete from users where id = $1", [userId]);
  await pool.end();
}
