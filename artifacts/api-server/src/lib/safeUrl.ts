import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

const blockedAddresses = new BlockList();
const developmentProxyAddresses = new BlockList();
developmentProxyAddresses.addSubnet("198.18.0.0", 15, "ipv4");

for (const [network, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
  ["224.0.0.0", 4],
] as const) {
  blockedAddresses.addSubnet(network, prefix, "ipv4");
}

for (const [network, prefix] of [
  ["::", 96], ["::ffff:0:0", 96], ["64:ff9b::", 96], ["100::", 64],
  ["2001::", 32], ["2001:2::", 48], ["2001:10::", 28], ["2001:20::", 28],
  ["2001:db8::", 32], ["2002::", 16], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8],
] as const) {
  blockedAddresses.addSubnet(network, prefix, "ipv6");
}

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

const VIEWER_URL_PARAM_NAMES = ["file", "url", "src", "source"] as const;

function decodeUrlCandidate(value: string): string {
  let decoded = value.trim();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

/** Extracts the public document URL copied from a browser/PDF-viewer extension address. */
export function normalizeResourceUrlInput(rawUrl: string): string {
  const value = rawUrl.trim();
  if (!/^chrome-extension:\/\//i.test(value)) return value;

  const candidates: string[] = [];
  try {
    const viewerUrl = new URL(value);
    for (const name of VIEWER_URL_PARAM_NAMES) {
      const candidate = viewerUrl.searchParams.get(name);
      if (candidate) candidates.push(candidate);
    }
    candidates.push(viewerUrl.pathname.replace(/^\/+/, ""));
  } catch {
    // The direct nested-URL fallback below still handles malformed viewer wrappers.
  }

  const directNestedUrl = value.match(/\/(https?:\/\/.+)$/i)?.[1];
  if (directNestedUrl) candidates.push(directNestedUrl);

  for (const candidate of candidates) {
    const decoded = decodeUrlCandidate(candidate);
    const nested = decoded.match(/https?:\/\/.+$/i)?.[0];
    if (!nested) continue;
    try {
      const parsed = new URL(nested);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.toString();
    } catch {
      // Try the next candidate.
    }
  }

  return value;
}

function normalizedHostname(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
}

export function isBlockedIpAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return blockedAddresses.check(address, "ipv4");
  if (family === 6) {
    const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1];
    return mapped ? isBlockedIpAddress(mapped) : blockedAddresses.check(address, "ipv6");
  }
  return true;
}

function isDevelopmentProxyAddress(address: string): boolean {
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1];
  const candidate = mapped ?? address;
  return isIP(candidate) === 4 && developmentProxyAddresses.check(candidate, "ipv4");
}

/**
 * Validates a URL that will only be stored, not fetched by the server. Domain names are allowed
 * without DNS lookup because managed runtimes may resolve all public traffic through an internal
 * proxy address. Literal private IPs and local hostnames remain forbidden.
 */
export function assertSafeStoredHttpUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(normalizeResourceUrlInput(rawUrl));
  } catch {
    throw new UnsafeUrlError("A valid URL is required");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only HTTP and HTTPS URLs are allowed");
  }
  if (url.username || url.password) throw new UnsafeUrlError("URLs containing credentials are not allowed");
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new UnsafeUrlError("Only standard HTTP and HTTPS ports are allowed");
  }

  const hostname = normalizedHostname(url.hostname);
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new UnsafeUrlError("Local or private network addresses are not allowed");
  }

  const literalFamily = isIP(hostname);
  if (literalFamily && isBlockedIpAddress(hostname)) {
    throw new UnsafeUrlError("Local, private, reserved, and link-local network addresses are not allowed");
  }
  return url;
}

/** Validates the URL and every currently resolved address before an outbound request. */
export async function assertSafePublicHttpUrl(rawUrl: string): Promise<URL> {
  const url = assertSafeStoredHttpUrl(rawUrl);
  const hostname = normalizedHostname(url.hostname);
  const literalFamily = isIP(hostname);
  const addresses = literalFamily
    ? [{ address: hostname, family: literalFamily }]
    : await lookup(hostname, { all: true, verbatim: true }).catch(() => []);

  if (addresses.length === 0) throw new UnsafeUrlError("The URL hostname could not be resolved");
  const blocked = addresses.filter(({ address }) => isBlockedIpAddress(address));
  // Codex desktop's local development proxy maps public hostnames into 198.18.0.0/15. Permit that
  // benchmark-range mapping only in development, and only when every blocked answer is from that
  // proxy range. Production retains the full reserved-network block list.
  const developmentProxyOnly = process.env.NODE_ENV !== "production"
    && blocked.length > 0
    && blocked.every(({ address }) => isDevelopmentProxyAddress(address));
  if (blocked.length > 0 && !developmentProxyOnly) {
    throw new UnsafeUrlError("Local, private, reserved, and link-local network addresses are not allowed");
  }
  return url;
}

/** Fetches with manual redirect handling so every redirect target is validated again. */
export async function safeFetch(rawUrl: string, init: RequestInit = {}, maxRedirects = 3): Promise<Response> {
  let current = rawUrl;
  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const safeUrl = await assertSafePublicHttpUrl(current);
    const response = await fetch(safeUrl, { ...init, redirect: "manual" });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;

    const location = response.headers.get("location");
    await response.body?.cancel();
    if (!location) throw new UnsafeUrlError("The remote server returned an invalid redirect");
    if (redirectCount === maxRedirects) throw new UnsafeUrlError("The URL redirected too many times");
    current = new URL(location, safeUrl).toString();
  }
  throw new UnsafeUrlError("The URL redirected too many times");
}

/** Reads at most maxBytes, aborting before an untrusted response can exhaust process memory. */
export async function readBoundedBody(response: Response, maxBytes: number): Promise<Buffer> {
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    await response.body?.cancel();
    throw new Error("Remote response is too large");
  }
  if (!response.body) return Buffer.alloc(0);

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error("Remote response is too large");
      chunks.push(Buffer.from(value));
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  return Buffer.concat(chunks, size);
}
