import frozen from "./asia-development-v02.generated.json";

// V0.2 package only. Presentation translations do not add or infer facts.
export const ASIA = frozen;
export type AsiaKey =
  | "overview"
  | "mainland"
  | "hong-kong"
  | "singapore"
  | "uae";
export type Bilingual = readonly [en: string, zh: string];
export const ASIA_NAV: { key: AsiaKey; href: string; label: Bilingual }[] = [
  {
    key: "overview",
    href: "/regional-developments",
    label: ["Asia comparison", "亚洲比较总览"],
  },
  {
    key: "mainland",
    href: "/mainland-china",
    label: ["Mainland China", "中国内地"],
  },
  { key: "hong-kong", href: "/hong-kong", label: ["Hong Kong", "中国香港"] },
  { key: "singapore", href: "/singapore", label: ["Singapore", "新加坡"] },
  { key: "uae", href: "/uae", label: ["United Arab Emirates", "阿联酋"] },
];
export const HEADINGS: Record<AsiaKey, { title: Bilingual; lead: Bilingual }> =
  {
    overview: {
      title: [
        "Asia is not following one stablecoin route",
        "亚洲不是一条统一的稳定币路线",
      ],
      lead: [
        "Mainland China, Hong Kong, Singapore and the UAE are building digital-money and on-chain finance infrastructure through different regimes. Compare who may issue, who is licensed, which tokens have launched, who can use them and where funds can circulate.",
        "中国内地、香港、新加坡和阿联酋都在建设数字货币与链上金融基础设施，但对私人稳定币采取了完全不同的制度路径。真正需要比较的不是“谁更开放”，而是：谁允许发行、谁已经发牌、token 是否真的上线、谁能使用，以及资金在哪个监管边界内流通。",
      ],
    },
    mainland: {
      title: [
        "Mainland China follows a CBDC-led digital-money path rather than a private-stablecoin licensing model.",
        "中国内地的路径：私人虚拟货币高压管控 + e-CNY",
      ],
      lead: [
        "The 2026 notice clarifies boundaries for stablecoins, offshore issuance of RMB-referenced stablecoins, offshore virtual-currency issuance and RWA tokenisation. Meanwhile, e-CNY continues as central-bank legal digital money for cross-border retail use.",
        "2026 年最新通知把稳定币、境外人民币稳定币、境外虚拟货币发行与 RWA 代币化纳入更明确边界；与此同时，数字人民币继续作为央行法定数字货币推进跨境零售使用。",
      ],
    },
    "hong-kong": {
      title: [
        "Hong Kong: licensing and phased issuance",
        "香港已经从“写规则”进入“发牌 + 分阶段发行”",
      ],
      lead: [
        "The regime took effect in August 2025; HKMA issued the first two licences in April 2026. Anchorpoint (FRS01) and HSBC (FRS02) hold active stablecoin issuer licences. A licence alone does not tell users whether a token has launched, who is eligible or which channels are available.",
        "制度自 2025 年 8 月实施；2026 年 4 月 HKMA 发出首批两张牌照。但用户真正需要知道的是：牌照之后 token 是否发行、谁能获得、通过什么渠道使用。",
      ],
    },
    singapore: {
      title: [
        "Stablecoins are live, but the dedicated MAS-SCS regime has not yet completed legislative implementation.",
        "新加坡的稳定币市场已经在运行，但专门 MAS-SCS 发牌制度仍在完成立法落地",
      ],
      lead: [
        "MAS finalised its framework design in 2023 and consulted on PS Act amendments in September 2026 to implement it. XSGD and XUSD already operate under the existing PSA framework for Major Payment Institutions and DPT services.",
        "MAS 2023 年完成 framework 设计；2026 年 9 月就 PS Act 修法咨询以正式实施。与此同时，XSGD/XUSD 已在现有 PSA/DPT 监管体系运行。",
      ],
    },
    uae: {
      title: [
        "The UAE does not have a single stablecoin licensing regime.",
        "阿联酋不是一个 stablecoin licence box，而是多个监管边界并存",
      ],
      lead: [
        "AED payment tokens, Dubai virtual assets, ADGM fiat-referenced tokens and DIFC crypto-token activities fall under different authorities. Start with the jurisdiction and the activity.",
        "AED payment token、Dubai virtual asset、ADGM fiat-referenced token 与 DIFC crypto-token activity 并不由同一监管机构负责。理解阿联酋，第一步是先看 jurisdiction 和 activity。",
      ],
    },
  };

