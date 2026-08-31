import crypto from "node:crypto";
import { Router } from "express";
import { and, desc, eq, gt, isNull, lt } from "drizzle-orm";
import { z } from "zod/v4";
import { connectorPairingsTable, connectorSessionsTable, db } from "@workspace/db";
import { env } from "../config";
import {
  decryptPairingToken,
  encryptPairingToken,
  generateConnectorSecret,
  generateConnectorToken,
  hashConnectorToken,
  hashPairingPollSecret,
  requireConnectorAuth,
  safeSecretMatch,
} from "../lib/connectorAuth";
import { createRateLimiter } from "../lib/rateLimit";
import { requireAuth } from "./auth";

const router = Router();
const PAIRING_TTL_MS = 10 * 60_000;
const SESSION_TTL_MS = 90 * 24 * 60 * 60_000;
const pairCreateLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 15 });
const pairPollLimiter = createRateLimiter({ windowMs: 60_000, max: 40 });

const clientSchema = z.object({
  clientId: z.string().uuid(),
  clientName: z.string().trim().min(1).max(100),
});

const pollSchema = z.object({ pollSecret: z.string().min(32).max(100) });

function generatePairingCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  const chars = [...bytes].map((byte) => alphabet[byte % alphabet.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

async function createUniquePairingCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generatePairingCode();
    const [existing] = await db.select({ id: connectorPairingsTable.id }).from(connectorPairingsTable)
      .where(eq(connectorPairingsTable.code, code)).limit(1);
    if (!existing) return code;
  }
  throw new Error("Could not allocate a pairing code");
}

router.post("/connector/pairings", pairCreateLimiter, async (req, res) => {
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid connector identity" }); return; }
  try {
    await db.delete(connectorPairingsTable).where(lt(connectorPairingsTable.expiresAt, new Date()));
    const code = await createUniquePairingCode();
    const pollSecret = generateConnectorSecret();
    const expiresAt = new Date(Date.now() + PAIRING_TTL_MS);
    const [pairing] = await db.insert(connectorPairingsTable).values({
      code,
      pollSecretHash: hashPairingPollSecret(pollSecret),
      clientId: parsed.data.clientId,
      clientName: parsed.data.clientName,
      expiresAt,
    }).returning({ id: connectorPairingsTable.id });
    const frontend = env.FRONTEND_URL.replace(/\/$/, "");
    res.status(201).json({
      pairingId: pairing.id,
      code,
      pollSecret,
      expiresAt,
      authorizeUrl: `${frontend}/connector/authorize?code=${encodeURIComponent(code)}`,
    });
  } catch (error) {
    req.log?.error(error);
    res.status(500).json({ error: "Could not start connector pairing" });
  }
});

router.get("/connector/pairings/code/:code", async (req, res) => {
  const code = req.params.code.toUpperCase();
  const [pairing] = await db.select({
    clientName: connectorPairingsTable.clientName,
    status: connectorPairingsTable.status,
    expiresAt: connectorPairingsTable.expiresAt,
  }).from(connectorPairingsTable).where(and(
    eq(connectorPairingsTable.code, code),
    gt(connectorPairingsTable.expiresAt, new Date()),
  )).limit(1);
  if (!pairing) { res.status(404).json({ error: "This pairing code is invalid or has expired" }); return; }
  res.json(pairing);
});

router.post("/connector/pairings/:code/authorize", requireAuth, async (req: any, res) => {
  const code = req.params.code.toUpperCase();
  try {
    const result = await db.transaction(async (tx) => {
      const [claimed] = await tx.update(connectorPairingsTable).set({ status: "authorizing" }).where(and(
        eq(connectorPairingsTable.code, code),
        eq(connectorPairingsTable.status, "pending"),
        gt(connectorPairingsTable.expiresAt, new Date()),
      )).returning();
      if (!claimed) return null;

      await tx.update(connectorSessionsTable).set({ revokedAt: new Date() }).where(and(
        eq(connectorSessionsTable.userId, req.user.userId),
        eq(connectorSessionsTable.clientId, claimed.clientId),
        isNull(connectorSessionsTable.revokedAt),
      ));
      const token = generateConnectorToken();
      const [session] = await tx.insert(connectorSessionsTable).values({
        userId: req.user.userId,
        clientId: claimed.clientId,
        clientName: claimed.clientName,
        tokenHash: hashConnectorToken(token),
        tokenPrefix: token.slice(0, 18),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      }).returning({ id: connectorSessionsTable.id, expiresAt: connectorSessionsTable.expiresAt });
      await tx.update(connectorPairingsTable).set({
        status: "authorized",
        authorizedBy: req.user.userId,
        sessionId: session.id,
        encryptedToken: encryptPairingToken(token),
      }).where(eq(connectorPairingsTable.id, claimed.id));
      return { sessionId: session.id, expiresAt: session.expiresAt };
    });
    if (!result) { res.status(409).json({ error: "This pairing request is no longer available" }); return; }
    res.json({ message: "Browser connected", ...result });
  } catch (error) {
    req.log?.error(error);
    res.status(500).json({ error: "Could not authorize this browser" });
  }
});

