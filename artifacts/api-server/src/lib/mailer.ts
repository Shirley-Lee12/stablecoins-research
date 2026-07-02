import { logger } from "./logger";
import { env } from "../config";

const RESEND_FROM_NAME = "ZIBS Stablecoin Hub";

/**
 * Sends via Resend's HTTP API instead of SMTP — direct SMTP to 163.com kept failing from Render
 * (first an unreachable IPv6 address, then a silent connection timeout on IPv4 too, consistent
 * with 163/126's known practice of blocking or throttling mail submission from datacenter/cloud IP
 * ranges rather than an actual code bug). A plain fetch() call sidesteps that whole class of
 * problem — no SMTP socket, no per-provider IP reputation to fight.
 */
export async function sendMail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`,
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend API request failed (${res.status}): ${detail}`);
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
