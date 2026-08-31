import crypto from "node:crypto";
import { and, eq, isNull, or, gt } from "drizzle-orm";
import { connectorSessionsTable, db, usersTable } from "@workspace/db";
import { env } from "../config";

const TOKEN_PREFIX = "zibs_conn_";

function hmac(context: string, value: string): string {
  return crypto.createHmac("sha256", env.JWT_SECRET).update(`${context}\0${value}`).digest("hex");
}

function pairingEncryptionKey(): Buffer {
  return crypto.createHash("sha256").update(`connector-pairing\0${env.JWT_SECRET}`).digest();
}

export function generateConnectorSecret(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function generateConnectorToken(): string {
  return `${TOKEN_PREFIX}${generateConnectorSecret()}`;
}

export function hashConnectorToken(token: string): string {
  return hmac("connector-token", token);
}

export function hashPairingPollSecret(secret: string): string {
  return hmac("connector-poll", secret);
}

export function safeSecretMatch(expectedHash: string, actualHash: string): boolean {
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(actualHash, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export function encryptPairingToken(token: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", pairingEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decryptPairingToken(payload: string): string {
  const [ivPart, tagPart, ciphertextPart] = payload.split(".");
  if (!ivPart || !tagPart || !ciphertextPart) throw new Error("Invalid pairing token payload");
  const decipher = crypto.createDecipheriv("aes-256-gcm", pairingEncryptionKey(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export async function requireConnectorAuth(req: any, res: any, next: any) {
  try {
    const auth = req.headers.authorization;
    if (typeof auth !== "string" || !auth.startsWith(`Bearer ${TOKEN_PREFIX}`)) {
      res.status(401).json({ error: "Connector authorization required", code: "CONNECTOR_UNAUTHORIZED" });
      return;
    }
    const token = auth.slice(7);
    const [connection] = await db.select({
      sessionId: connectorSessionsTable.id,
      scope: connectorSessionsTable.scope,
      userId: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      suspendedAt: usersTable.suspendedAt,
    }).from(connectorSessionsTable)
      .innerJoin(usersTable, eq(usersTable.id, connectorSessionsTable.userId))
      .where(and(
        eq(connectorSessionsTable.tokenHash, hashConnectorToken(token)),
        isNull(connectorSessionsTable.revokedAt),
        or(isNull(connectorSessionsTable.expiresAt), gt(connectorSessionsTable.expiresAt, new Date())),
      )).limit(1);
    if (!connection) {
      res.status(401).json({ error: "This browser connection has expired or been revoked", code: "CONNECTOR_REVOKED" });
      return;
    }
    if (connection.suspendedAt) {
      res.status(403).json({ error: "This account has been suspended", code: "ACCOUNT_SUSPENDED" });
      return;
    }
    if (connection.scope !== "resource:capture") {
      res.status(403).json({ error: "This browser connection cannot submit resources", code: "CONNECTOR_SCOPE" });
      return;
    }
    req.user = { userId: connection.userId, email: connection.email, name: connection.name, role: connection.role };
    req.connectorSessionId = connection.sessionId;
    await db.update(connectorSessionsTable).set({ lastUsedAt: new Date() }).where(eq(connectorSessionsTable.id, connection.sessionId));
    next();
  } catch (error) {
    req.log?.error(error);
    res.status(401).json({ error: "Connector authorization failed", code: "CONNECTOR_UNAUTHORIZED" });
  }
}
