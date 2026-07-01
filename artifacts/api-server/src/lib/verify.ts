import { resolveDoi } from "./scholar/doi";
import { titleOverlapScore, authorOverlapCount } from "./scholar/matching";

export type CheckStatus = "✅" | "⚠️" | "❌";

export interface FieldCheck {
  field: string;
  status: CheckStatus;
  detail: string;
}

export interface VerifyInput {
  title: string;
  authors: string[];
  year: number | null;
  doi: string | null;
  url: string | null;
  abstract: string | null;
}

export interface VerifyReport {
  checks: FieldCheck[];
  hasFailure: boolean;
  hasWarning: boolean;
}

async function isUrlReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8_000), redirect: "follow" });
    if (res.ok) return true;
    // Some servers don't implement HEAD (405/403) — retry with GET before giving up.
    if (res.status === 405 || res.status === 403) {
      const getRes = await fetch(url, { method: "GET", signal: AbortSignal.timeout(8_000), redirect: "follow" });
      return getRes.ok;
    }
    return false;
  } catch {
    return false;
  }
}

function checkTitle(input: VerifyInput): FieldCheck {
  return input.title.trim().length > 0
    ? { field: "title", status: "✅", detail: "标题已填写" }
    : { field: "title", status: "❌", detail: "缺少标题" };
}

async function checkDoi(input: VerifyInput): Promise<FieldCheck> {
  if (!input.doi) return { field: "doi", status: "⚠️", detail: "未提供 DOI" };
  const resolved = await resolveDoi(input.doi);
  if (!resolved) return { field: "doi", status: "❌", detail: `DOI "${input.doi}" 无法解析（不存在或网络错误）` };
  if (titleOverlapScore(input.title, resolved.title) < 0.5) {
    return { field: "doi", status: "❌", detail: `DOI 解析出的标题（"${resolved.title}"）与卡片标题差异较大，可能贴错了 DOI` };
  }
  return { field: "doi", status: "✅", detail: "DOI 已确认存在，且标题一致" };
}

async function checkUrl(input: VerifyInput): Promise<FieldCheck> {
  if (!input.url) return { field: "url", status: "⚠️", detail: "未提供直达链接" };
  const reachable = await isUrlReachable(input.url);
  return reachable
    ? { field: "url", status: "✅", detail: "链接可正常访问" }
    : { field: "url", status: "⚠️", detail: "链接当前无法访问（可能临时故障或需要登录）" };
}

/** Cross-checks authors/year against the DOI's authoritative record when one is available. */
async function checkAuthorsAndYear(input: VerifyInput): Promise<FieldCheck[]> {
  const checks: FieldCheck[] = [];

  if (input.authors.length === 0) {
    checks.push({ field: "authors", status: "❌", detail: "未填写作者" });
  } else if (input.doi) {
    const resolved = await resolveDoi(input.doi);
    if (resolved && resolved.authors.length > 0) {
      checks.push(
        authorOverlapCount(input.authors, resolved.authors) > 0
          ? { field: "authors", status: "✅", detail: "作者与 DOI 权威记录一致" }
          : { field: "authors", status: "⚠️", detail: "作者与 DOI 解析出的记录对不上，请人工核对" },
      );
    } else {
      checks.push({ field: "authors", status: "⚠️", detail: "DOI 记录里没有作者信息，无法交叉核对" });
    }
  } else {
    checks.push({ field: "authors", status: "⚠️", detail: "无 DOI，无法交叉核对作者" });
  }

  checks.push(
    input.year === null
      ? { field: "year", status: "⚠️", detail: "未填写年份" }
      : { field: "year", status: "✅", detail: "已填写年份" },
  );

  return checks;
}

function checkAbstract(input: VerifyInput): FieldCheck {
  return input.abstract && input.abstract.trim().length > 0
    ? { field: "abstract", status: "✅", detail: "摘要已填写" }
    : { field: "abstract", status: "⚠️", detail: "缺少摘要" };
}

/**
 * Pre-persist verification — produces a field-by-field report rather than a binary pass/reject,
 * so the upload confirm dialog can show the user exactly what's uncertain instead of a black box.
 * Read-only w.r.t. the database (only does DOI lookups / URL reachability checks over the network).
 */
export async function verifyResource(input: VerifyInput): Promise<VerifyReport> {
  const [doiCheck, urlCheck, authorYearChecks] = await Promise.all([checkDoi(input), checkUrl(input), checkAuthorsAndYear(input)]);
  const checks = [checkTitle(input), doiCheck, urlCheck, ...authorYearChecks, checkAbstract(input)];
  return {
    checks,
    hasFailure: checks.some((c) => c.status === "❌"),
    hasWarning: checks.some((c) => c.status === "⚠️"),
  };
}

/**
 * Completeness-only check for citation-import entries (docs/planning/06 §3, docs/planning/14 §2) —
 * no network calls at all. CNKI's own metadata (including its DOI) is treated as authoritative
 * since it comes from the database itself, not a user claim that needs cross-checking — resolveDoi/
 * isUrlReachable would just be re-verifying CNKI against itself. Same VerifyReport shape as
 * verifyResource() so determineResourceStatus() works unchanged on either.
 */
export function verifyCitationRecord(input: VerifyInput): VerifyReport {
  const checks: FieldCheck[] = [
    checkTitle(input),
    input.authors.length > 0
      ? { field: "authors", status: "✅", detail: "题录自带作者信息" }
      : { field: "authors", status: "❌", detail: "未填写作者" },
    input.year !== null
      ? { field: "year", status: "✅", detail: "题录自带年份" }
      : { field: "year", status: "⚠️", detail: "未填写年份" },
    input.doi
      ? { field: "doi", status: "✅", detail: "题录自带 DOI（来自 CNKI，不再反查）" }
      : { field: "doi", status: "⚠️", detail: "题录未提供 DOI" },
    input.url
      ? { field: "url", status: "✅", detail: "题录自带直达链接（来自 CNKI，不再核对可达性）" }
      : { field: "url", status: "⚠️", detail: "题录未提供直达链接" },
    checkAbstract(input),
  ];
  return {
    checks,
    hasFailure: checks.some((c) => c.status === "❌"),
    hasWarning: checks.some((c) => c.status === "⚠️"),
  };
}
