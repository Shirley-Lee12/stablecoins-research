import { logger } from "./logger";
import { env } from "../config";

const BREVO_FROM_NAME = "ZIBS Stablecoin Hub";

/**
 * Sends via Brevo's HTTP API instead of SMTP. Root cause of every previous attempt (163.com, then
 * Outlook/Microsoft 365) failing from Render: Render's free-tier instances have blocked all
 * outbound SMTP ports (25/465/587) since September 2025 — no SMTP provider was ever going to work
 * from this host, regardless of credentials or DNS-resolution workarounds. An HTTP API call sends
 * over normal port 443, sidestepping that block entirely. Chose Brevo specifically because it sends
 * to real recipients on the free tier without requiring a verified custom sending domain first
 * (unlike Resend, whose shared test domain is sandboxed to the account's own verified addresses).
 */
export async function sendMail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: BREVO_FROM_NAME, email: env.BREVO_FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo API request failed (${res.status}): ${detail}`);
  }
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
