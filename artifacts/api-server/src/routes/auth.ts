import { Router } from "express";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { db, usersTable, passwordResetTokensTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import crypto from "node:crypto";

const router = Router();

function getSecret() {
  const s = process.env["JWT_SECRET"] || process.env["SESSION_SECRET"];
  if (!s) throw new Error("JWT_SECRET not set");
  return new TextEncoder().encode(s);
}

async function signToken(payload: { userId: number; email: string; name: string; role: string }) {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(getSecret());
}

async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as { userId: number; email: string; name: string; role: string };
}

export async function requireAuth(req: any, res: any, next: any) {
  try {
    const auth = req.headers["authorization"];
    if (!auth?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const token = auth.slice(7);
    const payload = await verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Optional auth — attaches req.user if token present, never 401s */
export async function optionalAuth(req: any, _res: any, next: any) {
  try {
    const auth = req.headers["authorization"];
    if (auth?.startsWith("Bearer ")) {
      const payload = await verifyToken(auth.slice(7));
      req.user = payload;
    }
  } catch { /* ignore */ }
  next();
}

export function requireAdmin(req: any, res: any, next: any) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

router.post("/auth/register", async (req, res): Promise<void> => {
  try {
    const { email, name, password } = req.body as { email?: string; name?: string; password?: string };
    if (!email || !name || !password) {
      res.status(400).json({ error: "email, name, and password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(usersTable).values({
      email: email.toLowerCase(),
      name,
      passwordHash,
    }).returning({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role });

    const token = await signToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to register" });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = await signToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to login" });
  }
});

router.get("/auth/me", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const [user] = await db
      .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role, createdAt: usersTable.createdAt })
      .from(usersTable)
      .where(eq(usersTable.id, req.user.userId));

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get user" });
  }
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ error: "email is required" });
      return;
    }

    const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (!user) {
      res.json({ message: "If this email exists, a reset link has been generated." });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    await db.insert(passwordResetTokensTable).values({ userId: user.id, token, expiresAt });

    res.json({ message: "Password reset link generated.", resetToken: token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to process request" });
  }
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) {
      res.status(400).json({ error: "token and password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const [resetRow] = await db
      .select()
      .from(passwordResetTokensTable)
      .where(and(
        eq(passwordResetTokensTable.token, token),
        eq(passwordResetTokensTable.used, false),
        gt(passwordResetTokensTable.expiresAt, new Date()),
      ));

    if (!resetRow) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.update(usersTable).set({ passwordHash, updatedAt: new Date() }).where(eq(usersTable.id, resetRow.userId));
    await db.update(passwordResetTokensTable).set({ used: true }).where(eq(passwordResetTokensTable.id, resetRow.id));

    res.json({ message: "Password has been reset successfully." });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

export default router;
