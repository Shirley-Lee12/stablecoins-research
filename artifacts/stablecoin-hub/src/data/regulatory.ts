import pack from "./regulatory-v02.generated.json";
export type Copy = readonly [string, string];
export { pack as regulatoryPackage };
export const VERIFIED = pack.lastVerified;
export const FIELDS = [
  ["primary_instruments", "Primary instrument", "主要法律文件"],
  ["issuer_permission", "Issuer / authorisation", "发行人 / 授权准入"],
  ["reserve_backing", "Reserves / asset protection", "储备 / 资产保护"],
  ["redemption", "Redemption", "赎回"],
  [
    "ongoing_supervision",
    "Disclosure / AML / supervision",
    "披露 / 反洗钱 / 持续监管",
  ],
  ["critical_boundary", "Critical boundary", "关键边界"],
] as const;
export type Field = (typeof FIELDS)[number][0];
export const STATUS_COPY: Record<string, Copy> = {
  IN_FORCE: ["In force / applicable", "已生效 / 已适用"],
  ENACTED_NOT_YET_EFFECTIVE: [
    "Enacted — not yet effective",
    "已立法 — 尚未生效",
  ],
  FINAL_RULES_NOT_YET_EFFECTIVE: [
    "Final rules — future commencement",
    "最终规则 — 未来生效",
  ],
  IMPLEMENTATION_RULEMAKING: ["Implementation rulemaking", "实施规则制定中"],
  CONSULTATION: ["Consultation", "咨询"],
  RESTRICTIVE_PROHIBITIVE: [
    "Restrictive / prohibitive boundary",
    "限制性 / 禁止性边界",
  ],
  GUIDANCE_ONLY: ["Guidance", "监管指引"],
};
export const STATUS_ZH: Record<string, string> = {
  IN_FORCE: "具有约束力，并已在所述范围内适用。",
  ENACTED_NOT_YET_EFFECTIVE: "法律已通过，但核心生效日期尚未到来。",
  FINAL_RULES_NOT_YET_EFFECTIVE: "最终实施规则已经发布，但适用日期在未来。",
  IMPLEMENTATION_RULEMAKING: "法律或政策框架已确定，监管机构仍在制定实施规则。",
  CONSULTATION: "提案处于征求意见或意见处理阶段，尚非具有约束力的最终规则。",
  RESTRICTIVE_PROHIBITIVE:
    "在所述活动范围内，不存在常规授权路径，以限制或禁止为主要边界。",
  GUIDANCE_ONLY: "监管指引或预期本身不等同于独立、专门且具有约束力的制度。",
};
const LABELS: Copy[] = [
  [
    "Enacted — implementation rulemaking — not yet effective",
    "已立法 — 实施规则制定中 — 尚未生效",
  ],
  ["MiCA in force / applicable", "MiCA 已生效 / 已适用"],
  [
    "Final rules published — full commencement 25 October 2027",
    "最终规则已发布 — 完整制度于 2027 年 10 月 25 日全面生效",
  ],
  [
    "Issuer regime in force — licensed issuers exist",
    "发行人制度已生效 — 已有持牌发行人",
  ],
  [
    "Implementation consultation — dedicated MAS-SCS regime not yet in force",
    "实施咨询中 — 专门 MAS-SCS 制度尚未生效",
  ],
  [
    "Electronic Payment Instrument regime in force",
    "Electronic Payment Instrument 制度已生效",
  ],
  [
    "CBUAE onshore Payment Token Services Regulation in force",
    "CBUAE 在岸 Payment Token Services Regulation 已生效",
  ],
  ["Restrictive / prohibitive boundary", "限制性 / 禁止性边界"],
];
const BOUNDARIES: Copy[] = [
  [
    "Enactment does not mean that the federal regime is effective. Implementation rulemaking remains underway as of 16 October 2026.",
    "已立法不等于联邦制度已生效。截至 2026 年 10 月 16 日，实施规则仍在制定中。",
  ],
  [
    "The 2026 MiCA review does not suspend the applicable regime.",
    "2026 年 MiCA 评估不暂停现有制度的适用。",
  ],
  [
    "Final FCA rules are published; full commencement remains in the future. The BoE systemic layer is distinct.",
    "FCA 最终规则已发布，完整制度的生效日期仍在未来；BoE 系统性监管层另行区分。",
  ],
  [
    "Issuer licence ≠ token public launch. A register entry does not establish broad retail circulation.",
    "发行人牌照 ≠ 代币公开上线；登记册条目也不证明代币已广泛零售流通。",
  ],
  [
    "Existing DPT/MPI status or products such as XSGD/XUSD do not establish MAS-regulated stablecoin status under the dedicated future MAS-SCS regime.",
    "现有 DPT/MPI 资质或 XSGD/XUSD 等产品，不证明其属于未来专门 MAS-SCS 制度下的 MAS-regulated stablecoin。",
  ],
  [
    "Electronic Payment Instruments is the statutory category. Authorisation depends on the issuer form and service; there is no single generic Japan stablecoin licence.",
    "Electronic Payment Instruments 是法定类别；准入取决于主体形式与业务，不存在统一的“日本稳定币牌照”。",
  ],
  [
    "This row covers only the CBUAE onshore perimeter. VARA, ADGM and DIFC are separate perimeters.",
    "本行仅代表 CBUAE 在岸范围；VARA、ADGM 与 DIFC 是不同监管边界。",
  ],
  [
    "The current controlling notice is 银发〔2026〕42号, which replaces the 2021 notice. This is a restrictive boundary, rather than a comparable issuer-licensing regime.",
    "现行主基线为取代 2021 年通知的银发〔2026〕42号。这是限制性边界，不是可直接类比的发行人发牌制度。",
  ],
];
const STAGE_ZH = [
  "2025-07-18 成法；预计 2027-01-18 生效，除非最终实施规则触发更早生效。",
  "ART/EMT 条款自 2024-06-30 适用；完整 MiCA 框架于 2024 年实施。",
  "2026-02-04 制定法规；2026-06-30 发布 FCA 最终规则；完整制度于 2027-10-25 全面生效。",
  "发行人制度自 2025-08-01 生效；首批牌照自 2026-04-10 生效。",
  "2023 年完成政策设计；实施咨询期为 2026-09-01 至 2026-10-16（新加坡时间 23:59 截止）。",
  "Electronic Payment Instrument 制度自 2023-06-01 生效；新中介制度自 2026-06-01 生效。",
  "CBUAE 在岸制度自 2024-08-31 生效。",
  "银发〔2026〕42号自 2026-02-06 生效，并取代 2021 年通知。",
];
const ZH: Record<Field, string>[] = [
  {
    primary_instruments: "GENIUS Act（Pub. L. 119-27）；联邦实施规则提案。",
    issuer_permission: "为许可支付稳定币发行人设联邦及符合条件的州级路径。",
    reserve_backing:
      "成文法要求至少 1:1、可识别的指定流动资产储备；实施规则仍在定稿。",
    redemption: "成文法要求公开、及时的赎回政策；联邦提案进一步细化操作时限。",
    ongoing_supervision:
      "成文法规定月度储备构成披露、独立会计检查及认证；AML/CFT 实施规则仍在制定。",
    critical_boundary: BOUNDARIES[0][1],
  },
  {
    primary_instruments:
      "MiCA Regulation (EU) 2023/1114 及 EBA/ESMA 技术标准。",
    issuer_permission:
      "ART 与 EMT 发行人须取得相应授权；重大规模代币进入 EBA 层级监管。",
    reserve_backing: "按类别适用储备、托管、自有资金、流动性及风险管理要求。",
    redemption: "持有人与赎回权取决于 ART / EMT 类别；赎回计划要求已适用。",
    ongoing_supervision:
      "白皮书、治理、投诉、报告及恢复/赎回计划；2026 年评估进行中，现行规则继续适用。",
    critical_boundary: BOUNDARIES[1][1],
  },
  {
    primary_instruments:
      "FSMA 2000 (Cryptoassets) Regulations 2026；FCA PS26/10；BoE 系统性稳定币框架。",
    issuer_permission:
      "未来制度下合格稳定币发行须获 FCA 授权；系统性发行人另进入 BoE / FCA 联合框架。",
    reserve_backing:
      "FCA 最终规则规定支持资产及保障要求；系统性审慎监管层由 BoE 处理。",
    redemption: "FCA 最终规则包含赎回要求；系统性规则增加金融稳定约束。",
    ongoing_supervision:
      "披露、资产保障、审慎要求、Consumer Duty、运营韧性及系统性监管转换规则。",
    critical_boundary: BOUNDARIES[2][1],
  },
  {
    primary_instruments:
      "《稳定币条例》（第 656 章）及 HKMA 监管 / 反洗钱指引。",
    issuer_permission: "在适用范围内从事受监管法币参考稳定币发行须持牌。",
    reserve_backing:
      "高质量、高流动性储备；资产隔离、信托保护、风险管理及定期独立鉴证 / 审计。",
    redemption: "持牌发行人须依条例及指引提供按面值赎回权。",
    ongoing_supervision: "治理、披露、技术风险、业务连续性及 AML/CFT 监管。",
    critical_boundary: BOUNDARIES[3][1],
  },
  {
    primary_instruments: "MAS-SCS 政策框架及拟议 Payment Services Act 修法。",
    issuer_permission:
      "拟议范围为在新加坡发行、锚定 SGD 或 G10 货币的 SCS；制度生效后，仅符合条件的发行人可使用 MAS-regulated 标签。",
    reserve_backing:
      "拟议价值稳定保障涵盖储备构成、估值、托管、审计，以及资本和流动资产。",
    redemption: "政策设计要求五个营业日内按面值赎回。",
    ongoing_supervision: "披露与用户保护要求属于拟议实施内容。",
    critical_boundary: BOUNDARIES[4][1],
  },
  {
    primary_instruments:
      "Payment Services Act 下的电子支付工具制度及 2026 年中介修法。",
    issuer_permission:
      "Electronic Payment Instrument Exchange Service Providers 须登记；2026 年规则也允许在规定条件下采用已登记的中介模式。",
    reserve_backing:
      "支持资产与资产保障取决于发行人的法律形式，以及银行、资金转移或信托制度。",
    redemption:
      "法币挂钩与可赎回性是电子支付工具类别的核心；业务规则保护客户资产及交易。",
    ongoing_supervision: "适用登记、客户保护、AML/CFT 与 Travel Rule 义务。",
    critical_boundary: BOUNDARIES[5][1],
  },
  {
    primary_instruments: "CBUAE Payment Token Services Regulation C 2/2024。",
    issuer_permission:
      "牌照 / 登记涵盖 Dirham Payment Token 发行、托管 / 转移及兑换；外国发行人登记另有规定。",
    reserve_backing:
      "储备受保护并隔离，价值至少覆盖流通面值；按发行人类型适用现金 / 合格政府资产细则。",
    redemption:
      "持有人可请求按面值赎回；持牌发行人须无延迟处理，通常不迟于下一营业日。",
    ongoing_supervision: "资本、储备审计、客户协议、AML/CFT 及运营要求。",
    critical_boundary: BOUNDARIES[6][1],
  },
  {
    primary_instruments:
      "八部门《关于进一步防范和处置虚拟货币等相关风险的通知》银发〔2026〕42号。",
    issuer_permission:
      "虚拟货币相关业务仍属非法金融活动；没有常规境内私人稳定币发行 / 支付发牌路径。",
    reserve_backing:
      "此类业务未作为常规持牌业务开放，因而不存在对应的专门发行人审慎储备制度。",
    redemption: "不存在境内受监管的私人稳定币公众赎回框架。",
    ongoing_supervision:
      "支付渠道管控、反洗钱 / 风险执法及境外服务限制；境外人民币挂钩稳定币发行，以及境内主体及其控制境外主体的境外发行须经相关批准。",
    critical_boundary: BOUNDARIES[7][1],
  },
];
export const JURISDICTIONS = pack.jurisdictions.map((r, i) => ({
  id: ["us", "eu", "uk", "hk", "sg", "jp", "uae", "cn"][i],
  name: [r.jurisdiction_en, r.jurisdiction_zh] as Copy,
  status: LABELS[i],
  codes: r.status.split(" + "),
  stage: [r.current_stage_date, STAGE_ZH[i]] as Copy,
  fields: Object.fromEntries(
    FIELDS.map(([key]) => [
      key,
      [
        key === "critical_boundary" ? BOUNDARIES[i][0] : r[key],
        ZH[i][key],
      ] as Copy,
    ]),
  ) as Record<Field, Copy>,
  sourceIds: r.source_ids.split(";"),
  deepLink: r.deep_link,
}));
export const HK_LICENSEES = [
  {
    name: "Anchorpoint Financial Limited",
    number: "FRS01",
    effective: "2026-04-10",
  },
  {
    name: "The Hongkong and Shanghai Banking Corporation Limited (HSBC)",
    number: "FRS02",
    effective: "2026-04-10",
  },
];
export type SourceDates = {
  publication?: Copy;
  enactment?: Copy;
  effective?: Copy;
  licence?: Copy;
  consultation?: Copy;
};
const date = (en: string, zh: string): Copy => [en, zh];
export const SOURCE_DATES: Record<string, SourceDates> = {
  "US-01": {
    enactment: date("18 July 2025", "2025 年 7 月 18 日"),
    effective: date(
      "Expected 18 January 2027, absent an earlier final-rule trigger: earlier of 18 months after enactment or 120 days after final implementing regulations.",
      "预计 2027 年 1 月 18 日，除非最终规则触发更早生效：立法后 18 个月与最终实施规则发布后 120 天两者较早者。",
    ),
  },
  "US-02": { publication: date("29 September 2026", "2026 年 9 月 29 日") },
  "US-03": { publication: date("7 April 2026", "2026 年 4 月 7 日") },
  "EU-01": {
    effective: date(
      "30 June 2024 · ART/EMT provisions",
      "2024 年 6 月 30 日 · ART/EMT 条款",
    ),
  },
  "EU-02": {
    effective: date(
      "10 February 2025 · redemption-plan guidelines",
      "2025 年 2 月 10 日 · 赎回计划指引",
    ),
  },
  "EU-03": { publication: date("20 May 2026", "2026 年 5 月 20 日") },
  "UK-01": {
    enactment: date(
      "4 February 2026 · regulations made",
      "2026 年 2 月 4 日 · 法规制定",
    ),
    effective: date(
      "25 October 2027 · full regime commencement",
      "2027 年 10 月 25 日 · 完整制度全面生效",
    ),
  },
  "UK-02": {
    publication: date("30 June 2026", "2026 年 6 月 30 日"),
    effective: date(
      "25 October 2027 · full regime commencement",
      "2027 年 10 月 25 日 · 完整制度全面生效",
    ),
  },
  "UK-03": { publication: date("22 June 2026", "2026 年 6 月 22 日") },
  "HK-01": {
    effective: date(
      "1 August 2025 · issuer regime",
      "2025 年 8 月 1 日 · 发行人制度",
    ),
  },
  "HK-02": {
    licence: date(
      "10 April 2026 · FRS01 and FRS02",
      "2026 年 4 月 10 日 · FRS01 及 FRS02",
    ),
  },
  "SG-01": { publication: date("15 August 2023", "2023 年 8 月 15 日") },
  "SG-02": {
    publication: date("1 September 2026", "2026 年 9 月 1 日"),
    consultation: date(
      "16 October 2026 · 23:59 Singapore time",
      "2026 年 10 月 16 日 · 新加坡时间 23:59",
    ),
  },
  "SG-03": {
    publication: date("1 September 2026", "2026 年 9 月 1 日"),
    consultation: date(
      "16 October 2026 · 23:59 Singapore time",
      "2026 年 10 月 16 日 · 新加坡时间 23:59",
    ),
  },
  "JP-01": {
    effective: date(
      "1 June 2023 · Electronic Payment Instrument regime",
      "2023 年 6 月 1 日 · Electronic Payment Instrument 制度",
    ),
  },
  "JP-02": {
    effective: date(
      "1 June 2026 · new intermediary regime",
      "2026 年 6 月 1 日 · 新中介制度",
    ),
  },
  "JP-03": { publication: date("22 May 2026", "2026 年 5 月 22 日") },
  "UAE-01": {
    effective: date(
      "31 August 2024 · CBUAE onshore",
      "2024 年 8 月 31 日 · CBUAE 在岸范围",
    ),
  },
  "CN-01": {
    publication: date("6 February 2026 · notice", "2026 年 2 月 6 日 · 通知"),
    effective: date("6 February 2026", "2026 年 2 月 6 日"),
  },
  "INT-01": { publication: date("17 July 2023", "2023 年 7 月 17 日") },
  "INT-02": { publication: date("12 October 2026", "2026 年 10 月 12 日") },
  "INT-03": { publication: date("3 March 2026", "2026 年 3 月 3 日") },
  "INT-04": { publication: date("13 July 2022", "2022 年 7 月 13 日") },
};
export const INSTRUMENTS: Record<string, Copy> = {
  LAW: ["LAW", "法律"],
  REGULATION: ["REGULATION", "法规"],
  FINAL_RULE: ["FINAL RULE", "最终规则"],
  PROPOSED_RULE: ["PROPOSED RULE", "规则提案"],
  CONSULTATION: ["CONSULTATION", "咨询"],
  GUIDANCE: ["GUIDANCE", "监管指引"],
  REGISTER: ["REGISTER", "牌照 / 登记册"],
  POLICY_FRAMEWORK: ["POLICY FRAMEWORK", "政策框架"],
  NOTICE: ["NOTICE", "通知"],
  INTERNATIONAL_STANDARD: ["INTERNATIONAL STANDARD", "国际标准"],
  MONITORING_REPORT: ["MONITORING REPORT", "监测报告"],
  REGULATION_GUIDANCE: ["REGULATION / GUIDANCE", "法规 / 监管指引"],
  FINAL_GUIDELINE: ["GUIDANCE · FINAL", "最终监管指引"],
  REVIEW_CONSULTATION: ["CONSULTATION · REVIEW", "评估咨询"],
  LAW_REGULATION: ["REGULATION", "法规"],
  DRAFT_RULE_POLICY: ["PROPOSED RULE / POLICY", "规则草案 / 政策"],
  CONSULTATION_RELEASE: ["CONSULTATION · RELEASE", "咨询公告"],
  FINAL_RULE_AMENDMENT: ["FINAL RULE · AMENDMENT", "最终规则修订"],
  GOVERNMENT_DATABASE: [
    "GOVERNMENT DATABASE · NOTICE STATUS",
    "政府数据库 · 通知状态",
  ],
  INTERNATIONAL_AML: [
    "INTERNATIONAL STANDARD / REPORT · AML",
    "国际标准 / 报告 · 反洗钱",
  ],
};
const EVENTS_ZH = [
  "MiCA ART/EMT 条款开始适用。",
  "CBUAE 在岸 Payment Token Services Regulation 生效。",
  "GENIUS Act 成法。",
  "香港稳定币发行人制度生效。",
  "发布银发〔2026〕42号，取代 2021 年通知。",
  "首批两张发行人牌照生效；牌照不等于代币公开上线。",
  "新的电子支付工具 / 加密资产业务中介制度开始实施。",
  "FCA 发布稳定币发行最终规则；完整制度于 2027-10-25 全面生效。",
  "MAS 开启实施立法咨询，2026-10-16 新加坡时间 23:59 截止。",
  "Federal Register 发布联储 GENIUS Act 实施规则提案。",
  "FSB 发布跨境脆弱性及金融稳定监测报告。",
];
export const EVENT_TYPES: Record<string, Copy> = {
  IN_FORCE: ["In force / applicable", "生效 / 适用"],
  LAW_ENACTED: ["Law enacted", "法律通过"],
  RESTRICTIVE_BOUNDARY: ["Restrictive boundary", "限制性边界"],
  REGISTER: ["Register / licence", "登记 / 牌照"],
  FINAL_RULE: ["Final rule published", "最终规则发布"],
  CONSULTATION: ["Consultation", "咨询"],
  PROPOSED_RULE: ["Proposed rule", "规则提案"],
  INTERNATIONAL_MONITORING: ["International monitoring", "国际监测"],
};
export const TIMELINE = pack.timeline.map((r, i) => ({
  ...r,
  eventCopy: [r.event, EVENTS_ZH[i]] as Copy,
  jurisdictionCopy:
    r.jurisdiction === "International"
      ? (["International", "国际"] as Copy)
      : JURISDICTIONS.find((j) =>
          j.sourceIds.some((id) => r.source_ids.includes(id)),
        )!.name,
}));
export const CONVERGENCE: Copy[] = [
  ["Issuer authorisation", "发行人授权准入"],
  [
    "Reserve quality, liquidity, segregation and custody",
    "储备质量、流动性、隔离与托管",
  ],
  ["Par and timely redemption", "按面值及时赎回"],
  ["Disclosure and assurance", "披露与审计 / 鉴证"],
  ["AML/CFT and operational resilience", "反洗钱 / 反恐融资与运营韧性"],
];
export const DIVERGENCE: Copy[] = [
  ["Legal classification", "法律分类"],
  ["Eligible issuer types", "可发行主体类型"],
  ["Treatment of foreign stablecoins", "境外稳定币待遇"],
  ["Systemic-supervision layer", "系统性监管层级"],
  ["Holder identity and distribution", "持有人身份与分发规则"],
  ["Interest and yield", "利息与收益处理"],
];
export const INTERNATIONAL = [
  {
    name: "FSB",
    copy: [
      "The 2023 recommendations remain a common reference. The 12 October 2026 report focuses on cross-border vulnerabilities and financial-stability monitoring.",
      "2023 年建议仍是共同参考；2026 年 10 月 12 日报告关注跨境脆弱性与金融稳定监测。",
    ] as Copy,
    sourceIds: ["INT-01", "INT-02"],
  },
  {
    name: "FATF",
    copy: [
      "The 3 March 2026 targeted report addresses illicit-finance risks involving stablecoins and unhosted-wallet P2P activity.",
      "2026 年 3 月 3 日专题报告关注稳定币及非托管钱包 P2P 活动的非法融资风险。",
    ] as Copy,
    sourceIds: ["INT-03"],
  },
  {
    name: "CPMI-IOSCO",
    copy: [
      "PFMI guidance applies to stablecoin arrangements that perform a transfer function and are determined to be systemically important.",
      "PFMI 指引适用于具有转移功能、且被认定具有系统重要性的稳定币安排。",
    ] as Copy,
    sourceIds: ["INT-04"],
  },
];