router.post("/connector/pairings/:id/poll", pairPollLimiter, async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  const bodyResult = pollSchema.safeParse(req.body);
  if (!idResult.success || !bodyResult.success) { res.status(400).json({ error: "Invalid pairing request" }); return; }
  const [pairing] = await db.select().from(connectorPairingsTable).where(and(
    eq(connectorPairingsTable.id, idResult.data),
    gt(connectorPairingsTable.expiresAt, new Date()),
  )).limit(1);
  if (!pairing || !safeSecretMatch(pairing.pollSecretHash, hashPairingPollSecret(bodyResult.data.pollSecret))) {
    res.status(404).json({ error: "Pairing request not found" }); return;
  }
  if (pairing.status === "pending" || pairing.status === "authorizing") {
    res.json({ status: "pending", expiresAt: pairing.expiresAt }); return;
  }
  if (pairing.status !== "authorized" || pairing.consumedAt || !pairing.encryptedToken || !pairing.sessionId) {
    res.status(410).json({ error: "This pairing request has already been used", code: "PAIRING_CONSUMED" }); return;
  }
  const token = decryptPairingToken(pairing.encryptedToken);
  const [consumed] = await db.update(connectorPairingsTable).set({
    status: "consumed", consumedAt: new Date(), encryptedToken: null,
  }).where(and(
    eq(connectorPairingsTable.id, pairing.id),
    eq(connectorPairingsTable.status, "authorized"),
    isNull(connectorPairingsTable.consumedAt),
  )).returning({ sessionId: connectorPairingsTable.sessionId });
  if (!consumed) { res.status(410).json({ error: "This pairing request has already been used", code: "PAIRING_CONSUMED" }); return; }
  res.json({ status: "authorized", token, sessionId: consumed.sessionId });
});

router.get("/connector/session", requireConnectorAuth, (req: any, res) => {
  res.json({ user: req.user, sessionId: req.connectorSessionId });
});

router.delete("/connector/session", requireConnectorAuth, async (req: any, res) => {
  await db.update(connectorSessionsTable).set({ revokedAt: new Date() }).where(and(
    eq(connectorSessionsTable.id, req.connectorSessionId),
    isNull(connectorSessionsTable.revokedAt),
  ));
  res.status(204).end();
});

router.get("/account/connector-sessions", requireAuth, async (req: any, res) => {
  const sessions = await db.select({
    id: connectorSessionsTable.id,
    clientName: connectorSessionsTable.clientName,
    tokenPrefix: connectorSessionsTable.tokenPrefix,
    expiresAt: connectorSessionsTable.expiresAt,
    lastUsedAt: connectorSessionsTable.lastUsedAt,
    revokedAt: connectorSessionsTable.revokedAt,
    createdAt: connectorSessionsTable.createdAt,
  }).from(connectorSessionsTable)
    .where(eq(connectorSessionsTable.userId, req.user.userId))
    .orderBy(desc(connectorSessionsTable.createdAt));
  res.json(sessions);
});

router.delete("/account/connector-sessions/:id", requireAuth, async (req: any, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid browser connection" }); return; }
  const [revoked] = await db.update(connectorSessionsTable).set({ revokedAt: new Date() }).where(and(
    eq(connectorSessionsTable.id, id),
    eq(connectorSessionsTable.userId, req.user.userId),
    isNull(connectorSessionsTable.revokedAt),
  )).returning({ id: connectorSessionsTable.id });
  if (!revoked) { res.status(404).json({ error: "Browser connection not found" }); return; }
  res.status(204).end();
});

export default router;
