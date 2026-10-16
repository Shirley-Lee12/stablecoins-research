export type Copy = readonly [en: string, zh: string];
export type DataState =
  | "FRESH"
  | "DELAYED"
  | "LAST_SUCCESSFUL_SNAPSHOT"
  | "REPORT_SNAPSHOT"
  | "UNAVAILABLE"
  | "NOT_APPLICABLE"
  | "UNKNOWN_TO_VERIFY";
export type DataMetric = {
  metric_id: string;
  label: string;
  value: number | null;
  unit: string;
  source_id: string;
  source: string;
  source_url: string;
  observation_time: string | null;
  report_period_end: string | null;
  publication_time: string | null;
  freshness_state: DataState;
  last_successful_fetch: string | null;
  methodology_note: string;
  coverage_note: string;
  is_estimate: boolean;
  is_adjusted: boolean;
  source_scope: string;
};
export const STATES: Record<DataState, Copy> = {
  FRESH: ["Live / fresh", "动态 / 新鲜"],
  DELAYED: ["Delayed", "延迟"],
  LAST_SUCCESSFUL_SNAPSHOT: ["Last successful snapshot", "上次成功快照"],
  REPORT_SNAPSHOT: ["Report snapshot", "报告快照"],
  UNAVAILABLE: ["Unavailable", "不可用"],
  NOT_APPLICABLE: ["Not applicable", "不适用"],
  UNKNOWN_TO_VERIFY: ["Unknown / to verify", "未知 / 待核验"],
};
export function finite(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}
export function validTime(value: unknown): string | null {
  return typeof value === "string" &&
    value.trim() &&
    Number.isFinite(Date.parse(value))
    ? value
    : null;
}
export function unavailable(
  id: string,
  label: string,
  source_id: string,
  source: string,
  unit: string,
  state: DataState = "UNAVAILABLE",
): DataMetric {
  return {
    metric_id: id,
    label,
    source_id,
    source,
    unit,
    value: null,
    source_url: "",
    observation_time: null,
    report_period_end: null,
    publication_time: null,
    freshness_state: state,
    last_successful_fetch: null,
    methodology_note: "",
    coverage_note: "",
    source_scope: "",
    is_estimate: false,
    is_adjusted: false,
  };
}
export function readMetric(raw: unknown, fallback: DataMetric): DataMetric {
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as DataMetric;
  if (
    [
      "label",
      "unit",
      "source",
      "source_id",
      "methodology_note",
      "coverage_note",
    ].some((key) => typeof (r as any)[key] !== "string") ||
    r.source_id !== fallback.source_id
  )
    return fallback;
  const state = Object.hasOwn(STATES, r.freshness_state)
    ? r.freshness_state
    : "UNKNOWN_TO_VERIFY";
  const obs = validTime(r.observation_time),
    period = validTime(r.report_period_end);
  const valid =
    finite(r.value) !== null &&
    Boolean(state === "REPORT_SNAPSHOT" ? period : obs) &&
    !["UNAVAILABLE", "UNKNOWN_TO_VERIFY", "NOT_APPLICABLE"].includes(state);
  return {
    ...fallback,
    ...r,
    metric_id: fallback.metric_id,
    source_id: fallback.source_id,
    value: valid ? finite(r.value) : null,
    observation_time: obs,
    report_period_end: period,
    freshness_state: valid
      ? state
      : state === "REPORT_SNAPSHOT" && period
        ? "REPORT_SNAPSHOT"
        : r.value == null
          ? "UNAVAILABLE"
          : "UNKNOWN_TO_VERIFY",
  };
}
export function markLastSuccessful<T>(payload: T): T {
  if (Array.isArray(payload)) return payload.map(markLastSuccessful) as T;
  if (payload && typeof payload === "object") {
    const obj = Object.fromEntries(
      Object.entries(payload).map(([k, v]) => [k, markLastSuccessful(v)]),
    );
    if (["FRESH", "DELAYED"].includes(obj.freshness_state as string))
      obj.freshness_state = "LAST_SUCCESSFUL_SNAPSHOT";
    return obj as T;
  }
  return payload;
}
export function displayValue(m: DataMetric): string | null {
  if (finite(m.value) === null) return null;
  const n = m.value!;
  if (m.unit === "USD" || m.unit === "USD/year")
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(n);
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits:
      m.unit === "bps" || m.unit === "%"
        ? 2
        : m.unit.includes("base token")
          ? 6
          : 4,
    notation: Math.abs(n) >= 1e6 ? "compact" : "standard",
  }).format(n);
}
export type Point = { date: string; value: number | null };
export function readPoints(input: unknown): Point[] {
  if (!Array.isArray(input)) return [];
  return input
    .flatMap((p) =>
      validTime(p?.date) ? [{ date: p.date, value: finite(p.value) }] : [],
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}
export function reportMetric(
  id: string,
  label: string,
  value: number | null,
  unit: string,
): DataMetric {
  return {
    ...unavailable(
      id,
      label,
      "SRC-MD-10",
      "Artemis 2025 payments report",
      unit,
    ),
    value,
    report_period_end: "2025-08",
    publication_time: null,
    freshness_state: "REPORT_SNAPSHOT",
    is_estimate: true,
    methodology_note:
      "Study period: Jan 2023–Aug 2025. 22 surveyed firms + 11 estimated firms. Annualised run rate refers to Aug 2025; publication month: Oct 2025 (day not specified).",
    coverage_note:
      "Sampled attributable payments; not a live 2026 measure or the entire global stablecoin payment market.",
  };
}
export const PAYMENT_REPORT = {
  period: [
    "Study period: Jan 2023–Aug 2025",
    "研究期：2023 年 1 月–2025 年 8 月",
  ] as Copy,
  sample: [
    "22 surveyed firms + 11 estimated firms",
    "22 家受访公司 + 11 家补充估算",
  ] as Copy,
  cumulative: reportMetric(
    "ADOPT_PAYMENT_CUM",
    "Attributable sampled payments",
    136e9,
    "USD",
  ),
  runrate: reportMetric(
    "ADOPT_PAYMENT_RUNRATE",
    "Sample annualised run rate · Aug 2025",
    122e9,
    "USD/year",
  ),
};
export const LENSES = [
  [
    "market",
    "Market",
    "市场",
    "Supply size, concentration, observed price deviation and selected venue liquidity.",
    "供应规模、集中度、观测价格偏离及选定场所流动性。",
  ],
  [
    "on-chain",
    "On-chain",
    "链上",
    "Supply by chain; raw, adjusted and P2P transfers; active addresses.",
    "各链供应；原始、调整后和 P2P 转移；活跃地址。",
  ],
  [
    "issuers-reserves",
    "Issuers & reserves",
    "发行方与储备",
    "Disclosure periods, assurance scopes and direct redemption eligibility.",
    "披露期间、鉴证范围与直接赎回资格。",
  ],
  [
    "macro",
    "Macro",
    "宏观",
    "Rates, Treasury yields, dollar, market stress and money-market conditions.",
    "利率、美债收益率、美元、市场压力与货币市场环境。",
  ],
  [
    "adoption",
    "Adoption",
    "采用",
    "Attributable payment research, on-chain activity and issuer-defined evidence.",
    "可归因支付研究、链上活动与发行方定义的证据。",
  ],
] as const;
export const META_ZH: Record<string, Copy> = {
  "SRC-MD-05": [
    "以太坊合约的铸造、销毁与流通语义需逐合约验证，原始日志不直接等于流通发行。",
    "仅选定以太坊合约；条件未满足时不展示发行量或持币集中度。",
  ],
  "SRC-MD-07": [
    "需保留 Artemis 的原始转移额与活跃地址定义；没有已获许可的观测时不展示数字。",
    "链上活动不是可归因支付；地址不等于用户。",
  ],
  "SRC-MD-08": [
    "Artemis 方法去重并剔除交易所内部转移和 MEV，仍为调整后转移口径。",
    "没有已确认的 API 与再分发许可时仅提供来源；不与原始或 P2P 转移相加。",
  ],
  "SRC-MD-09": [
    "P2P 为钱包 / EOA 间转移，不自动等于商户支付。",
    "没有已确认的 API 与再分发许可时仅提供来源；不与其他转移口径相加。",
  ],
  "SRC-MD-01": [
    "仅使用来源的 totalCirculatingUSD 字段；历史与净变化保留来源观测日，不用代币数量或假设价格替代。",
    "DefiLlama 追踪范围，不代表全世界所有稳定币；保留来源原生 / 跨链分类，各链金额不再次相加。",
  ],
  "SRC-MD-02": [
    "订单簿按所示采集时点抽样，场所事件时间不可用；深度为中间价 ±2% 范围。滑点按明确方向和 USDT 名义金额模拟；深度不足时不可用，不假定 USDT 等于 USD。",
    "仅为选定 Binance 交易对。采集新鲜不等于场所事件新鲜，不代表全市场。",
  ],
  "SRC-MD-03": [
    "按所示采集时点记录提供商池快照，提供商观测时间不可用；池流动性与 24h 成交额不是订单簿深度或执行滑点。",
    "仅为 USDC / USDT 查询返回的选定以太坊池，不代表全 DEX 市场。",
  ],
  "SRC-MD-04": [
    "绝对偏离 = abs(价格 / 已核验美元目标 - 1) × 10,000。仅展示健康来源的最新观测，不推断概率或历史事件。",
    "仅选定美元目标发行方代币；排除收益凭证和非美元目标。小时观测可能漏掉短暂偏离。",
  ],
  "SRC-MD-10": [
    "研究期：2023 年 1 月–2025 年 8 月；22 家受访公司及 11 家补充估算。年化规模对应 2025 年 8 月；发布于 2025 年 10 月，未给出具体日。",
    "可归因支付样本，不是 2026 年实时规模，也不是全球支付全市场。",
  ],
};
