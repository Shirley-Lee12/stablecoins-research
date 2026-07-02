import nodemailer from "nodemailer";
import { logger } from "./logger";
import { env } from "../config";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  // 163.com's SMTP host resolves to an IPv6 address that's unreachable from Render's network
  // (ENETUNREACH) — nodemailer resolves the hostname itself and doesn't fall back to IPv4 on
  // failure like Node's net.connect would, so force IPv4 explicitly. `family` is a real
  // SMTPConnection option at runtime; it's just missing from @types/nodemailer@8 (nodemailer
  // itself is v9) — cast through TransportOptions since that overload skips the outdated
  // SMTPTransport.Options shape that's missing this field.
  family: 4,
} as nodemailer.TransportOptions);

export async function sendMail(to: string, subject: string, html: string) {
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