// Human-readable labels preserve each matrix field, including explicit UNKNOWNs.
const ZH: Record<string, string> = {
  GOVERNMENT_REPOST: "政府权威转载",
  REGULATOR: "监管机构",
  REGULATOR_REGISTER: "监管登记册",
  ISSUER_PRIMARY: "发行人第一方披露",
  DISTRIBUTOR_PRIMARY: "分销商第一方披露",
  PROVIDER_PRIMARY: "服务商第一方披露",
  "Mainland China": "中国内地",
  "Mainland/HK": "内地 / 香港",
  "Hong Kong": "中国香港",
  Singapore: "新加坡",
  "UAE onshore": "阿联酋境内（不含金融自由区）",
  "Dubai excl DIFC": "迪拜（不含 DIFC）",
  "PBOC + multi-agency": "中国人民银行及多部门",
  "Private virtual currency/stablecoin/RWA framework":
    "私人虚拟货币、稳定币与 RWA 监管边界",
  "Stablecoins Ordinance issuer licensing": "《稳定币条例》发行人发牌制度",
  "MAS-SCS design + PS Act implementation consultation":
    "MAS-SCS 框架设计与 PS Act 实施立法咨询",
  "Payment Token Services Regulation": "支付代币服务监管条例",
  "VA / FRVA regime": "虚拟资产 / 法币参考虚拟资产制度",
  "FRT regime": "法币参考代币（FRT）制度",
  "Crypto Token framework": "加密代币框架",
  PRIVATE_STABLECOIN_PROHIBITION: "私人稳定币禁止 / 严格限制",
  DEDICATED_ISSUER_REGIME_LIVE: "专门发行人制度已实施",
  IMPLEMENTATION_PENDING: "专门制度待立法实施",
  PAYMENT_TOKEN_REGIME_LIVE: "支付代币制度已生效",
  FRVA_REGIME_LIVE: "FRVA 制度已生效",
  FRT_REGIME_LIVE: "FRT 制度已生效",
  CRYPTO_TOKEN_REGIME_LIVE: "加密代币制度已生效",
  "No private issuer licensing pathway": "无私人发行人发牌路径",
  "No lawful private local stablecoin market": "无境内合法私人稳定币公众市场",
  "N/A": "不适用",
  "e-CNY is CBDC": "e-CNY 是央行数字货币（CBDC）",
  "2 licensed issuers": "两家持牌发行人",
  "HKDAP Beta live; RedCoin forthcoming": "HKDAP Beta 已开放；RedCoin 尚未发行",
  "HKDAP institutional/corporate beta": "HKDAP 仅限机构 / 企业 Beta",
  "Licence != availability": "持牌不等于产品可用",
  "Future MAS-SCS label pending implementation": "未来 MAS-SCS 标签待制度实施",
  "XSGD/XUSD live under PSA/DPT": "XSGD / XUSD 在 PSA / DPT 下运行",
  "Provider-dependent": "取决于服务商准入",
  "MPI/DPT != MAS-SCS issuer licence": "MPI / DPT 不等于 MAS-SCS 发行人牌照",
  "3 current Dirham issuer entities": "登记册列有三家迪拉姆发行实体",
  "AE Coin/AEDZ live; AEDC details unknown":
    "AE Coin / AEDZ 已上线；AEDC 产品详情 UNKNOWN",
  "Issuer/agent-dependent": "取决于发行人 / 代理渠道",
  "Financial Free Zones excluded": "不含金融自由区",
  "Category 1 approvals; AED FRVA excluded": "Category 1 批准；不含 AED FRVA",
  "Do not infer AED token from VARA": "不可由 VARA 批准推定 AED 代币可用",
  "Activity-dependent": "取决于具体业务",
  "AED FRVA -> CBUAE": "AED 参考代币归 CBUAE 管辖",
  "FRT issuance regulated": "FRT 发行属于受监管业务",
  "Multiple issuer permissions": "存在多家发行主体许可",
  "Some explicitly non-retail": "部分许可明确不面向零售",
  "Accepted FRT requirement": "另有 Accepted FRT 要求",
  "Firm authorization + suitability assessment": "机构授权与适当性评估",
  "Product-specific": "须逐产品判断",
  "Separate from VARA": "与 VARA 分属不同边界",
  "Private stablecoin": "私人稳定币",
  "USDC services": "USDC 相关服务",
  "AEDC token": "AEDC 代币",
  "Universal Digital FRT": "Universal Digital FRT",
  "JD Coinlink FRT": "JD Coinlink FRT",
  "—": "不适用 / 未提供",
  "MPI/DPT current framework": "现行 MPI / DPT 框架",
  "MPI/DPT service licence": "MPI / DPT 服务牌照",
  "CBUAE Dirham issuer": "CBUAE 迪拉姆支付代币发行人",
  "FSRA FRT issuance": "FSRA 的 FRT 发行许可",
  NOT_PERMITTED: "不获允许",
  LIVE_CROSS_BORDER_RETAIL_PILOT: "跨境零售试点运行中",
  BETA_LIVE: "Beta 已开放（非零售）",
  FORTHCOMING_NOT_ISSUED: "即将推出 / 尚未发行",
  LIVE: "产品已上线",
  SERVICE_LIVE: "服务已运行",
  PRODUCT_DETAILS_UNKNOWN: "产品详情 UNKNOWN",
  ISSUER_PERMISSION_VERIFIED: "发行主体许可已核实",
  PRODUCT_DETAILS_PARTIAL: "产品详情尚不完整",
  "HK wallet users": "香港钱包用户",
  "FPS top-up; merchants": "FPS 增值 / 商户支付",
  "Not stablecoin": "不是稳定币",
  "Institutional/corporate": "机构 / 企业用户",
  "Authorised distributors; Ethereum beta": "授权分销商 / Ethereum Beta",
  "Retail not yet": "尚未面向零售",
  "Not yet available": "尚不可用",
  "PayMe/HSBC App planned": "计划通过 PayMe / HSBC HK App",
  "Do not label live": "不可标注为已上线",
  "Provider onboarding": "须通过服务商准入",
  "Wallet/exchange/fintech": "钱包 / 交易所 / 金融科技渠道",
  "Wallet/exchange/DeFi": "钱包 / 交易所 / DeFi",
  "Not MAS-SCS-labelled token": "不是已获 MAS-SCS 标签的代币",
  "Circle services": "Circle 服务渠道",
  "MPI != MAS-SCS token label": "MPI 牌照不等于 MAS-SCS 代币标签",
  "Via appointed agents": "通过指定代理",
  "Agent distribution": "代理分发",
  "Issuer states B2B-only": "发行人披露其自身仅服务 B2B",
  "Public multi-chain": "公开多链",
  "Dynamic reserve data must be dated": "储备 / 流通量数字必须标注日期",
  "Licence verified only": "仅核实发行人牌照",
  "No retail clients": "不面向零售客户",
  "Do not infer broad public availability": "不能推定已向公众广泛开放",
  "More first-party product evidence needed": "仍需更多第一方产品证据",
  "Permission != product launch": "许可不等于产品上线",
  "No public private-stablecoin issuer market":
    "无面向公众的私人稳定币发行市场",
  LAW_REGIME: "法规 / 制度",
  LICENCE: "牌照",
  BETA_ROLLOUT: "Beta 开放",
  DISTRIBUTION: "渠道分发",
  CONSULTATION: "立法咨询",
  PRODUCT_STATUS: "产品状态",
};
const STATUS_EN: Record<string, string> = {
  GOVERNMENT_REPOST: "Authoritative government repost",
  REGULATOR: "Regulator",
  REGULATOR_REGISTER: "Regulatory register",
  ISSUER_PRIMARY: "Issuer disclosure",
  DISTRIBUTOR_PRIMARY: "Distributor disclosure",
  PROVIDER_PRIMARY: "Provider disclosure",
  PRIVATE_STABLECOIN_PROHIBITION:
    "Private stablecoin issuance/business: prohibited or strictly restricted",
  DEDICATED_ISSUER_REGIME_LIVE: "Dedicated issuer regime in effect",
  IMPLEMENTATION_PENDING: "Implementation pending",
  PAYMENT_TOKEN_REGIME_LIVE: "Payment-token regime in effect",
  FRVA_REGIME_LIVE: "FRVA regime in effect",
  FRT_REGIME_LIVE: "FRT regime in effect",
  CRYPTO_TOKEN_REGIME_LIVE: "Crypto-token regime in effect",
  NOT_PERMITTED: "Not permitted",
  LIVE_CROSS_BORDER_RETAIL_PILOT: "Cross-border retail pilot live",
  BETA_LIVE: "Beta live",
  FORTHCOMING_NOT_ISSUED: "Forthcoming · not issued",
  LIVE: "Product live",
  SERVICE_LIVE: "Services live",
  PRODUCT_DETAILS_UNKNOWN: "Product details UNKNOWN",
  ISSUER_PERMISSION_VERIFIED: "Issuer permission verified",
  PRODUCT_DETAILS_PARTIAL: "Product details partial",
  LAW_REGIME: "Law / regime",
  LICENCE: "Licence",
  BETA_ROLLOUT: "Beta rollout",
  DISTRIBUTION: "Distribution",
  CONSULTATION: "Consultation",
  PRODUCT_STATUS: "Product status",
  "—": "Not applicable / not provided",
  "HKDAP institutional/corporate beta":
    "HKDAP: Beta Access for institutional and corporate users",
  "Institutional/corporate": "Institutional and corporate users",
  "MPI/DPT current framework":
    "Existing PSA framework for Major Payment Institutions and DPT services",
  "XSGD/XUSD live under PSA/DPT":
    "XSGD/XUSD live under the existing PSA framework for Major Payment Institutions and DPT services",
  "Firm authorization + suitability assessment":
    "Firm authorisation + suitability assessment",
};
export const words = (value: string): Bilingual => [
  STATUS_EN[value] ?? value,
  ZH[value] ?? value,
];
export const sourceIds = (ids: string) => ids.split(";").filter(Boolean);
export const sourcesFor = (prefix: string) =>
  ASIA.sources.filter((s) => s.source_id.startsWith(prefix));
