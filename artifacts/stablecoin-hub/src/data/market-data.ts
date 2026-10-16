import pack from "./market-data-v02.generated.json";
import {
  unavailable,
  readMetric,
  readPoints,
  type DataMetric,
  type Copy,
} from "./market-data-model";
export const MARKET_PACKAGE = pack;
export function supplyMetrics(data: any) {
  return {
    total: readMetric(
      data?.total,
      unavailable(
        "MKT_TOTAL_TRACKED_USD",
        "Tracked circulating value (USD)",
        "SRC-MD-01",
        "DefiLlama",
        "USD",
      ),
    ),
    top2: readMetric(
      data?.top2,
      unavailable(
        "MKT_TOP2_SHARE",
        "Top-2 supply concentration",
        "SRC-MD-01",
        "DefiLlama",
        "%",
      ),
    ),
    change: readMetric(
      data?.change30d,
      unavailable(
        "MKT_30D_NET_CHANGE",
        "30-day net change",
        "SRC-MD-01",
        "DefiLlama",
        "USD",
      ),
    ),
    history: readPoints(data?.history),
  };
}
export const MACRO_TITLES: Record<string, Copy> = {
  SOFR: ["Secured overnight financing rate", "担保隔夜融资利率"],
  EFFR: ["Effective federal funds rate", "有效联邦基金利率"],
  DGS3MO: ["3-month Treasury yield", "3 个月美债收益率"],
  DGS2: ["2-year Treasury yield", "2 年美债收益率"],
  DGS10: ["10-year Treasury yield", "10 年美债收益率"],
  DTWEXBGS: ["Broad USD index", "广义美元指数"],
  VIXCLS: ["VIX", "VIX"],
  RRPONTSYD: ["Overnight reverse repo amount", "隔夜逆回购金额"],
  DEXCHUS: ["CNY per USD", "每美元对应人民币"],
  DEXHKUS: ["HKD per USD", "每美元对应港元"],
  DEXSIUS: ["SGD per USD", "每美元对应新元"],
};
export function macroSeries(data: any, ids: string[]) {
  return ids.map((id) => {
    const def = pack.macro.find((s) => s.series_id === id)!;
    const source_id =
      id === "SOFR"
        ? "SRC-MD-12"
        : id === "EFFR"
          ? "SRC-MD-13"
          : ["DGS3MO", "DGS2", "DGS10"].includes(id)
            ? "SRC-MD-14"
            : id === "DTWEXBGS"
              ? "SRC-MD-15"
              : id === "RRPONTSYD"
                ? "SRC-MD-16"
                : id === "VIXCLS"
                  ? "SRC-MD-17"
                  : "SRC-MD-18";
    const row = Array.isArray(data?.series)
      ? data.series.find((s: any) => s.id === id)
      : null;
    return {
      id,
      title: MACRO_TITLES[id],
      metric: readMetric(
        row?.metric,
        unavailable(id, def.name, source_id, "FRED", def.unit),
      ),
      points: readPoints(row?.observations),
    };
  });
}
export type IssuerDisclosure = {
  id: string;
  issuer: Copy;
  scope: Copy;
  period: Copy;
  publication: Copy;
  covered: Copy;
  composition: Copy;
  provider: Copy;
  frequency: Copy;
  redemption: Copy;
  limitation: Copy;
  sources: string[];
};
export const ISSUER_DISCLOSURES: IssuerDisclosure[] = [
  {
    id: "tether-reserve",
    issuer: ["USDT · Tether International", "USDT · Tether International"],
    scope: ["Quarterly reserve attestation", "季度储备鉴证"],
    period: ["30 Jun 2026 · Q2 2026", "2026-06-30 · 2026 Q2"],
    publication: ["31 Jul 2026", "2026-07-31"],
    covered: [
      "Financial figures and reserves report; use its stated liabilities/circulation scope.",
      "财务数据与储备报告；采用该报告声明的负债 / 流通范围。",
    ],
    composition: [
      "Read the quarterly reserve report; categories are not harmonised across issuers.",
      "查看季度储备报告；类别未经跨发行方统一。",
    ],
    provider: ["BDO", "BDO"],
    frequency: ["Quarterly", "季度"],
    redemption: [
      "Eligible direct customers under issuer terms; secondary holders do not have identical access.",
      "直接赎回须符合发行人条款；二级持有人准入不相同。",
    ],
    limitation: [
      "This reserve attestation is separate from the annual financial-statement audit.",
      "本储备鉴证与年度财务报表审计分开。",
    ],
    sources: ["SRC-MD-21"],
  },
  {
    id: "tether-audit",
    issuer: ["Tether International", "Tether International"],
    scope: ["Annual financial-statement audit", "年度财务报表审计"],
    period: ["Year ended 31 Dec 2025", "截至 2025-12-31 的年度"],
    publication: ["13 Aug 2026 · announcement", "2026-08-13 · 公告"],
    covered: [
      "Company financial statements for 2025; unqualified audit opinion announced.",
      "2025 年公司财务报表；公告为无保留审计意见。",
    ],
    composition: [
      "Not a quarterly reserve-composition snapshot.",
      "不是季度储备构成快照。",
    ],
    provider: ["KPMG U.S.", "KPMG U.S."],
    frequency: ["Annual", "年度"],
    redemption: [
      "Does not establish redemption eligibility for every token holder.",
      "不据此认定每位代币持有人均可直接赎回。",
    ],
    limitation: [
      "An annual company audit does not turn quarterly reserve attestations into audits.",
      "年度公司审计不将季度储备鉴证变为审计。",
    ],
    sources: ["SRC-MD-22"],
  },
  {
    id: "circle-transparency",
    issuer: ["USDC · Circle", "USDC · Circle"],
    scope: [
      "Reserve transparency; monthly attestations are a separate layer",
      "储备透明度；月度鉴证是另一披露层",
    ],
    period: [
      "12 Oct 2026 · dated page observation",
      "2026-10-12 · 已记录页面日期",
    ],
    publication: [
      "Dynamic page; publication date not specified",
      "动态页面；未指定发布日期",
    ],
    covered: [
      "USDC circulation, reserves, issuance and redemption are separately disclosed.",
      "USDC 流通、储备、发行与赎回分别披露。",
    ],
    composition: [
      "Bank deposits, overnight reverse Treasury repo and Treasuries with less than three months to maturity.",
      "银行存款、隔夜逆向国债回购及剩余期限少于 3 个月的美国国债。",
    ],
    provider: [
      "Issuer transparency; monthly attestation provider as named in each report",
      "发行方透明度；月度鉴证机构以具体报告为准",
    ],
    frequency: ["Dynamic page / monthly attestations", "动态页面 / 月度鉴证"],
    redemption: [
      "Circle Mint eligibility differs from general secondary holding.",
      "Circle Mint 资格与一般二级持有不同。",
    ],
    limitation: [
      "Values change on the source page; this record describes disclosure scope. Company financial results are separate.",
      "动态数值以来源页面为准；此记录描述披露范围，公司财务结果另列。",
    ],
    sources: ["SRC-MD-19"],
  },
  {
    id: "paxos-self",
    issuer: ["PYUSD · Paxos Trust Company", "PYUSD · Paxos Trust Company"],
    scope: ["Issuer self-report · Paxos Report", "发行方自报 · Paxos Report"],
    period: ["Monthly material through Aug 2026", "月度资料至 2026 年 8 月"],
    publication: [
      "Published after month-end; exact date depends on the document",
      "月末后发布；具体日期以文档为准",
    ],
    covered: [
      "Self-reported portfolio composition.",
      "发行方自行报告的资产组合构成。",
    ],
    composition: [
      "Use the monthly issuer report; no inferred percentages.",
      "采用月度发行方报告；不推定比例。",
    ],
    provider: ["Paxos; not independently reviewed", "Paxos；未经独立审阅"],
    frequency: ["Monthly", "月度"],
    redemption: [
      "Paxos account and product terms apply.",
      "须符合 Paxos 账户与产品条款。",
    ],
    limitation: [
      "Self-report is not independent attestation.",
      "发行方自报不是独立鉴证。",
    ],
    sources: ["SRC-MD-23"],
  },
  {
    id: "paxos-attestation",
    issuer: ["PYUSD · Paxos Trust Company", "PYUSD · Paxos Trust Company"],
    scope: ["Independent attestation / examination", "独立鉴证 / examination"],
    period: [
      "Monthly material through Aug 2026; use the selected report's period",
      "月度资料至 2026 年 8 月；以选定报告期间为准",
    ],
    publication: [
      "Report-specific; no missing month is inferred",
      "依具体报告；不补填缺失月份",
    ],
    covered: [
      "Specified reserve assertions under AICPA attestation standards.",
      "依据 AICPA 鉴证准则核验特定储备声明。",
    ],
    composition: [
      "Use the independent report's covered assets and liabilities.",
      "采用独立报告覆盖的资产与负债口径。",
    ],
    provider: [
      "KPMG LLP for reports posted on/after 28 Feb 2025",
      "2025-02-28 及之后发布报告由 KPMG LLP 出具",
    ],
    frequency: ["Monthly", "月度"],
    redemption: [
      "Paxos account and product terms apply.",
      "须符合 Paxos 账户与产品条款。",
    ],
    limitation: [
      "Separate from the Paxos self-report and a financial-statement audit.",
      "与 Paxos 自报及财务报表审计分开。",
    ],
    sources: ["SRC-MD-23"],
  },
  {
    id: "fdusd",
    issuer: [
      "FDUSD · FD121 (BVI) / First Digital Labs",
      "FDUSD · FD121 (BVI) / First Digital Labs",
    ],
    scope: [
      "Monthly reserve disclosure / independent attestation",
      "月度储备披露 / 独立鉴证",
    ],
    period: ["31 Aug 2026 · page snapshot", "2026-08-31 · 页面快照"],
    publication: [
      "Monthly publication; exact report date not established here",
      "月度发布；此处未确认具体报告发布日期",
    ],
    covered: [
      "Tokens issued/in circulation and reserve-account assets.",
      "已发行 / 流通代币及储备账户资产。",
    ],
    composition: [
      "Composition percentages are not reproduced without report-level verification.",
      "未经报告级核验不展示储备构成百分比。",
    ],
    provider: [
      "Independent third party; exact provider must be read from the report",
      "独立第三方；具体机构须依据报告",
    ],
    frequency: ["Monthly", "月度"],
    redemption: [
      "Direct purchase/redemption is restricted to qualified clients; secondary access is broader.",
      "直接购买 / 赎回限于符合资格客户；二级准入更广。",
    ],
    limitation: [
      "A page snapshot is not a harmonised reserve-quality comparison.",
      "页面快照不是统一口径的储备质量比较。",
    ],
    sources: ["SRC-MD-24"],
  },
];
export const DISCLOSURE_FIELDS: [
  keyof Pick<
    IssuerDisclosure,
    | "scope"
    | "period"
    | "publication"
    | "covered"
    | "composition"
    | "provider"
    | "frequency"
    | "redemption"
    | "limitation"
  >,
  Copy,
][] = [
  ["scope", ["Assurance scope / type", "核验范围 / 类型"]],
  ["period", ["Report period / snapshot", "报告期间 / 快照"]],
  ["publication", ["Publication date", "发布日期"]],
  ["covered", ["Circulation / liabilities covered", "覆盖流通 / 负债"]],
  ["composition", ["Reserve composition", "储备构成"]],
  ["provider", ["Provider", "核验机构"]],
  ["frequency", ["Frequency", "频率"]],
  ["redemption", ["Direct redemption eligibility", "直接赎回资格"]],
  ["limitation", ["Limitations", "局限"]],
];
