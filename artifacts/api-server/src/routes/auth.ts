import { Router } from "express";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { db, usersTable, passwordResetTokensTable, emailVerificationCodesTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import crypto from "node:crypto";
import { sendVerificationCodeEmail, sendPasswordResetEmail } from "../lib/mailer";
import { env } from "../config";
import { createRateLimiter, ipAndEmailKey } from "../lib/rateLimit";
import { z } from "zod/v4";

const router = Router();

const authIpLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 60 });
const loginLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 10, key: ipAndEmailKey });
const registrationLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 5, key: ipAndEmailKey });
const verificationLimiter = createRateLimiter({ windowMs: 10 * 60_000, max: 8, key: ipAndEmailKey });
const resendLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 3, key: ipAndEmailKey });
const passwordRequestLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 5, key: ipAndEmailKey });
const passwordResetLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 5 });

const registrationSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  name: z.string().trim().min(1).max(100),
  password: z.string(),
});

router.use("/auth", (req, res, next) => req.method === "POST" ? authIpLimiter(req, res, next) : next());

function generateSixDigitCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function hashSingleUseSecret(value: string): string {
  return crypto.createHmac("sha256", env.JWT_SECRET).update(value).digest("hex");
}

function verificationUrl(email: string, code: string): string {
  const base = env.FRONTEND_URL.replace(/\/$/, "");
  return `${base}/verify-email?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`;
}

function getSecret() {
  return new TextEncoder().encode(env.JWT_SECRET);
}

/** Min 8 chars, at least one uppercase letter, one lowercase letter, and one digit. */
function isValidPassword(password: string): boolean {
  return password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

/** Emails in ADMIN_BOOTSTRAP_EMAILS (comma-separated) get role='admin' on first registration. */
function isBootstrapAdminEmail(email: string): boolean {
  const list = env.ADMIN_BOOTSTRAP_EMAILS
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

async function signToken(payload: { userId: number; email: string; name: string; role: string }) {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(env.JWT_EXPIRES_IN)
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
    const [currentUser] = await db
      .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);
    if (!currentUser) { res.status(401).json({ error: "Unauthorized" }); return; }
    req.user = { userId: currentUser.id, email: currentUser.email, name: currentUser.name, role: currentUser.role };
    next();
  } catch {
    res.status(401).json({ error: "Session expired. Please sign in again.", code: "AUTH_SESSION_EXPIRED" });
  }
}

/** Optional auth — attaches req.user if token present, never 401s */
export async function optionalAuth(req: any, _res: any, next: any) {
  try {
    const auth = req.headers["authorization"];
    if (auth?.startsWith("Bearer ")) {
      const payload = await verifyToken(auth.slice(7));
      const [currentUser] = await db
        .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role })
        .from(usersTable)
        .where(eq(usersTable.id, payload.userId))
        .limit(1);
      if (currentUser) req.user = { userId: currentUser.id, email: currentUser.email, name: currentUser.name, role: currentUser.role };
    }
  } catch { /* ignore */ }
  next();
}

export async function requireAdmin(req: any, res: any, next: any) {
  try {
    const [user] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, req.user?.userId))
      .limit(1);
    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    req.user.role = user.role;
    next();
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Failed to verify admin access" });
  }
}

router.post("/auth/register", registrationLimiter, async (req, res): Promise<void> => {
  try {
    const parsed = registrationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Please enter a valid email address, name, and password." });
      return;
    }
    const { email, name, password } = parsed.data;
    if (!isValidPassword(password)) {
      res.status(400).json({ error: "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a digit" });
      return;
    }

    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(usersTable).values({
      email,
      name,
      passwordHash,
      role: isBootstrapAdminEmail(email) ? "admin" : "user",
      emailVerified: false,
    }).returning({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role });

    const code = generateSixDigitCode();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10);
    await db.insert(emailVerificationCodesTable).values({ userId: user.id, code: hashSingleUseSecret(code), expiresAt });

    try {
      await sendVerificationCodeEmail(user.email, code, verificationUrl(user.email, code));
    } catch (mailErr) {
      // Roll back so the user can cleanly retry registration instead of being stuck unverified.
      await db.delete(usersTable).where(eq(usersTable.id, user.id));
      req.log.error({ err: mailErr }, "Registration verification email delivery failed");
      res.status(503).json({
        error: "Verification email could not be sent. The account was not created; please try again shortly.",
        code: "EMAIL_DELIVERY_FAILED",
      });
      return;
    }

    res.status(201).json({ message: "Verification code sent to your email.", email: user.email, requiresVerification: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to register" });
  }
});

