import dns from "node:dns/promises";
import nodemailer from "nodemailer";
import { logger } from "./logger";
import { env } from "../config";

/**
 * nodemailer 9.x resolves both the SMTP host's A and AAAA records and picks randomly between them
 * for the connection attempt (see resolveHostname() in its lib/shared/index.js) — the `family`
 * transport option is never actually read anywhere in that resolution path in this version, so it
 * can't be used to force IPv4 (confirmed by reading the installed package's source directly, after
 * the same ENETUNREACH error persisted post-deploy with `family: 4` set). 163.com's SMTP host has a
 * real AAAA record whose address isn't routable from Render's network, so roughly half the time
 * nodemailer's random pick lands on it and the send fails. Resolving to a specific IPv4 address
 * ourselves and connecting to it directly — with `tls.servername` set so TLS SNI/certificate
 * validation still checks the real hostname — sidesteps nodemailer's address selection entirely.
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