export const productsFor = (key: AsiaKey) =>
  ASIA.products.filter(
    (p) =>
      key === "overview" ||
      (key === "mainland"
        ? p.jurisdiction.startsWith("Mainland")
        : key === "hong-kong"
          ? p.jurisdiction === "Hong Kong"
          : key === "singapore"
            ? p.jurisdiction === "Singapore"
            : ["UAE onshore", "ADGM"].includes(p.jurisdiction)),
  );
export const PATHS: {
  title: Bilingual;
  detail: Bilingual;
  sources: string[];
}[] = [
  {
    title: ["Restrictions + e-CNY", "严格限制 + e-CNY"],
    detail: [
      "Private stablecoin issuance/business: prohibited or strictly restricted. The digital-money route centres on e-CNY.",
      "私人稳定币：禁止 / 严格限制；数字货币主线：e-CNY。",
    ],
    sources: ["SRC-CN-01", "SRC-CN-02"],
  },
  {
    title: ["Licensing + phased issuance", "发牌 + 分阶段发行"],
    detail: [
      "A dedicated issuer regime is in effect. HKDAP offers Beta Access for institutional and corporate users; HSBC RedCoin is named but not issued.",
      "专门发牌制度已实施。HKDAP 已进入机构 / 企业 Beta Access；HSBC RedCoin 已命名但尚未发行。",
    ],
    sources: ["SRC-HK-01", "SRC-HK-04", "SRC-HK-08"],
  },
  {
    title: ["Existing market + future MAS-SCS", "既有市场 + 未来 MAS-SCS"],
    detail: [
      "The framework design is mature; implementation is under legislative consultation. XSGD/XUSD operate under the existing PSA framework for Major Payment Institutions and DPT services, not a fully implemented MAS-SCS regime.",
      "框架设计成熟，专门制度实施仍在立法咨询。XSGD / XUSD 已在现有 PSA / DPT 体系下运行，不等于 MAS-SCS 发行人框架已全面生效。",
    ],
    sources: ["SRC-SG-01", "SRC-SG-02", "SRC-SG-05", "SRC-SG-06"],
  },
  {
    title: ["Live products + four perimeters", "产品活跃 + 四个监管边界"],
    detail: [
      "CBUAE regulates onshore Payment Token Services outside the Financial Free Zones. VARA, ADGM/FSRA and DIFC/DFSA have distinct scopes. AE Coin and Zand AED are verifiable AED products.",
      "CBUAE 境内体系、VARA、ADGM / FSRA、DIFC / DFSA 各有边界。AE Coin 与 Zand AED 已有可核实的 AED 稳定币产品。",
    ],
    sources: [
      "SRC-UAE-01",
      "SRC-UAE-05",
      "SRC-UAE-07",
      "SRC-UAE-09",
      "SRC-UAE-11",
      "SRC-UAE-16",
    ],
  },
];
export const MISCONCEPTIONS: Bilingual[] = [
  [
    "Restrictions on private stablecoins do not mean no digital-money development: e-CNY follows a different institutional route.",
    "中国限制私人稳定币，不等于没有数字货币发展：e-CNY 是不同的制度路线。",
  ],
  [
    "Hong Kong's two issuer licences do not mean both tokens are already available to the public.",
    "香港发出两张发行人牌照，不等于两个 token 都已面向公众。",
  ],
  [
    "A StraitsX or Circle MAS licence does not make its token MAS-SCS-labelled.",
    "StraitsX / Circle 持有 MAS 牌照，不等于相关 token 已获 MAS-SCS 标签。",
  ],
  [
    "UAE stablecoins are not all supervised by VARA; the jurisdiction and activity determine the applicable perimeter.",
    "阿联酋稳定币不是全部由 VARA 监管：须先看辖区与业务。",
  ],
];
export const UNKNOWN_ITEMS: { key: AsiaKey; copy: Bilingual; ids: string[] }[] =
  [
    {
      key: "hong-kong",
      copy: [
        "HKDAP's actual Full Launch date and RedCoin's actual issuance date remain UNKNOWN.",
        "HKDAP 实际 Full Launch 日期、RedCoin 实际发行日期仍为 UNKNOWN。",
      ],
      ids: ["SRC-HK-06", "SRC-HK-08"],
    },
    {
      key: "singapore",
      copy: [
        "The final MAS-SCS legislative implementation date remains UNKNOWN. A consultation closing date is not an effective date.",
        "MAS-SCS 最终立法实施日期仍为 UNKNOWN。咨询截止日不等于制度生效日。",
      ],
      ids: ["SRC-SG-02", "SRC-SG-03"],
    },
    {
      key: "uae",
      copy: [
        "AEDC: token identity, launch, access and chain remain UNKNOWN; the register verifies the issuer only.",
        "AEDC：具体 token、上线、准入与链信息仍为 UNKNOWN；登记册仅核实发行主体。",
      ],
      ids: ["SRC-UAE-02"],
    },
    {
      key: "uae",
      copy: [
        "Universal Digital: product details and reference currency remain incomplete / UNKNOWN. JD Coinlink: token launch and reference currency remain UNKNOWN.",
        "Universal Digital：产品详情尚不完整，参考货币仍为 UNKNOWN。JD Coinlink：具体 token 上线与参考货币仍为 UNKNOWN。",
      ],
      ids: ["SRC-UAE-14", "SRC-UAE-15"],
    },
  ];
