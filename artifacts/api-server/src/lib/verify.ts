import { resolveDoi } from "./scholar/doi";
import { titleOverlapScore, authorOverlapCount } from "./scholar/matching";
import { safeFetch } from "./safeUrl";

export type CheckStatus = "✅" | "⚠️" | "❌";

export interface FieldCheck {
  field: string;
  status: CheckStatus;
  detail: string;
  /**
   * Classifies *why* a non-✅ check failed (docs/planning/15 §0.2/§0.6) — "missing" means the field
   * is empty (the six-elements completeness check, evaluated separately in lib/resourceStatus.ts,
   * already covers this and takes priority); "mismatch" means the field is present but disagrees
   * with an authoritative source, which is what actually drives the 'disputed' status. Checks that
   * are neither (e.g. "URL currently unreachable" — could just be transient/login-walled, or "no DOI
   * to cross-check against" — inconclusive, not a disagreement) are left unclassified so they show
   * up in the report for the user's/admin's information without triggering 'disputed' on their own.
   */
  kind?: "missing" | "mismatch";
}

export interface VerifyInput {
  title: string;
  authors: string[];
  year: number | null;
  doi: string | null;
  url: string | null;
  abstract: string | null;
  keywords: string[];
}

// docs/planning/16 §16.3 — a target, not a hard rule: extracted keywords mirror whatever the
// source paper actually lists (could legitimately be 2 or 8), so this only flags out-of-range
// counts as a non-blocking ⚠️, never as a mismatch/failure.
const KEYWORD_COUNT_MIN = 3;
const KEYWORD_COUNT_MAX = 5;

export interface VerifyReport {
  checks: FieldCheck[];
  hasFailure: boolean;
  hasWarning: boolean;
}

async function isUrlReachable(url: string): Promise<boolean> {
  try {
    const res = await safeFetch(url, { method: "HEAD", signal: AbortSignal.timeout(8_000) });
    if (res.ok) return true;
    // Some servers don't implement HEAD (405/403) — retry with GET before giving up.
    if (res.status === 405 || res.status === 403) {
      const getRes = await safeFetch(url, { method: "GET", signal: AbortSignal.timeout(8_000) });
      const ok = getRes.ok;
      await getRes.body?.cancel();
      return ok;
    }
    return false;
  } catch {
    return false;
  }
}

function checkTitle(input: VerifyInput): FieldCheck {
  return input.title.trim().length > 0
    ? { field: "title", status: "✅", detail: "标题已填写" }
    : { field: "title", status: "❌", detail: "缺少标题", kind: "missing" };
}

const DOI_SYNTAX = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;

