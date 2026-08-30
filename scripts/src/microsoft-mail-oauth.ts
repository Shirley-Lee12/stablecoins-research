import { randomBytes } from "node:crypto";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

function requiredEnv(name: "MICROSOFT_CLIENT_ID" | "MICROSOFT_CLIENT_SECRET" | "MICROSOFT_FROM_EMAIL"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Set ${name} before running this helper.`);
  return value;
}

const clientId = requiredEnv("MICROSOFT_CLIENT_ID");
const clientSecret = requiredEnv("MICROSOFT_CLIENT_SECRET");
const fromEmail = requiredEnv("MICROSOFT_FROM_EMAIL");
const testRecipient = process.env.MICROSOFT_TEST_RECIPIENT?.trim();
const port = Number(process.env.MICROSOFT_OAUTH_PORT || 53682);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("MICROSOFT_OAUTH_PORT must be a valid TCP port.");
}

const redirectUri = `http://localhost:${port}/callback`;
const scope = "offline_access https://graph.microsoft.com/Mail.Send";
const state = randomBytes(24).toString("hex");
const authorizeUrl = new URL("https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize");
authorizeUrl.search = new URLSearchParams({
  client_id: clientId,
  response_type: "code",
  redirect_uri: redirectUri,
  response_mode: "query",
  scope,
  state,
  prompt: "consent",
}).toString();

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character] || character);
}

function browserResponse(res: import("node:http").ServerResponse, status: number, message: string) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<main style="font-family:system-ui;max-width:680px;margin:60px auto;padding:24px"><h1>${status < 400 ? "Authorization complete" : "Authorization failed"}</h1><p>${escapeHtml(message)}</p></main>`);
}

async function exchangeCode(code: string) {
  const response = await fetch("https://login.microsoftonline.com/consumers/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      scope,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`Microsoft token exchange failed (${response.status}): ${await response.text()}`);
  }
  const token = await response.json() as { access_token?: string; refresh_token?: string };
  if (!token.access_token || !token.refresh_token) {
    throw new Error("Microsoft did not return both access_token and refresh_token.");
  }
  return { accessToken: token.access_token, refreshToken: token.refresh_token };
}

async function sendTestEmail(accessToken: string, recipient: string) {
  const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: "ZIBS Microsoft Graph mail test",
        body: {
          contentType: "HTML",
          content: "<p>Microsoft Graph email delivery is working for the ZIBS Stablecoin Research Hub.</p>",
        },
        toRecipients: [{ emailAddress: { address: recipient } }],
      },
      saveToSentItems: true,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`Microsoft Graph test email failed (${response.status}): ${await response.text()}`);
  }
}

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", redirectUri);
  if (requestUrl.pathname !== "/callback") {
    browserResponse(res, 404, "Unknown callback path.");
    return;
  }
  if (requestUrl.searchParams.get("state") !== state) {
    browserResponse(res, 400, "OAuth state validation failed. Close this window and restart the helper.");
    server.close();
    return;
  }
  const oauthError = requestUrl.searchParams.get("error_description") || requestUrl.searchParams.get("error");
  const code = requestUrl.searchParams.get("code");
  if (oauthError || !code) {
    browserResponse(res, 400, oauthError || "Microsoft did not return an authorization code.");
    server.close();
    return;
  }

  try {
    const token = await exchangeCode(code);
    const outputDirectory = path.resolve("output");
    const outputPath = path.join(outputDirectory, "microsoft-graph.env");
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(outputPath, [
      "EMAIL_PROVIDER=microsoft_graph",
      `MICROSOFT_CLIENT_ID=${clientId}`,
      `MICROSOFT_CLIENT_SECRET=${clientSecret}`,
      `MICROSOFT_REFRESH_TOKEN=${token.refreshToken}`,
      `MICROSOFT_FROM_EMAIL=${fromEmail}`,
      "",
    ].join("\n"), { mode: 0o600 });
    await chmod(outputPath, 0o600);

    if (testRecipient) await sendTestEmail(token.accessToken, testRecipient);

    browserResponse(res, 200, testRecipient
      ? `Credentials were saved locally and a test message was accepted for ${testRecipient}. You may close this window.`
      : "Credentials were saved locally. You may close this window.");
    console.log(`OAuth credentials saved to ${outputPath}`);
    if (testRecipient) console.log(`Microsoft Graph accepted a test message for ${testRecipient}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    browserResponse(res, 500, message);
    console.error(message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`OAuth callback listening at ${redirectUri}`);
  console.log("Open this URL in your browser and sign in with the Outlook sender account:");
  console.log(authorizeUrl.toString());
});

setTimeout(() => {
  console.error("OAuth helper timed out after 10 minutes.");
  server.close();
}, 10 * 60_000).unref();