router.post("/auth/verify-email", verificationLimiter, async (req, res): Promise<void> => {
  try {
    const { email, code } = req.body as { email?: string; code?: string };
    if (!email || !code) {
      res.status(400).json({ error: "email and code are required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (!user) {
      res.status(400).json({ error: "Invalid email or code" });
      return;
    }
    if (user.emailVerified) {
      res.status(400).json({ error: "This email is already verified" });
      return;
    }

    const [codeRow] = await db
      .select()
      .from(emailVerificationCodesTable)
      .where(and(
        eq(emailVerificationCodesTable.userId, user.id),
        eq(emailVerificationCodesTable.code, hashSingleUseSecret(code)),
        eq(emailVerificationCodesTable.used, false),
        gt(emailVerificationCodesTable.expiresAt, new Date()),
      ));

    if (!codeRow) {
      res.status(400).json({ error: "Invalid or expired verification code" });
      return;
    }

    const verified = await db.transaction(async (tx) => {
      const [claimedCode] = await tx
        .update(emailVerificationCodesTable)
        .set({ used: true })
        .where(and(eq(emailVerificationCodesTable.id, codeRow.id), eq(emailVerificationCodesTable.used, false)))
        .returning({ id: emailVerificationCodesTable.id });
      if (!claimedCode) return false;
      await tx.update(usersTable).set({ emailVerified: true, updatedAt: new Date() }).where(eq(usersTable.id, user.id));
      return true;
    });
    if (!verified) { res.status(400).json({ error: "Invalid or expired verification code" }); return; }

    const token = await signToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to verify email" });
  }
});

router.post("/auth/resend-verification", resendLimiter, async (req, res): Promise<void> => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ error: "email is required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (!user || user.emailVerified) {
      res.json({ message: "If this account needs verification, a new code has been sent." });
      return;
    }

    const code = generateSixDigitCode();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10);
    await db.transaction(async (tx) => {
      await tx.update(emailVerificationCodesTable).set({ used: true }).where(and(eq(emailVerificationCodesTable.userId, user.id), eq(emailVerificationCodesTable.used, false)));
      await tx.insert(emailVerificationCodesTable).values({ userId: user.id, code: hashSingleUseSecret(code), expiresAt });
    });
    try {
      await sendVerificationCodeEmail(user.email, code, verificationUrl(user.email, code));
    } catch (mailErr) {
      await db.update(emailVerificationCodesTable).set({ used: true }).where(and(
        eq(emailVerificationCodesTable.userId, user.id),
        eq(emailVerificationCodesTable.code, hashSingleUseSecret(code)),
      ));
      req.log.error({ err: mailErr }, "Verification email resend delivery failed");
      res.status(503).json({
        error: "Verification email could not be sent. Please try again shortly.",
        code: "EMAIL_DELIVERY_FAILED",
      });
      return;
    }

    res.json({ message: "If this account needs verification, a new code has been sent." });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to resend verification code" });
  }
});

router.post("/auth/login", loginLimiter, async (req, res): Promise<void> => {
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
    if (!user.emailVerified) {
      res.status(403).json({ error: "Please verify your email before signing in", requiresVerification: true, email: user.email });
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

router.post("/auth/forgot-password", passwordRequestLimiter, async (req, res): Promise<void> => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ error: "email is required" });
      return;
    }

    const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (!user) {
      res.json({ message: "If this email exists, a reset link has been sent." });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    const [resetToken] = await db
      .insert(passwordResetTokensTable)
      .values({ userId: user.id, token: hashSingleUseSecret(token), expiresAt })
      .returning({ id: passwordResetTokensTable.id });

    const frontendBase = env.FRONTEND_URL.replace(/\/$/, "");
    try {
      await sendPasswordResetEmail(email.toLowerCase(), `${frontendBase}/reset-password?token=${token}`);
    } catch (mailErr) {
      await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.id, resetToken.id));
      req.log.error({ err: mailErr }, "Password reset email delivery failed");
      res.status(503).json({
        error: "Password reset email could not be sent. Please try again shortly.",
        code: "EMAIL_DELIVERY_FAILED",
      });
      return;
    }

    res.json({ message: "If this email exists, a reset link has been sent." });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to process request" });
  }
});

router.post("/auth/reset-password", passwordResetLimiter, async (req, res): Promise<void> => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) {
      res.status(400).json({ error: "token and password are required" });
      return;
    }
    if (!isValidPassword(password)) {
      res.status(400).json({ error: "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a digit" });
      return;
    }

    const [resetRow] = await db
      .select()
      .from(passwordResetTokensTable)
      .where(and(
        eq(passwordResetTokensTable.token, hashSingleUseSecret(token)),
        eq(passwordResetTokensTable.used, false),
        gt(passwordResetTokensTable.expiresAt, new Date()),
      ));

    if (!resetRow) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const resetCompleted = await db.transaction(async (tx) => {
      const [claimedToken] = await tx
        .update(passwordResetTokensTable)
        .set({ used: true })
        .where(and(eq(passwordResetTokensTable.id, resetRow.id), eq(passwordResetTokensTable.used, false)))
        .returning({ id: passwordResetTokensTable.id });
      if (!claimedToken) return false;
      await tx.update(usersTable).set({ passwordHash, updatedAt: new Date() }).where(eq(usersTable.id, resetRow.userId));
      return true;
    });
    if (!resetCompleted) { res.status(400).json({ error: "Invalid or expired reset token" }); return; }

    res.json({ message: "Password has been reset successfully." });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

router.post("/auth/change-password", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
    if (!currentPassword || !newPassword) { res.status(400).json({ error: "Both passwords are required" }); return; }
    if (!isValidPassword(newPassword)) {
      res.status(400).json({ error: "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a digit" });
      return;
    }
    const [user] = await db.select({ id: usersTable.id, passwordHash: usersTable.passwordHash })
      .from(usersTable).where(eq(usersTable.id, req.user.userId)).limit(1);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      res.status(400).json({ error: "Current password is incorrect" }); return;
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(usersTable).set({ passwordHash, updatedAt: new Date() }).where(eq(usersTable.id, user.id));
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update password" });
  }
});

export default router;
