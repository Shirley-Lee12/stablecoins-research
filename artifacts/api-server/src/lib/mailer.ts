import dns from "node:dns/promises";
import nodemailer from "nodemailer";
import { logger } from "./logger";
import { env } from "../config";

/**
 * Back on SMTP again — Resend's shared test domain (onboarding@resend.dev) can only send to the
 * account's own verified test addresses, not real users, so it never worked for production. Now
 * pointed at Outlook/Microsoft 365 instead of 163.com.
 *
 * Kept the manual-IPv4-resolution approach from the 163.com attempt (dns.resolve4 + connecting to
 * the raw IP with tls.servername for correct SNI/cert validation) even though Outlook's mail
 * infrastructure is much less likely to have 163.com's specific problem (an unroutable-from-Render
 * IPv6 address) — nodemailer 9.x resolves both A and AAAA records and picks randomly between them
 * for the connection (confirmed by reading its source during the 163.com debugging), so this is
 * cheap insurance against the same class of bug regardless of provider.
 */
async function createTransporter() {
  let host: string = env.SMTP_HOST;
  try {
    const [ipv4] = await dns.resolve4(env.SMTP_HOST);
    host = ipv4;
  } catch (err) {
    logger.warn({ err, host: env.SMTP_HOST }, "Could not resolve SMTP host to an IPv4 address, letting nodemailer resolve it itself");
  }
  return nodemailer.createTransport({
    host,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    tls: { servername: env.SMTP_HOST },
  });
}

export async function sendMail(to: string, subject: string, html: string) {
  const transporter = await createTransporter();
  await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });
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
