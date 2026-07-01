/**
 * CNKI exports are normally UTF-8, but older export tools (and some campus proxies) still emit
 * GBK. Try UTF-8 strictly first; only fall back to GBK if that fails, per docs/planning/06 §2
 * point 2. Uses the platform TextDecoder (Node ships full ICU by default since v13), no extra
 * dependency needed for GBK support.
 */
export function decodeCitationBuffer(buffer: Buffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("gbk").decode(buffer);
  }
}