function normalizedTitleForContainment(title: string): string {
  return title
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * DOI registries can retain a paper's short/main title while the publisher page and PDF use a
 * longer title with a subtitle. A short generic title still needs matching author/year evidence.
 */
function hasCompatibleDoiTitle(input: VerifyInput, resolved: NonNullable<Awaited<ReturnType<typeof resolveDoi>>>): boolean {
  const inputTitle = normalizedTitleForContainment(input.title);
  const resolvedTitle = normalizedTitleForContainment(resolved.title);
  if (!inputTitle || !resolvedTitle) return false;
  if (!inputTitle.includes(resolvedTitle) && !resolvedTitle.includes(inputTitle)) return false;

  const shorter = inputTitle.length <= resolvedTitle.length ? inputTitle : resolvedTitle;
  if (shorter.split(" ").filter(Boolean).length >= 2) return true;

  return input.year !== null
    && resolved.year !== null
    && Math.abs(input.year - resolved.year) <= 1
    && authorOverlapCount(input.authors, resolved.authors) > 0;
}

async function checkDoi(input: VerifyInput, resolved: Awaited<ReturnType<typeof resolveDoi>>): Promise<FieldCheck> {
  if (!input.doi) return { field: "doi", status: "⚠️", detail: "未提供 DOI", kind: "missing" };
  if (!DOI_SYNTAX.test(input.doi)) return { field: "doi", status: "❌", detail: `DOI "${input.doi}" 格式不正确`, kind: "mismatch" };
  if (!resolved) {
    const reachable = await isUrlReachable(`https://doi.org/${input.doi}`);
    return reachable
      ? { field: "doi", status: "⚠️", detail: `DOI 可跳转，但暂时无法取得权威元数据，请人工核对` }
      : { field: "doi", status: "⚠️", detail: `DOI 暂时无法解析或访问，可能未被公共接口收录，请人工核对` };
  }
  const titleScore = titleOverlapScore(input.title, resolved.title);
  if (titleScore < 0.5 && !hasCompatibleDoiTitle(input, resolved)) {
    if (/^10\.2139\/ssrn\./i.test(input.doi) && authorOverlapCount(input.authors, resolved.authors) > 0) {
      return {
        field: "doi",
        status: "⚠️",
        detail: `SSRN 论文修订后的标题可能与 DOI 注册时的初始标题不同；作者一致，已交由管理员核对`,
      };
    }
    return { field: "doi", status: "❌", detail: `DOI 解析出的标题（"${resolved.title}"）与卡片标题差异较大，可能贴错了 DOI`, kind: "mismatch" };
  }
  return {
    field: "doi",
    status: "✅",
    detail: titleScore < 0.5
      ? "DOI 已确认存在；登记的简短标题与完整题名兼容"
      : "DOI 已确认存在，且标题一致",
  };
}

async function checkUrl(input: VerifyInput): Promise<FieldCheck> {
  if (!input.url) return { field: "url", status: "⚠️", detail: "未提供直达链接", kind: "missing" };
  const reachable = await isUrlReachable(input.url);
  // Unreachable is deliberately NOT `kind: "mismatch"` — it could be a transient outage or a
  // login wall, not necessarily a wrong link, so it shouldn't by itself route to 'disputed'
  // (docs/planning/15 §0.2's "can the user actually verify and fix this" standard doesn't cleanly
  // apply to a flaky third-party server). Still shown in the report for visibility.
  return reachable
    ? { field: "url", status: "✅", detail: "链接可正常访问" }
    : { field: "url", status: "⚠️", detail: "链接当前无法访问（可能临时故障或需要登录）" };
}

/** Cross-checks authors/year against the DOI's authoritative record when one is available. */
async function checkAuthorsAndYear(input: VerifyInput, resolved: Awaited<ReturnType<typeof resolveDoi>>): Promise<FieldCheck[]> {
  const checks: FieldCheck[] = [];
  const versionedPreprintWithMatchingAuthor = !!input.doi
    && /^(?:10\.2139\/ssrn\.|10\.48550\/arxiv\.)/i.test(input.doi)
    && !!resolved
    && authorOverlapCount(input.authors, resolved.authors) > 0;

  if (input.authors.length === 0) {
    checks.push({ field: "authors", status: "❌", detail: "未填写作者", kind: "missing" });
  } else if (input.doi) {
    if (resolved && resolved.authors.length > 0) {
      checks.push(
        authorOverlapCount(input.authors, resolved.authors) > 0
          ? { field: "authors", status: "✅", detail: "作者与 DOI 权威记录一致" }
          : { field: "authors", status: "⚠️", detail: "作者与 DOI 解析出的记录对不上，请人工核对", kind: "mismatch" },
      );
    } else {
      checks.push({ field: "authors", status: "⚠️", detail: "DOI 记录里没有作者信息，无法交叉核对" });
    }
  } else {
    checks.push({ field: "authors", status: "⚠️", detail: "无 DOI，无法交叉核对作者" });
  }

  if (input.year === null) {
    checks.push({ field: "year", status: "⚠️", detail: "未填写年份", kind: "missing" });
  } else if (resolved && resolved.year !== null) {
    // Off-by-one is tolerated: online-first vs. print-issue dates legitimately land a year apart
    // for the same paper often enough that flagging it as a "mismatch" would be a false positive
    // more often than a real catch.
    checks.push(
      Math.abs(input.year - resolved.year) <= 1
        ? { field: "year", status: "✅", detail: "年份与 DOI 权威记录一致" }
        : versionedPreprintWithMatchingAuthor
          ? { field: "year", status: "⚠️", detail: `预印本可能同时存在首次发布年（${resolved.year}）与后续修订年（${input.year}）；作者一致，已交由管理员核对` }
        : { field: "year", status: "⚠️", detail: `年份（${input.year}）与 DOI 解析出的年份（${resolved.year}）对不上，请人工核对`, kind: "mismatch" },
    );
  } else {
    checks.push({ field: "year", status: "✅", detail: "已填写年份" });
  }

  return checks;
}

function checkAbstract(input: VerifyInput): FieldCheck {
  return input.abstract && input.abstract.trim().length > 0
    ? { field: "abstract", status: "✅", detail: "摘要已填写" }
    : { field: "abstract", status: "⚠️", detail: "缺少摘要", kind: "missing" };
}

/** docs/planning/16 §16.3 — informational only; never blocks (no "mismatch" kind), since a paper legitimately having 2 or 8 keywords isn't wrong, just outside the suggested range. */
function checkKeywords(input: VerifyInput): FieldCheck {
  const n = input.keywords.length;
  if (n === 0) return { field: "keywords", status: "⚠️", detail: "未提供关键词", kind: "missing" };
  if (n < KEYWORD_COUNT_MIN || n > KEYWORD_COUNT_MAX) {
    return { field: "keywords", status: "⚠️", detail: `关键词数量为 ${n} 个，建议 ${KEYWORD_COUNT_MIN}-${KEYWORD_COUNT_MAX} 个（不强制）` };
  }
  return { field: "keywords", status: "✅", detail: `关键词数量（${n}）符合建议区间` };
}

/**
 * Pre-persist verification — produces a field-by-field report rather than a binary pass/reject,
 * so the upload confirm dialog can show the user exactly what's uncertain instead of a black box.
 * Read-only w.r.t. the database (only does DOI lookups / URL reachability checks over the network).
 */
export async function verifyResource(input: VerifyInput): Promise<VerifyReport> {
  const resolved = input.doi ? await resolveDoi(input.doi) : null;
  const [doiCheck, urlCheck, authorYearChecks] = await Promise.all([checkDoi(input, resolved), checkUrl(input), checkAuthorsAndYear(input, resolved)]);
  const checks = [checkTitle(input), doiCheck, urlCheck, ...authorYearChecks, checkAbstract(input), checkKeywords(input)];
  return {
    checks,
    hasFailure: checks.some((c) => c.status === "❌"),
    hasWarning: checks.some((c) => c.status === "⚠️"),
  };
}

/**
 * A connector capture is direct evidence that the submitted URL rendered in the user's active
 * browser tab. Keep DOI cross-checks, but do not re-fetch the same anti-bot page from the server
 * and turn the connector's strongest evidence into a misleading reachability warning.
 */
export async function verifyBrowserCapture(input: VerifyInput): Promise<VerifyReport> {
  const report = await verifyResource({ ...input, url: null });
  const checks = report.checks.map((check) => check.field === "url"
    ? input.url
      ? { field: "url", status: "✅" as const, detail: "链接已由浏览器插件在用户当前标签页中读取" }
      : check
    : check);
  return {
    checks,
    hasFailure: checks.some((check) => check.status === "❌"),
    hasWarning: checks.some((check) => check.status === "⚠️"),
  };
}

/**
 * Completeness-only check for citation-import entries (docs/planning/06 §3, docs/planning/14 §2) —
 * no network calls at all. CNKI's own metadata (including its DOI) is treated as authoritative
 * since it comes from the database itself, not a user claim that needs cross-checking — resolveDoi/
 * isUrlReachable would just be re-verifying CNKI against itself. Same VerifyReport shape as
 * verifyResource() so the shared status-determination logic works unchanged on either.
 */
export function verifyCitationRecord(input: VerifyInput): VerifyReport {
  const checks: FieldCheck[] = [
    checkTitle(input),
    input.authors.length > 0
      ? { field: "authors", status: "✅", detail: "题录自带作者信息" }
      : { field: "authors", status: "❌", detail: "未填写作者", kind: "missing" },
    input.year !== null
      ? { field: "year", status: "✅", detail: "题录自带年份" }
      : { field: "year", status: "⚠️", detail: "未填写年份", kind: "missing" },
    input.doi
      ? { field: "doi", status: "✅", detail: "题录自带 DOI（来自 CNKI，不再反查）" }
      : { field: "doi", status: "⚠️", detail: "题录未提供 DOI", kind: "missing" },
    input.url
      ? { field: "url", status: "✅", detail: "题录自带直达链接（来自 CNKI，不再核对可达性）" }
      : { field: "url", status: "⚠️", detail: "题录未提供直达链接", kind: "missing" },
    checkAbstract(input),
    checkKeywords(input),
  ];
  return {
    checks,
    hasFailure: checks.some((c) => c.status === "❌"),
    hasWarning: checks.some((c) => c.status === "⚠️"),
  };
}
