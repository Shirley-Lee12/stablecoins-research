import nodemailer from "nodemailer";
import { logger } from "./logger";
import { getSetting } from "./settings";

/** Builds a fresh transporter each call (cheap, no network I/O) so admin-updated settings take effect immediately. */
async function getTransporter() {
  const host = await getSetting("SMTP_HOST");
  const port = Number((await getSetting("SMTP_PORT")) ?? 465);
  const user = await getSetting("SMTP_USER");
  const pass = await getSetting("SMTP_PASS");

  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured — set SMTP_HOST, SMTP_USER, and SMTP_PASS");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendMail(to: string, subject: string, html: string) {
  const transporter = await getTransporter();
  const from = (await getSetting("SMTP_FROM")) || (await getSetting("SMTP_USER"));
  await transporter.sendMail({ from, to, subject, html });
}

export async function sendVerificationCodeEmail(to: string, code: string) {
  try {
    await sendMail(
      to,
      "ZIBS稳定币研究中心 — 邮箱验证码 / Email Verification Code",
      `<p>您的验证码是 / Your verification code is:</p><h2 style="letter-spacing:4px">${code}</h2><p>10分钟内有效 / Valid for 10 minutes.</p>`,
    );
  } catch (err) {
    logger.error({ err, to }, "Failed to send verification code email");
    throw err;
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  try {
    await sendMail(
      to,
      "ZIBS稳定币研究中心 — 重置密码 / Reset Your Password",
      `<p>点击以下链接重置密码（1小时内有效）/ Click the link below to reset your password (valid for 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    );
  } catch (err) {
    logger.error({ err, to }, "Failed to send password reset email");
    throw err;
  }
}
