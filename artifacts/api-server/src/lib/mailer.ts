import { logger } from "./logger";
import { env } from "../config";

const FROM_NAME = "ZIBS Stablecoin Hub";
const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";
const MICROSOFT_SEND_URL = "https://graph.microsoft.com/v1.0/me/sendMail";

let microsoftTokenCache: {
  accessToken: string;
  expiresAt: number;
  refreshToken: string;
} | null = null;

function providerError(provider: string, statusCode: number, detail: string) {
  const error = new Error(`${provider} API request failed (${statusCode}): ${detail}`);
  Object.assign(error, { provider, statusCode });
  return error;
}

async function getMicrosoftAccessToken(): Promise<string> {
  if (microsoftTokenCache && microsoftTokenCache.expiresAt > Date.now() + 60_000) {
    return microsoftTokenCache.accessToken;
  }

  const refreshToken = microsoftTokenCache?.refreshToken || env.MICROSOFT_REFRESH_TOKEN;
  const body = new URLSearchParams({
    client_id: env.MICROSOFT_CLIENT_ID,
    client_secret: env.MICROSOFT_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: "offline_access https://graph.microsoft.com/Mail.Send",
  });
  const res = await fetch(MICROSOFT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw providerError("microsoft_graph_token", res.status, detail);
  }

  const token = await res.json() as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
  };
  if (!token.access_token) {
    throw providerError("microsoft_graph_token", 502, "The token response did not include an access token");
  }
  microsoftTokenCache = {
    accessToken: token.access_token,
    expiresAt: Date.now() + Math.max(token.expires_in ?? 3_600, 60) * 1_000,
    refreshToken: token.refresh_token || refreshToken,
  };
  return microsoftTokenCache.accessToken;
}

async function sendWithMicrosoftGraph(to: string, subject: string, html: string) {
  const accessToken = await getMicrosoftAccessToken();
  const res = await fetch(MICROSOFT_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: "HTML", content: html },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: true,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw providerError("microsoft_graph", res.status, detail);
  }
}

async function sendWithBrevo(to: string, subject: string, html: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: env.BREVO_FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw providerError("brevo", res.status, detail);
  }
}

export async function sendMail(to: string, subject: string, html: string) {
  if (env.EMAIL_PROVIDER === "microsoft_graph") {
    await sendWithMicrosoftGraph(to, subject, html);
    return;
  }
  await sendWithBrevo(to, subject, html);
}

function verificationEmailHtml(code: string, verificationUrl?: string) {
  const action = verificationUrl
    ? `<p style="margin:24px 0"><a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;border-radius:6px;background:#15356b;color:#fff;text-decoration:none;font-weight:600">验证邮箱 / Verify email</a></p>`
    : "";
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#172033;line-height:1.6;max-width:560px">
      <h2 style="color:#15356b">验证您的邮箱 / Verify your email</h2>
      <p>请输入以下验证码完成注册。您也可以点击按钮直接验证邮箱。</p>
      <p>Enter the code below to complete registration, or use the verification button.</p>
      <p style="font-size:30px;font-weight:700;letter-spacing:7px;margin:22px 0">${code}</p>
      ${action}
      <p style="color:#586579">验证码和链接均在10分钟内有效。<br />The code and link are valid for 10 minutes.</p>
    </div>`;
}

export async function sendVerificationCodeEmail(to: string, code: string, verificationUrl?: string) {
  try {
    await sendMail(
      to,
      "ZIBS稳定币研究中心 — 邮箱验证码 / Email Verification Code",
      verificationEmailHtml(code, verificationUrl),
    );
  } catch (err) {
    logger.error({ err, to }, "Failed to send verification code email");
    throw err;
  }
}

export async function sendEmailChangeCodeEmail(to: string, code: string) {
  try {
    await sendMail(
      to,
      "ZIBS稳定币研究中心 — 确认新邮箱 / Confirm Your New Email",
      `<div style="font-family:Arial,Helvetica,sans-serif;color:#172033;line-height:1.6;max-width:560px">
        <h2 style="color:#15356b">确认新邮箱 / Confirm your new email</h2>
        <p>请在个人资料页面输入以下验证码，确认更换邮箱。</p>
        <p>Enter this code on your profile page to confirm the email change.</p>
        <p style="font-size:30px;font-weight:700;letter-spacing:7px;margin:22px 0">${code}</p>
        <p style="color:#586579">验证码在10分钟内有效。原邮箱在验证成功前不会改变。<br />The code is valid for 10 minutes. Your current email remains unchanged until verification succeeds.</p>
      </div>`,
    );
  } catch (err) {
    logger.error({ err, to }, "Failed to send email change code");
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
