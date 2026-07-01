import { env } from "../../config";
import type { AccessStatus } from "./types";

export interface UnpaywallResult {
  fulltextUrl: string | null;
  accessStatus: AccessStatus;
}

/** Finds a legal open-access copy for a paywalled DOI. Email is mandatory per Unpaywall's API terms. */
export async function unpaywall(doi: string): Promise<UnpaywallResult | null> {
  try {
    const res = await fetch(`https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=${encodeURIComponent(env.SCHOLAR_CONTACT_EMAIL)}`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const best = data?.best_oa_location;
    const fulltextUrl = typeof best?.url_for_pdf === "string" ? best.url_for_pdf : typeof best?.url === "string" ? best.url : null;
    return {
      fulltextUrl,
      accessStatus: data?.is_oa ? "open_access" : "publisher_paywalled",
    };
  } catch {
    return null;
  }
}
