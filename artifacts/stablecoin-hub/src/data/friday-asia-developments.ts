export type LocalizedText = { en: string; zh: string };

export type RegionId = "mainland-china" | "hong-kong" | "singapore" | "uae";
export type DevelopmentStatus = "official" | "operating" | "preparing" | "related" | "watch";

export type OfficialSource = {
  label: LocalizedText;
  authority: string;
  date: string;
  url: string;
};

export type Milestone = {
  date: string;
  status: DevelopmentStatus;
  title: LocalizedText;
  summary: LocalizedText;
  source: OfficialSource;
};

export type DevelopmentItem = {
  status: DevelopmentStatus;
  title: LocalizedText;
  summary: LocalizedText;
  actors?: LocalizedText;
  source?: OfficialSource;
  website?: { label: LocalizedText; url: string };
  evidence?: { label: LocalizedText; value: LocalizedText; note: LocalizedText };
};

export type AsiaRegion = {
  id: RegionId;
  nav: LocalizedText;
  title: LocalizedText;
  kicker: LocalizedText;
  thesis: LocalizedText;
  verifiedAt: string;
  evidenceCutoff: string;
  accent: string;
  facts: Array<{ label: LocalizedText; value: LocalizedText; note: LocalizedText }>;
  boundary: LocalizedText;
  regulatoryUrl: string;
  milestones: Milestone[];
  applications: DevelopmentItem[];
  participants: DevelopmentItem[];
  institutionalMap?: DevelopmentItem[];
  watchpoints?: DevelopmentItem[];
  outlook: DevelopmentItem[];
  sources: OfficialSource[];
};

const source = (
  authority: string,
  date: string,
  en: string,
  zh: string,
  url: string,
): OfficialSource => ({ authority, date, label: { en, zh }, url });

const PBOC_NOTICE = source(
  "People's Bank of China and nine authorities",
  "2021-09-24",
  "Notice on Further Preventing and Disposing of Risks in Virtual Currency Trading and Speculation",
  "《关于进一步防范和处置虚拟货币交易炒作风险的通知》",
  "https://www.pbc.gov.cn/tiaofasi/144941/3581332/4348658/index.html",
);

const PBOC_2025 = source(
  "People's Bank of China",
  "2025-11-28",
  "Joint meeting convened to curb speculation in virtual-currency trading",
  "打击虚拟货币交易炒作工作协调机制会议",
  "https://www.pbc.gov.cn/en/3688110/3688172/5552468/2025121116132332435/index.html",
);

const ECNY_WHITEPAPER = source(
  "People's Bank of China",
  "2021-07",
  "Progress of Research & Development of E-CNY in China",
  "《中国数字人民币的研发进展白皮书》",
  "https://www.pbc.gov.cn/en/3688110/3688172/4157443/4293696/2021072014364791207.pdf",
);

const HKMA_DISCUSSION = source(
  "Hong Kong Monetary Authority",
  "2022-01-12",
  "Discussion paper on crypto-assets and stablecoins",
  "加密资产与稳定币讨论文件",
  "https://www.hkma.gov.hk/eng/news-and-media/press-releases/2022/01/20220112-3/",
);

const HKMA_SANDBOX = source(
  "Hong Kong Monetary Authority",
  "2024-03",
  "Sandbox Arrangement for Stablecoin Issuers",
  "稳定币发行人沙盒安排",
  "https://www.hkma.gov.hk/media/eng/doc/key-functions/ifc/stablecoin-issuers/Proposed-Sandbox-Arrangement_Stablecoin-Issuer.pdf",
);

const HKMA_REGIME = source(
  "Hong Kong Monetary Authority",
  "2025-07-29",
  "Implementation of the regulatory regime for stablecoin issuers",
  "实施稳定币发行人监管制度",
  "https://www.info.gov.hk/gia/general/202507/29/P2025072900703.htm",
);

const HK_POLICY_20 = source(
  "Financial Services and the Treasury Bureau",
  "2025-06-26",
  "Policy Statement 2.0 on the Development of Digital Assets in Hong Kong",
  "《香港数字资产发展政策宣言 2.0》",
  "https://gia.info.gov.hk/general/202506/26/P2025062600269_500089_1_1750909574183.pdf",
);

const HK_ENSEMBLE = source(
  "Hong Kong Monetary Authority",
  "2026",
  "Priorities for 2026 and Beyond",
  "《2026 年及以后的工作重点》",
  "https://www.hkma.gov.hk/media/eng/publication-and-research/annual-report/2025/07_Priorities_for_2026_and_Beyond.pdf",
);

const HK_LICENCES = source(
  "Hong Kong Monetary Authority",
  "2026-04-10",
  "Granting of stablecoin issuer licences",
  "批出稳定币发行人牌照",
  "https://www.info.gov.hk/gia/general/202604/10/P2026041000471.htm",
);

const HK_PRODUCT_WARNING = source(
  "Hong Kong Monetary Authority",
  "2026-04-28",
  "Beware of tokens purported to be associated with licensed stablecoin issuers",
  "慎防声称与持牌稳定币发行人有关的代币",
  "https://www.info.gov.hk/gia/general/202604/28/P2026042800531.htm",
);

const HK_PROGRESS = source(
  "Hong Kong SAR Government / HKMA",
  "2026-06-10",
  "Development and regulation of stablecoins",
  "稳定币的发展与监管",
  "https://www.info.gov.hk/gia/general/202606/10/P2026061000429.htm",
);

const ANCHORPOINT_STATUS = source(
  "Anchorpoint Financial Limited",
  "2026-08-12",
  "HKDAP whitepaper and phased-access status",
  "HKDAP 白皮书与分阶段开放状态",
  "https://anchorpoint.hk/hkdap-whitepaper/",
);

const HSBC_HKD_PLAN = source(
  "HSBC Hong Kong",
  "2026-04-10",
  "HSBC welcomes HKMA's grant of a Hong Kong stablecoin issuer licence",
  "汇丰获香港稳定币发行人牌照及港元稳定币计划",
  "https://www.about.hsbc.com.hk/-/media/hong-kong/en/news-and-media/260410-hsbc-welcomes-hkmas-grant-of-a-hong-kong-stablecoin-issuer-licence-en.pdf",
);

const MAS_FRAMEWORK = source(
  "Monetary Authority of Singapore",
  "2023-08-15",
  "MAS Finalises Stablecoin Regulatory Framework",
  "新加坡金管局完成稳定币监管框架",
  "https://www.sgpc.gov.sg/api/file/getfile/Media%20Release_MAS%20Finalises%20Stablecoin%20Regulatory%20Framework.pdf?path=%2Fsgpcmedia%2Fmedia_releases%2Fmas%2Fpress_release%2FP-20230815-2%2Fattachment%2FMedia+Release_MAS+Finalises+Stablecoin+Regulatory+Framework.pdf",
);

const MAS_CONSULTATION = source(
  "Monetary Authority of Singapore",
  "2022-10-26",
  "Consultation on the regulatory approach for stablecoin-related activities",
  "稳定币相关活动监管方法咨询文件",
  "https://www.mas.gov.sg/publications/consultations/2022/consultation-paper-on-proposed-regulatory-approach-for-stablecoin-related-activities",
);

const MAS_GUARDIAN = source(
  "Monetary Authority of Singapore",
  "2024-11-04",
  "Plans to Support Commercialisation of Asset Tokenisation",
  "支持资产代币化商业化的计划",
  "https://www.sgpc.gov.sg/api/file/getfile/MAS%20Media%20Release_MAS%20Announces%20Plans%20to%20Support%20Commercialisation%20of%20Asset%20Tokenisation.pdf?path=%2Fsgpcmedia%2Fmedia_releases%2Fmas%2Fpress_release%2FP-20241104-2%2Fattachment%2FMAS+Media+Release_MAS+Announces+Plans+to+Support+Commercialisation+of+Asset+Tokenisation.pdf",
);

const MAS_DIRECTORY = source(
  "Monetary Authority of Singapore",
  "2026-08",
  "Financial Institutions Directory: Digital Payment Token Service",
  "金融机构名录：数字支付代币服务",
  "https://eservices.mas.gov.sg/fid/institution?activity=Digital+Payment+Token+Service&sector=Payments",
);

const STRAITSX_PRODUCTS = source(
  "StraitsX",
  "accessed 2026-09-12",
  "XSGD product, supported networks and redemption",
  "XSGD 产品、支持网络与赎回安排",
  "https://www.straitsx.com/xsgd",
);

const STRAITSX_2025 = source(
  "StraitsX",
  "2025-12",
  "StraitsX 2025 Wrapped",
  "StraitsX 2025 年度回顾",
  "https://www.straitsx.com/blog-post/straitsx-2025-wrapped",
);

const PAXOS_USDG = source(
  "Paxos",
  "2024-11-01",
  "Paxos introduces Global Dollar (USDG)",
  "Paxos 推出 Global Dollar（USDG）",
  "https://www.paxos.com/newsroom/paxos-introduces-global-dollar-usdg",
);

const CBUAE_RULE = source(
  "Central Bank of the UAE",
  "2024-08-31",
  "Payment Token Services Regulation",
  "《支付代币服务监管规则》",
  "https://rulebook.centralbank.ae/en/rulebook/payment-token-services-regulation",
);

const VARA_RULE = source(
  "Dubai Virtual Assets Regulatory Authority",
  "2025-06-19",
  "Fiat-Referenced Virtual Assets Issuance Rules",
  "法币参考虚拟资产发行规则",
  "https://rulebooks.vara.ae/rulebook/annex-1-fiat-referenced-virtual-assets-issuance-rules",
);

const CBUAE_REPORT = source(
  "Central Bank of the UAE",
  "2026",
  "CBUAE Annual Report 2025",
  "阿联酋中央银行 2025 年年度报告",
  "https://centralbank.ae/en/news-and-publications/publications/cbuae-annual-reports/central-bank-annual-report-2025/",
);

const CBUAE_REGISTER = source(
  "Central Bank of the UAE",
  "updated 2026-09-10",
  "CBUAE live licensing register: Payment Token Services",
  "阿联酋中央银行实时许可名录：支付代币服务",
  "https://centralbank.ae/en/licensing",
);

const AECOIN_WALLET = source(
  "Al Maryah Community Bank",
  "accessed 2026-09-12",
  "AEC Wallet functions and merchant payments",
  "AEC Wallet 功能与商户支付",
  "https://www.mbank.ae/aec-wallet/faqs/",
);

const AECOIN_MERCHANTS = source(
  "Al Maryah Community Bank",
  "accessed 2026-09-12",
  "AEC Wallet merchant directory",
  "AEC Wallet 商户名录",
  "https://www.mbank.ae/aec-wallet/aec-wallet-merchants/",
);

const ZAND_AED = source(
  "Zand",
  "2025-11-17",
  "Zand launches Zand AED on public blockchains",
  "Zand 在公共区块链推出 Zand AED",
  "https://www.zand.ae/en/news/zand-launches-uaes-first-aed-backed-stablecoin-on-public-blockchain",
);

export const REGION_ORDER: RegionId[] = ["mainland-china", "hong-kong", "singapore", "uae"];

export const ASIA_DEVELOPMENTS: Record<RegionId, AsiaRegion> = {
  "mainland-china": {
    id: "mainland-china",
    nav: { en: "Mainland China", zh: "中国内地" },
    title: { en: "Stablecoin Developments in Mainland China", zh: "中国内地稳定币发展" },
    kicker: { en: "Asia · Policy perimeter", zh: "亚洲 · 政策边界" },
    thesis: {
      en: "Mainland China has not opened a domestic licensing route for privately issued stablecoins. Its policy path centres on restricting virtual-currency activity while developing e-CNY as central-bank money.",
      zh: "中国内地尚未为私人发行稳定币建立境内许可路径。当前政策一方面限制虚拟货币相关活动，另一方面将数字人民币作为央行货币推进。",
    },
    verifiedAt: "2026-09-11",
    evidenceCutoff: "2025-11-28",
    accent: "#9b3d4a",
    facts: [
      { label: { en: "Policy position", zh: "政策定位" }, value: { en: "Restrictive perimeter", zh: "限制性边界" }, note: { en: "Private stablecoins are treated within the virtual-currency policy perimeter.", zh: "私人稳定币被纳入虚拟货币政策边界。" } },
      { label: { en: "Domestic issuer route", zh: "境内发行许可" }, value: { en: "No public route", zh: "暂无公开路径" }, note: { en: "No public licensing framework for private stablecoin issuance is in place.", zh: "目前没有面向私人稳定币发行的公开发牌框架。" } },
      { label: { en: "Adjacent public money", zh: "相关公共货币" }, value: { en: "e-CNY", zh: "数字人民币" }, note: { en: "A CBDC and a direct central-bank liability—not a private stablecoin.", zh: "属于央行数字货币及央行负债，并非私人稳定币。" } },
    ],
    boundary: {
      en: "This page describes the domestic policy boundary and adjacent digital-money infrastructure. It does not present mainland China as an authorised private-stablecoin market.",
      zh: "本页说明境内政策边界及相关数字货币基础设施，不将中国内地描述为获准经营私人稳定币的市场。",
    },
    regulatoryUrl: "/regulatory",
    milestones: [
      { date: "2021-07", status: "related", title: { en: "PBOC publishes the e-CNY R&D white paper", zh: "人民银行发布数字人民币研发白皮书" }, summary: { en: "The paper defines e-CNY as central-bank digital money and sets out its design and pilot approach. It is included here to clarify the boundary with private stablecoins.", zh: "白皮书界定数字人民币的央行货币属性，并说明设计和试点路径。本页将其作为与私人稳定币相邻但不同的基础设施介绍。" }, source: ECNY_WHITEPAPER },
      { date: "2021-09", status: "official", title: { en: "Authorities define the restrictive virtual-currency perimeter", zh: "多部门明确虚拟货币限制性政策边界" }, summary: { en: "The notice states that virtual currencies, including Tether-like stablecoins, do not have legal-tender status and that related business activities fall within the prohibited perimeter.", zh: "通知明确，包括泰达币等所谓稳定币在内的虚拟货币不具有法偿性，相关业务活动属于被禁止的范围。" }, source: PBOC_NOTICE },
      { date: "2025-11", status: "official", title: { en: "The multi-agency mechanism reaffirms the policy stance", zh: "多部门协调机制重申政策立场" }, summary: { en: "A joint meeting reiterated that stablecoins are a form of virtual currency and highlighted identity, AML and illicit cross-border transfer concerns.", zh: "协调机制会议再次将稳定币界定为虚拟货币的一种形式，并强调客户身份识别、反洗钱和违规跨境转移资金风险。" }, source: PBOC_2025 },
    ],
    applications: [
      { status: "official", title: { en: "No licensed retail stablecoin market", zh: "没有获准的公众稳定币市场" }, summary: { en: "The current policy perimeter does not provide a domestic route for issuing or operating private stablecoins for mainland residents.", zh: "现有政策没有为面向境内居民发行或经营私人稳定币提供境内许可路径。" }, actors: { en: "Financial and enforcement authorities", zh: "金融管理及执法部门" }, evidence: { label: { en: "Domestic issuer route", zh: "境内发行路径" }, value: { en: "None published", zh: "未公布" }, note: { en: "Policy fact, not a zero-adoption estimate", zh: "属于政策事实，不是采用规模估算" } }, source: PBOC_NOTICE },
      { status: "related", title: { en: "e-CNY payment pilots", zh: "数字人民币支付试点" }, summary: { en: "e-CNY supports digital payment experimentation, but its issuer, liability structure and policy role differ from private stablecoins.", zh: "数字人民币承载数字支付试点，但其发行主体、负债属性和政策功能均不同于私人稳定币。" }, actors: { en: "PBOC and participating institutions", zh: "人民银行及参研机构" }, source: ECNY_WHITEPAPER },
      { status: "watch", title: { en: "Cross-border exposure remains a policy question", zh: "跨境影响仍是政策观察重点" }, summary: { en: "Offshore services, payment channels and cross-border fund transfers remain important enforcement and research boundaries.", zh: "境外服务、支付渠道和跨境资金转移仍是执法与研究中的重要边界。" }, source: PBOC_2025 },
    ],
    participants: [
      { status: "official", title: { en: "People's Bank of China", zh: "中国人民银行" }, summary: { en: "Central bank, payment-system authority and lead coordinator on virtual-currency risk controls.", zh: "承担中央银行和支付体系管理职责，并牵头虚拟货币风险治理协调。" }, website: { label: { en: "PBOC official website", zh: "人民银行官网" }, url: "https://www.pbc.gov.cn/" }, source: PBOC_2025 },
      { status: "official", title: { en: "Multi-agency coordination mechanism", zh: "多部门协调机制" }, summary: { en: "Coordinates financial, internet, market, judicial and enforcement responses.", zh: "协调金融、网信、市场监管、司法与执法部门的相关工作。" }, source: PBOC_2025 },
      { status: "related", title: { en: "E-CNY R&D working group", zh: "数字人民币研发工作组" }, summary: { en: "Develops the adjacent central-bank digital-currency track.", zh: "负责推进与私人稳定币相区别的央行数字货币路径。" }, website: { label: { en: "PBOC e-CNY materials", zh: "人民银行数字人民币资料" }, url: "https://www.pbc.gov.cn/en/3688110/3688172/" }, source: ECNY_WHITEPAPER },
    ],
    watchpoints: [
      { status: "watch", title: { en: "Do not mix e-CNY with private stablecoins", zh: "不把数字人民币与私人稳定币混合统计" }, summary: { en: "e-CNY data can describe adjacent digital-money infrastructure, but it must not be added to stablecoin supply or adoption totals.", zh: "数字人民币数据可以说明相邻的数字货币基础设施，但不能并入稳定币供应量或采用规模。" }, source: ECNY_WHITEPAPER },
      { status: "watch", title: { en: "Separate offshore exposure from domestic permission", zh: "区分离岸接触与境内许可" }, summary: { en: "Observed offshore holding or use does not create a mainland issuer or service-provider licence route.", zh: "观察到的离岸持有或使用，并不意味着内地存在发行人或服务商许可路径。" }, source: PBOC_NOTICE },
      { status: "watch", title: { en: "Track enforcement and cross-border channels", zh: "跟踪执法与跨境渠道" }, summary: { en: "Future updates should identify the policy date, responsible authority and affected activity rather than infer a market-opening signal.", zh: "后续更新应标明政策日期、责任部门与受影响活动，不能推断为市场开放信号。" }, source: PBOC_2025 },
    ],
    outlook: [
      { status: "official", title: { en: "Continued enforcement", zh: "持续执行限制性政策" }, summary: { en: "The 2025 coordination meeting called for continued action against illegal virtual-currency-related financial activity.", zh: "2025 年协调机制会议要求继续打击虚拟货币相关非法金融活动。" }, source: PBOC_2025 },
      { status: "related", title: { en: "Further e-CNY development", zh: "继续推进数字人民币" }, summary: { en: "Digital public money remains the principal domestic digital-currency development track.", zh: "数字化公共货币仍是境内数字货币发展的主要路径。" }, source: ECNY_WHITEPAPER },
      { status: "watch", title: { en: "Observe links with Hong Kong", zh: "观察与香港市场的联系" }, summary: { en: "Any cross-border connection with Hong Kong's licensed market must be assessed against mainland payment, foreign-exchange and virtual-currency rules.", zh: "香港持牌市场与内地发生跨境联系时，仍需结合境内支付、外汇和虚拟货币政策判断。" } },
    ],
    sources: [PBOC_NOTICE, PBOC_2025, ECNY_WHITEPAPER],
  },

  "hong-kong": {
    id: "hong-kong",
    nav: { en: "Hong Kong", zh: "中国香港" },
    title: { en: "Stablecoin Developments in Hong Kong", zh: "中国香港稳定币发展" },
    kicker: { en: "Asia · Priority market", zh: "亚洲 · 重点市场" },
    thesis: {
      en: "Hong Kong has moved from consultation and sandbox testing to an issuer-licensing regime. The next question is not whether a framework exists, but how licensed products, payment uses and tokenised-market infrastructure move into operation.",
      zh: "香港已经从咨询与沙盒测试进入发行人持牌阶段。接下来的关键不再是“有没有制度”，而是持牌产品、支付应用与代币化市场基础设施如何真正投入运行。",
    },
    verifiedAt: "2026-09-11",
    evidenceCutoff: "2026-08-12",
    accent: "#c45f4d",
    facts: [
      { label: { en: "Issuer regime", zh: "发行人制度" }, value: { en: "In force", zh: "已经生效" }, note: { en: "The Stablecoins Ordinance took effect on 1 August 2025.", zh: "《稳定币条例》于 2025 年 8 月 1 日生效。" } },
      { label: { en: "Licensed issuers", zh: "持牌发行人" }, value: { en: "2", zh: "2 家" }, note: { en: "Anchorpoint Financial and HSBC received licences on 10 April 2026.", zh: "碇点金融科技与香港上海汇丰银行于 2026 年 4 月 10 日获牌。" } },
      { label: { en: "Initial applications", zh: "首阶段申请" }, value: { en: "36", zh: "36 份" }, note: { en: "Reported by the Government in June 2026; further licensing remains selective.", zh: "香港政府于 2026 年 6 月披露；后续发牌仍将保持严格筛选。" } },
      { label: { en: "Product evidence", zh: "产品状态证据" }, value: { en: "HKDAP beta access", zh: "HKDAP 测试开放" }, note: { en: "Limited to corporates and professional investors; full public launch is not yet evidenced.", zh: "仅面向企业及专业投资者；尚无全面公众上线证据。" } },
    ],
    boundary: {
      en: "The regime covers in-scope fiat-referenced stablecoin issuance. This page separates the law, issuer licences, pre-launch preparation and actual token issuance.",
      zh: "相关制度覆盖范围内的法币参考稳定币发行。本页将法律生效、取得牌照、发行前准备和代币实际发行分别展示。",
    },
    regulatoryUrl: "/regulatory",
    milestones: [
      { date: "2022-01", status: "official", title: { en: "HKMA opens a dedicated stablecoin policy process", zh: "香港金管局启动稳定币专项政策进程" }, summary: { en: "A discussion paper considered the appropriate regulatory approach for payment-related stablecoins.", zh: "讨论文件开始研究支付相关稳定币的适当监管方法。" }, source: HKMA_DISCUSSION },
      { date: "2024-03", status: "preparing", title: { en: "Stablecoin issuer sandbox begins", zh: "稳定币发行人沙盒启动" }, summary: { en: "The sandbox enabled dialogue and testing around business models and expected controls; participation did not amount to regulatory endorsement or a future licence.", zh: "沙盒用于沟通业务模式和监管预期；参与沙盒并不等于监管认可，也不代表将来必然获牌。" }, source: HKMA_SANDBOX },
      { date: "2025-08", status: "official", title: { en: "The issuer-licensing regime takes effect", zh: "发行人发牌制度正式生效" }, summary: { en: "The Ordinance, supervisory guideline and dedicated AML/CFT guideline created the operating legal framework.", zh: "《条例》、监管指引及专门反洗钱指引共同形成可执行的法律框架。" }, source: HKMA_REGIME },
      { date: "2025-11", status: "related", title: { en: "EnsembleTX moves tokenisation into a controlled pilot", zh: "EnsembleTX 进入真实价值交易试点" }, summary: { en: "The pilot supports real-value transactions involving tokenised deposits and digital assets. It is related settlement infrastructure, not itself a stablecoin issuance programme.", zh: "试点支持代币化存款与数字资产的真实价值交易；它属于相关交收基础设施，并非稳定币发行计划本身。" }, source: HK_ENSEMBLE },
      { date: "2026-04", status: "official", title: { en: "HKMA grants the first two issuer licences", zh: "香港金管局批出首批两张发行人牌照" }, summary: { en: "Anchorpoint Financial Limited and The Hongkong and Shanghai Banking Corporation Limited became the first licensed issuers.", zh: "碇点金融科技有限公司与香港上海汇丰银行有限公司成为首批持牌发行人。" }, source: HK_LICENCES },
      { date: "2026-06", status: "preparing", title: { en: "Government describes the pre-launch work and selective next phase", zh: "政府说明发行前准备和审慎的后续发牌安排" }, summary: { en: "Official replies cited platform testing, reserves, redemption, risk controls and staffing as pre-launch requirements, while future licences would depend on viable uses and sustainable business models.", zh: "官方答复将平台测试、储备、赎回、风险管理与人力安排列为发行前条件；后续发牌还将考察实际用途和可持续业务模式。" }, source: HK_PROGRESS },
      { date: "2026-08", status: "operating", title: { en: "HKDAP enters limited beta access", zh: "HKDAP 进入有限测试开放阶段" }, summary: { en: "Anchorpoint's primary materials describe beta access for corporates and professional investors. This is a narrower operational stage than full public or retail launch.", zh: "Anchorpoint 原始资料披露 HKDAP 已面向企业和专业投资者开放测试；这一运行阶段仍小于全面公众或零售上线。" }, source: ANCHORPOINT_STATUS },
    ],
    applications: [
      { status: "operating", title: { en: "Phased regulated issuance", zh: "受监管稳定币分阶段上线" }, summary: { en: "Anchorpoint reports HKDAP beta access for corporates and professional investors. Retail/full launch remains a later target; HSBC product operation must still be verified separately.", zh: "Anchorpoint 已披露 HKDAP 面向企业及专业投资者的测试开放；零售及全面上线仍属后续目标，汇丰产品的运行状态也须另行核验。" }, actors: { en: "Anchorpoint Financial; HSBC", zh: "碇点金融科技；香港上海汇丰银行" }, evidence: { label: { en: "Observed stage", zh: "已观察阶段" }, value: { en: "1 beta-access product", zh: "1 个测试开放产品" }, note: { en: "HKDAP only; not a count of all licensed products", zh: "仅指 HKDAP；不是所有持牌产品数量" } }, source: ANCHORPOINT_STATUS },
      { status: "preparing", title: { en: "HSBC retail and merchant distribution plan", zh: "汇丰零售与商户分发计划" }, summary: { en: "HSBC plans an HKD stablecoin in the second half of 2026, with initial integration into PayMe and the HSBC HK app. This is a dated issuer plan, not evidence that the token is already in circulation.", zh: "汇丰计划于 2026 年下半年推出港元稳定币，并在首阶段接入 PayMe 与汇丰香港流动理财应用；这是有日期的发行方计划，不代表代币已经流通。" }, actors: { en: "HSBC, PayMe, retail customers and merchants", zh: "汇丰、PayMe、零售客户与商户" }, evidence: { label: { en: "Planned channels", zh: "计划渠道" }, value: { en: "2 named apps", zh: "2 个具名应用" }, note: { en: "PayMe and HSBC HK App; no usage volume yet", zh: "PayMe 与汇丰香港应用；尚无使用量数据" } }, source: HSBC_HKD_PLAN },
      { status: "preparing", title: { en: "Stablecoin payment use cases", zh: "稳定币支付应用" }, summary: { en: "Policy Statement 2.0 supports exploration of stablecoin payment uses; it describes a development direction rather than a completed retail network.", zh: "《政策宣言 2.0》支持探索稳定币支付应用；这属于发展方向，并非已经建成的零售支付网络。" }, actors: { en: "Government, regulators and industry", zh: "政府、监管机构与市场参与者" }, source: HK_POLICY_20 },
      { status: "operating", title: { en: "Tokenised-asset settlement pilot", zh: "代币化资产交收试点" }, summary: { en: "EnsembleTX supports controlled real-value transactions using tokenised deposits and digital assets, with regulated stablecoins named as a possible future form of digital money in the wider ecosystem.", zh: "EnsembleTX 在受控环境中支持代币化存款与数字资产的真实价值交易；在更广泛生态中，受监管稳定币被列为未来可能采用的数字货币形式之一。" }, actors: { en: "HKMA, participating banks and market institutions", zh: "香港金管局、参与银行与市场机构" }, source: HK_ENSEMBLE },
    ],
    participants: [
      { status: "official", title: { en: "Hong Kong Monetary Authority", zh: "香港金融管理局" }, summary: { en: "Licensing and frontline supervision of fiat-referenced stablecoin issuers; operator of Project Ensemble.", zh: "负责法币参考稳定币发行人发牌及一线监管，并推动 Project Ensemble。" }, website: { label: { en: "HKMA stablecoin portal", zh: "香港金管局稳定币专题" }, url: "https://www.hkma.gov.hk/eng/key-functions/international-financial-centre/stablecoin-issuers/" }, source: HKMA_REGIME },
      { status: "operating", title: { en: "Anchorpoint Financial Limited", zh: "碇点金融科技有限公司" }, summary: { en: "Licensed issuer of HKDAP. Its official materials report a limited beta-access stage, with wider launch targeted later and subject to ecosystem readiness.", zh: "HKDAP 的持牌发行人。其官网披露目前处于有限测试开放阶段，更广泛上线仍取决于后续生态准备。" }, website: { label: { en: "Anchorpoint official website", zh: "Anchorpoint 官网" }, url: "https://anchorpoint.hk/" }, source: ANCHORPOINT_STATUS },
      { status: "official", title: { en: "The Hongkong and Shanghai Banking Corporation Limited", zh: "香港上海汇丰银行有限公司" }, summary: { en: "Licensed stablecoin issuer from 10 April 2026. Licensing should not be represented as evidence of a live token.", zh: "自 2026 年 4 月 10 日起成为持牌稳定币发行人；不能把持牌本身当作代币已经上线的证据。" }, website: { label: { en: "HSBC Hong Kong", zh: "汇丰香港官网" }, url: "https://www.hsbc.com.hk/" }, source: HK_LICENCES },
      { status: "related", title: { en: "Securities and Futures Commission", zh: "证券及期货事务监察委员会" }, summary: { en: "Supervises other parts of the digital-asset market; it is not the stablecoin issuer-licensing authority.", zh: "负责数字资产市场的其他监管环节，但并非稳定币发行人发牌机构。" }, website: { label: { en: "SFC official website", zh: "香港证监会官网" }, url: "https://www.sfc.hk/" }, source: HK_POLICY_20 },
    ],
    watchpoints: [
      { status: "watch", title: { en: "Launch and distribution evidence", zh: "上线与分发证据" }, summary: { en: "Track the named token, issue date, eligible users, supported chains, exchanges or wallets and redemption channel separately from licence status.", zh: "应把代币名称、发行日期、适用用户、支持链、交易或钱包渠道及赎回渠道与牌照状态分别记录。" }, source: HK_PRODUCT_WARNING },
      { status: "watch", title: { en: "Adoption needs a measurable denominator", zh: "采用情况需要可量化分母" }, summary: { en: "Payment claims should be supported by transaction value, merchant coverage or active-wallet data—not pilot participation alone.", zh: "支付应用应以交易额、商户覆盖或活跃钱包等数据支持，不能只依据参加试点。" }, source: HK_PROGRESS },
      { status: "watch", title: { en: "Cross-border compliance", zh: "跨境合规" }, summary: { en: "Use with mainland or overseas users depends on the rules of every relevant jurisdiction, including promotion, AML and foreign-exchange controls.", zh: "涉及内地或海外用户时，推广、反洗钱和外汇等规则须按每个相关辖区分别判断。" }, source: HK_PROGRESS },
    ],
    outlook: [
      { status: "preparing", title: { en: "Complete pre-launch controls", zh: "完成发行前控制与测试" }, summary: { en: "Licensed issuers must complete systems testing and implement reserve, redemption, technology and operational controls before launch.", zh: "持牌人须在上线前完成系统测试，并落实储备、赎回、技术和运营控制。" }, source: HK_PROGRESS },
      { status: "watch", title: { en: "Further licences remain selective", zh: "后续牌照仍将审慎筛选" }, summary: { en: "HKMA indicated that practical uses, sustainable models, risk capability and cross-jurisdiction compliance would matter; no fixed timetable was given.", zh: "香港金管局表示将重点考察实际用途、可持续模式、风险能力与跨辖区合规，但没有给出固定时间表。" }, source: HK_PROGRESS },
      { status: "preparing", title: { en: "Extend tokenised settlement infrastructure", zh: "扩展代币化交收基础设施" }, summary: { en: "EnsembleTX is expected to operate through 2026 and progressively support 24/7 settlement in tokenised central-bank money.", zh: "EnsembleTX 计划在 2026 年持续运行，并逐步支持以代币化央行货币进行全天候结算。" }, source: HK_ENSEMBLE },
    ],
    sources: [HKMA_DISCUSSION, HKMA_SANDBOX, HK_POLICY_20, HKMA_REGIME, HK_ENSEMBLE, HK_LICENCES, HK_PRODUCT_WARNING, HK_PROGRESS, ANCHORPOINT_STATUS, HSBC_HKD_PLAN],
  },

  singapore: {
    id: "singapore",
    nav: { en: "Singapore", zh: "新加坡" },
    title: { en: "Stablecoin Developments in Singapore", zh: "新加坡稳定币发展" },
    kicker: { en: "Asia · Monetary and tokenisation hub", zh: "亚洲 · 货币与代币化枢纽" },
    thesis: {
      en: "Singapore combines a dedicated single-currency stablecoin framework with a broader licensed digital-payment-token sector and an institution-led tokenisation programme. These three tracks are connected, but they are not interchangeable.",
      zh: "新加坡同时推进单一货币稳定币框架、持牌数字支付代币服务市场和机构主导的资产代币化项目。三条路径相互关联，但不能混为一谈。",
    },
    verifiedAt: "2026-09-11",
    evidenceCutoff: "2026-08-19",
    accent: "#bd8a25",
    facts: [
      { label: { en: "Named live products", zh: "已运行的具名产品" }, value: { en: "XSGD · XUSD · USDG", zh: "XSGD · XUSD · USDG" }, note: { en: "Issuer materials document issuance, backing and distribution; regulatory status differs by product and entity.", zh: "发行方资料已经披露发行、储备与分发；不同产品和实体的监管身份并不相同。" } },
      { label: { en: "Reference currencies", zh: "锚定货币" }, value: { en: "SGD · USD", zh: "新元 · 美元" }, note: { en: "XSGD references SGD; XUSD and USDG reference USD.", zh: "XSGD 锚定新元；XUSD 与 USDG 锚定美元。" } },
      { label: { en: "Issuer-reported activity", zh: "发行方披露活动" }, value: { en: ">S$18B GTV", zh: "累计交易总值超 180 亿新元" }, note: { en: "StraitsX reports combined stablecoin gross transaction value; this is not a payment-volume series.", zh: "StraitsX 披露其稳定币累计交易总值；该数字不是支付交易额序列。" } },
      { label: { en: "DPT service institutions", zh: "DPT 服务机构" }, value: { en: "37", zh: "37 家" }, note: { en: "MAS directory, 19 Aug 2026; a DPT licence is not an SCS issuer label.", zh: "MAS 名录（2026-08-19）；DPT 牌照不等于 SCS 发行人认定。" } },
    ],
    boundary: {
      en: "A stablecoin can be live without carrying the MAS-regulated-stablecoin label. Product existence, the issuer's payment-services licence and the product-specific SCS label are therefore recorded separately.",
      zh: "稳定币可以已经运行，但尚未使用 MAS-regulated stablecoin 标签。因此，产品是否存在、发行主体持有什么支付牌照、产品是否取得专门 SCS 标签必须分开记录。",
    },
    regulatoryUrl: "/regulatory",
    milestones: [
      { date: "2022-10", status: "official", title: { en: "MAS consults on a single-currency stablecoin framework", zh: "MAS 就单一货币稳定币框架征求意见" }, summary: { en: "The consultation proposed a dedicated regime for Singapore-issued stablecoins pegged to SGD or G10 currencies.", zh: "咨询文件提出为在新加坡发行、锚定新元或 G10 货币的稳定币建立专门制度。" }, source: MAS_CONSULTATION },
      { date: "2023-08", status: "official", title: { en: "The SCS framework is finalised", zh: "SCS 监管框架定稿" }, summary: { en: "The framework sets requirements for reserves, capital, par redemption and disclosures, and reserves the MAS-regulated label for qualifying issuers.", zh: "框架确立储备、资本、按面值赎回和披露要求，并将 MAS 监管标签保留给符合要求的发行人。" }, source: MAS_FRAMEWORK },
      { date: "2024-11", status: "operating", title: { en: "USDG launches from Singapore", zh: "USDG 在新加坡发行上线" }, summary: { en: "Paxos Digital Singapore launched the US dollar-backed USDG after receiving an MAS Major Payment Institution licence to issue stablecoins. Distribution was designed through exchanges, wallets and platform partners.", zh: "Paxos Digital Singapore 在取得 MAS 主要支付机构牌照并获准发行稳定币后推出美元稳定币 USDG，计划通过交易平台、钱包和其他平台伙伴分发。" }, source: PAXOS_USDG },
      { date: "2024-11", status: "related", title: { en: "Project Guardian moves toward commercial networks", zh: "Project Guardian 向商业网络推进" }, summary: { en: "MAS announced measures to deepen liquidity, develop market infrastructure and support commercialisation of tokenised assets. This is adjacent infrastructure, not an SCS licence.", zh: "MAS 宣布深化流动性、发展市场基础设施并支持代币化资产商业化；这属于相邻基础设施，并非 SCS 牌照。" }, source: MAS_GUARDIAN },
      { date: "2025-12", status: "operating", title: { en: "StraitsX reports live XSGD and XUSD activity", zh: "StraitsX 披露 XSGD 与 XUSD 的运行情况" }, summary: { en: "StraitsX reported that XSGD and XUSD were live, backed 1:1 and supported by twice-monthly attestations, with combined stablecoin GTV above S$18 billion.", zh: "StraitsX 披露 XSGD 与 XUSD 已运行并按 1:1 储备支持、每月两次发布鉴证，旗下稳定币累计交易总值超过 180 亿新元。" }, source: STRAITSX_2025 },
      { date: "2026-08", status: "operating", title: { en: "The licensed DPT-service sector remains active", zh: "持牌 DPT 服务市场持续运行" }, summary: { en: "MAS's live directory lists institutions authorised for digital-payment-token services. The directory records service licences, not MAS-regulated-stablecoin labels.", zh: "MAS 实时名录列出获准提供数字支付代币服务的机构；该名录记录服务牌照，而不是 MAS 监管稳定币标签。" }, source: MAS_DIRECTORY },
    ],
    applications: [
      { status: "operating", title: { en: "XSGD and XUSD issuance and redemption", zh: "XSGD 与 XUSD 的发行和赎回" }, summary: { en: "StraitsX users can move between fiat balances and its stablecoins; XSGD is listed across multiple public networks and is redeemable 1:1 for SGD through StraitsX.", zh: "StraitsX 用户可以在法币余额与稳定币之间转换；XSGD 已部署在多条公共区块链，并可通过 StraitsX 按 1:1 赎回新元。" }, actors: { en: "StraitsX issuance entities and StraitsX Payment Services", zh: "StraitsX 发行实体与 StraitsX Payment Services" }, evidence: { label: { en: "Named products", zh: "具名产品" }, value: { en: "XSGD · XUSD", zh: "XSGD · XUSD" }, note: { en: "Live issuer products; product-level payment volume is not disclosed here", zh: "发行方已运行产品；本来源未披露产品级支付额" } }, source: STRAITSX_PRODUCTS },
      { status: "operating", title: { en: "USDG institutional distribution", zh: "USDG 的机构与平台分发" }, summary: { en: "USDG is issued by Paxos Digital Singapore and distributed through exchanges, wallets and platform partners for individual and institutional access.", zh: "USDG 由 Paxos Digital Singapore 发行，通过交易平台、钱包和平台伙伴面向个人及机构分发。" }, actors: { en: "Paxos Digital Singapore; Paxos Global; distribution partners", zh: "Paxos Digital Singapore、Paxos Global 与分发伙伴" }, evidence: { label: { en: "Launch evidence", zh: "上线证据" }, value: { en: "Live since Nov 2024", zh: "2024 年 11 月上线" }, note: { en: "Issuer announcement; not a measure of active users or payments", zh: "发行方上线公告；不代表活跃用户数或支付额" } }, source: PAXOS_USDG },
      { status: "operating", title: { en: "Licensed DPT services", zh: "持牌数字支付代币服务" }, summary: { en: "A live payment-services perimeter supports custody, transfer and related DPT activity by listed institutions.", zh: "现有支付服务制度支持名录机构开展托管、转移及其他 DPT 相关业务。" }, actors: { en: "MAS-listed payment institutions", zh: "MAS 名录内支付机构" }, evidence: { label: { en: "Directory count", zh: "名录数量" }, value: { en: "37 institutions", zh: "37 家机构" }, note: { en: "DPT service institutions on 19 Aug 2026; not SCS-labelled issuers", zh: "截至 2026-08-19 的 DPT 服务机构；并非 SCS 标签发行人" } }, source: MAS_DIRECTORY },
      { status: "related", title: { en: "Institutional tokenised markets", zh: "机构代币化市场" }, summary: { en: "Project Guardian trials and commercialisation work cover funds, fixed income, foreign exchange and settlement infrastructure.", zh: "Project Guardian 的试验与商业化工作覆盖基金、固定收益、外汇及交收基础设施。" }, actors: { en: "MAS and international financial institutions", zh: "MAS 与国际金融机构" }, source: MAS_GUARDIAN },
    ],
    participants: [
      { status: "official", title: { en: "Monetary Authority of Singapore", zh: "新加坡金融管理局" }, summary: { en: "Central bank, integrated financial regulator and designer of the SCS framework.", zh: "兼具中央银行与综合金融监管职能，并负责设计 SCS 框架。" }, website: { label: { en: "MAS official website", zh: "MAS 官网" }, url: "https://www.mas.gov.sg/" }, source: MAS_FRAMEWORK },
      { status: "operating", title: { en: "StraitsX", zh: "StraitsX" }, summary: { en: "Issues and distributes XSGD and XUSD through separate group entities; provides mint, redemption and wallet access.", zh: "通过集团内不同实体发行和分发 XSGD、XUSD，并提供铸造、赎回和钱包入口。" }, website: { label: { en: "StraitsX stablecoins", zh: "StraitsX 稳定币" }, url: "https://www.straitsx.com/xsgd" }, source: STRAITSX_PRODUCTS },
      { status: "operating", title: { en: "Paxos Digital Singapore", zh: "Paxos Digital Singapore" }, summary: { en: "MAS-licensed Major Payment Institution and issuer of USDG.", zh: "MAS 主要支付机构牌照持有人，也是 USDG 的发行主体。" }, website: { label: { en: "USDG product announcement", zh: "USDG 产品公告" }, url: "https://www.paxos.com/newsroom/paxos-introduces-global-dollar-usdg" }, source: PAXOS_USDG },
      { status: "operating", title: { en: "Licensed payment institutions", zh: "持牌支付机构" }, summary: { en: "Provide regulated DPT services under the Payment Services Act perimeter; their exact permissions should be read from the official directory.", zh: "在《支付服务法》范围内提供受监管 DPT 服务；具体许可范围应以官方名录为准。" }, website: { label: { en: "MAS financial-institutions directory", zh: "MAS 金融机构名录" }, url: "https://eservices.mas.gov.sg/fid" }, source: MAS_DIRECTORY },
      { status: "related", title: { en: "Project Guardian participants", zh: "Project Guardian 参与者" }, summary: { en: "Financial institutions and public-sector partners develop tokenisation use cases, standards and commercial networks.", zh: "金融机构与公共部门伙伴共同开发代币化应用、标准与商业网络。" }, website: { label: { en: "Project Guardian", zh: "Project Guardian 专题" }, url: "https://www.mas.gov.sg/schemes-and-initiatives/project-guardian" }, source: MAS_GUARDIAN },
    ],
    watchpoints: [
      { status: "watch", title: { en: "Live product is not the same as an SCS label", zh: "产品已运行不等于取得 SCS 标签" }, summary: { en: "XSGD, XUSD and USDG are live products. The site separately records whether MAS has authorised the issuer, whether the product is described as substantially compliant, and whether it formally carries the MAS-regulated-stablecoin label.", zh: "XSGD、XUSD 和 USDG 都是已运行产品。网站另行记录发行主体是否获 MAS 许可、产品是否被描述为实质符合框架，以及是否正式使用 MAS-regulated stablecoin 标签。" }, source: MAS_FRAMEWORK },
      { status: "watch", title: { en: "Separate payment activity from tokenisation trials", zh: "区分支付活动与代币化试验" }, summary: { en: "Guardian participation indicates infrastructure or use-case work, not stablecoin issuance, circulation or payment volume.", zh: "参与 Guardian 说明参与基础设施或应用试验，并不代表稳定币发行量、流通量或支付量。" }, source: MAS_GUARDIAN },
      { status: "watch", title: { en: "GTV is not payment volume", zh: "累计交易总值不等于支付额" }, summary: { en: "StraitsX reports more than S$18 billion in combined stablecoin GTV, but does not split that figure into payments, exchange, transfers or individual tokens.", zh: "StraitsX 披露旗下稳定币累计交易总值超过 180 亿新元，但没有把该数字拆分为支付、兑换、转账或单一代币活动。" }, source: STRAITSX_2025 },
    ],
    outlook: [
      { status: "watch", title: { en: "Publish product-level use data", zh: "补充产品级使用数据" }, summary: { en: "The next useful evidence is token-level supply, active wallets, redemption and attributed payment volume—not another count of licensed service providers.", zh: "下一步真正有价值的证据是按代币统计的供应量、活跃钱包、赎回量和可归因支付额，而不是再次统计持牌服务商数量。" }, source: STRAITSX_2025 },
      { status: "preparing", title: { en: "Commercialise tokenisation networks", zh: "推动代币化网络商业化" }, summary: { en: "MAS plans coordinated commercial networks and common infrastructure following successful industry trials.", zh: "MAS 计划在行业试验基础上推动协调的商业网络与共用基础设施。" }, source: MAS_GUARDIAN },
      { status: "watch", title: { en: "Track the boundary between money forms", zh: "持续观察不同货币形态的边界" }, summary: { en: "Stablecoins, tokenised deposits and central-bank settlement assets may coexist, but they carry different claims and regulatory protections.", zh: "稳定币、代币化存款和央行结算资产可以并存，但其权利基础和监管保护不同。" } },
    ],
    sources: [MAS_CONSULTATION, MAS_FRAMEWORK, PAXOS_USDG, STRAITSX_PRODUCTS, STRAITSX_2025, MAS_GUARDIAN, MAS_DIRECTORY],
  },

  uae: {
    id: "uae",
    nav: { en: "United Arab Emirates", zh: "阿联酋" },
    title: { en: "Stablecoin Developments in the United Arab Emirates", zh: "阿联酋稳定币发展" },
    kicker: { en: "Asia · Federal framework and Dubai market", zh: "亚洲 · 联邦制度与迪拜市场" },
    thesis: {
      en: "The UAE is building a regulated payment-token market through a multi-authority structure. AED payment tokens sit with the Central Bank, while Dubai's VARA governs other fiat-referenced virtual assets outside DIFC.",
      zh: "阿联酋通过多监管机构体系建设受监管的支付代币市场。迪拉姆支付代币由阿联酋中央银行负责；迪拜 VARA 则监管 DIFC 以外的其他法币参考虚拟资产。",
    },
    verifiedAt: "2026-09-11",
    evidenceCutoff: "2026-09-12",
    accent: "#2f7d73",
    facts: [
      { label: { en: "Federal PTS regulation", zh: "联邦支付代币规则" }, value: { en: "In force", zh: "已经生效" }, note: { en: "Effective from 31 August 2024.", zh: "自 2024 年 8 月 31 日起生效。" } },
      { label: { en: "Named live AED products", zh: "已运行的 AED 产品" }, value: { en: "AE Coin · Zand AED", zh: "AE Coin · Zand AED" }, note: { en: "Both products have issuer or distribution evidence; a third licensed entity does not by itself prove a third live token.", zh: "两个产品均有发行方或分发渠道证据；第三家持牌实体不自动等于第三个产品已上线。" } },
      { label: { en: "Dirham issuer entries", zh: "迪拉姆发行主体" }, value: { en: "3", zh: "3 家" }, note: { en: "AED StableCoin, Zand Trust and AEDC Stable Coin appear in the CBUAE register.", zh: "CBUAE 名录列出 AED StableCoin、Zand Trust 与 AEDC Stable Coin。" } },
      { label: { en: "Observed payment access", zh: "已观察支付入口" }, value: { en: "Wallet + merchants", zh: "钱包 + 商户" }, note: { en: "AEC Wallet supports conversion, transfer, merchant payment and bank redemption; its directory names accepting merchants.", zh: "AEC Wallet 支持兑换、转账、商户支付及银行赎回，官方名录列出接受 AE Coin 的商户。" } },
    ],
    boundary: {
      en: "The applicable authority depends on currency, activity and location. AED-referenced payment-token issuance is reserved to CBUAE; Dubai VARA's FRVA rules cover its own perimeter and exclude DIFC.",
      zh: "适用主管机构取决于参考货币、业务与地点。AED 参考支付代币发行由 CBUAE 专属监管；迪拜 VARA 的 FRVA 规则只覆盖其自身范围，并排除 DIFC。",
    },
    regulatoryUrl: "/regulatory",
    milestones: [
      { date: "2023-09", status: "official", title: { en: "Dubai sets specialist rules for fiat-referenced virtual assets", zh: "迪拜建立法币参考虚拟资产专门规则" }, summary: { en: "VARA introduced reserve, redemption, disclosure and prudential requirements while recognising CBUAE's exclusive role over AED-referenced issuance.", zh: "VARA 建立储备、赎回、披露与审慎要求，同时确认 AED 参考发行由 CBUAE 专属监管。" }, source: VARA_RULE },
      { date: "2024-08", status: "official", title: { en: "The federal Payment Token Services Regulation takes effect", zh: "联邦《支付代币服务监管规则》生效" }, summary: { en: "The regulation covers issuance, conversion, custody and transfer, with rules for reserves, licensing and customer protection.", zh: "规则覆盖发行、兑换、托管和转移，并规定储备、许可及客户保护要求。" }, source: CBUAE_RULE },
      { date: "2025", status: "official", title: { en: "CBUAE reports two licensed dirham-backed issuers", zh: "CBUAE 披露两家迪拉姆支持代币发行人获牌" }, summary: { en: "The 2025 annual report describes the licences and identifies selected domestic and cross-border payment use cases as possible regulated applications.", zh: "2025 年年报说明相关牌照，并将部分境内及跨境支付场景列为可能的受监管应用。" }, source: CBUAE_REPORT },
      { date: "2025", status: "operating", title: { en: "AE Coin becomes available through AEC Wallet", zh: "AE Coin 通过 AEC Wallet 提供支付与赎回" }, summary: { en: "The wallet supports AED-to-AE-Coin conversion, transfers, merchant payments and redemption to a bank account, establishing product and channel evidence beyond licensing.", zh: "该钱包支持 AED 与 AE Coin 兑换、转账、商户支付及赎回至银行账户，形成牌照以外的产品与渠道证据。" }, source: AECOIN_WALLET },
      { date: "2025-11", status: "operating", title: { en: "Zand launches Zand AED on public blockchains", zh: "Zand AED 在公共区块链上线" }, summary: { en: "Zand Trust announced an AED-backed, multi-chain token issued under its CBUAE licence, creating a second named operating product in the federal perimeter.", zh: "Zand Trust 宣布在 CBUAE 牌照下发行 AED 支持的多链代币，构成联邦范围内第二个具名运行产品。" }, source: ZAND_AED },
      { date: "2026-03", status: "official", title: { en: "The public register lists three dirham issuer entities", zh: "公开登记册列出三家迪拉姆发行主体" }, summary: { en: "The register lists AED StableCoin L.L.C - S.P.C, Zand Trust L.L.C S.O.C and AEDC Stable Coin-L.L.C under dirham payment-token issuance.", zh: "登记册在迪拉姆支付代币发行类别下列出 AED StableCoin、Zand Trust 与 AEDC Stable Coin 三家主体。" }, source: CBUAE_REGISTER },
    ],
    applications: [
      { status: "operating", title: { en: "AE Coin wallet and merchant payments", zh: "AE Coin 钱包与商户支付" }, summary: { en: "AEC Wallet users can acquire, transfer and redeem AE Coin and pay participating merchants. This confirms an operating channel, while total users, merchants and payment value remain undisclosed.", zh: "AEC Wallet 用户可以获取、转账和赎回 AE Coin，并向参与商户付款。这证明渠道已经运行，但用户总数、商户总数与支付额尚未披露。" }, actors: { en: "AED Stablecoin LLC; Al Maryah Community Bank; accepting merchants", zh: "AED Stablecoin LLC、Al Maryah Community Bank 与受理商户" }, evidence: { label: { en: "Observed functions", zh: "已观察功能" }, value: { en: "4 wallet functions", zh: "4 类钱包功能" }, note: { en: "Convert, transfer, pay and redeem; not a transaction-volume measure", zh: "兑换、转账、支付、赎回；并非交易量指标" } }, source: AECOIN_WALLET },
      { status: "operating", title: { en: "Zand AED multi-chain issuance", zh: "Zand AED 多链发行" }, summary: { en: "Zand AED is an AED-backed token issued by Zand Trust on public blockchains, with institutional settlement and developer integration named as use directions.", zh: "Zand AED 是由 Zand Trust 在公共区块链发行的 AED 支持代币，发行方列出了机构结算和开发者接入等使用方向。" }, actors: { en: "Zand Trust and Zand Bank", zh: "Zand Trust 与 Zand Bank" }, evidence: { label: { en: "Launch status", zh: "上线状态" }, value: { en: "Live since Nov 2025", zh: "2025 年 11 月上线" }, note: { en: "Launch is verified; supply and usage volume are not disclosed", zh: "已核验上线；供应量和使用量尚未披露" } }, source: ZAND_AED },
      { status: "preparing", title: { en: "Cross-border payment uses", zh: "跨境支付应用" }, summary: { en: "CBUAE identifies selected cross-border payment uses as possible regulated applications; live corridor coverage still needs product-level evidence.", zh: "CBUAE 将部分跨境支付列为可能的受监管应用；哪些走廊已经投入运行仍需产品级证据。" }, source: CBUAE_REPORT },
      { status: "operating", title: { en: "Virtual-asset market infrastructure in Dubai", zh: "迪拜虚拟资产市场基础设施" }, summary: { en: "VARA's framework provides a rulebook for non-AED fiat-referenced virtual assets in Dubai outside DIFC, alongside exchange, custody and transfer activity rules.", zh: "VARA 为 DIFC 以外迪拜地区的非 AED 法币参考虚拟资产提供规则，并与交易、托管和转移活动制度衔接。" }, actors: { en: "VARA-regulated market participants", zh: "VARA 监管范围内的市场参与者" }, source: VARA_RULE },
    ],
    participants: [
      { status: "official", title: { en: "Central Bank of the UAE", zh: "阿联酋中央银行" }, summary: { en: "Federal authority for payment-token services and exclusive authority for AED-referenced payment-token issuance.", zh: "负责联邦支付代币服务，并专属监管 AED 参考支付代币发行。" }, website: { label: { en: "CBUAE official website", zh: "CBUAE 官网" }, url: "https://centralbank.ae/" }, source: CBUAE_RULE },
      { status: "operating", title: { en: "AED Stablecoin LLC and AEC Wallet", zh: "AED Stablecoin LLC 与 AEC Wallet" }, summary: { en: "AED Stablecoin LLC issues AE Coin; Al Maryah Community Bank provides the wallet and merchant-payment interface.", zh: "AED Stablecoin LLC 发行 AE Coin；Al Maryah Community Bank 提供钱包与商户支付入口。" }, website: { label: { en: "AEC Wallet", zh: "AEC Wallet 官网" }, url: "https://www.mbank.ae/aec-wallet/" }, source: AECOIN_WALLET },
      { status: "operating", title: { en: "Zand Trust", zh: "Zand Trust" }, summary: { en: "CBUAE-licensed issuer of Zand AED, with Zand Bank providing institutional and technical distribution infrastructure.", zh: "Zand AED 的 CBUAE 持牌发行主体，由 Zand Bank 提供机构及技术分发基础设施。" }, website: { label: { en: "Zand AED announcement", zh: "Zand AED 官方公告" }, url: "https://www.zand.ae/en/news/zand-launches-uaes-first-aed-backed-stablecoin-on-public-blockchain" }, source: ZAND_AED },
      { status: "official", title: { en: "Dubai VARA", zh: "迪拜虚拟资产监管局" }, summary: { en: "Regulates virtual-asset activity in Dubai mainland and relevant free zones, excluding DIFC.", zh: "监管迪拜大陆及相关自由区的虚拟资产活动，但不包括 DIFC。" }, website: { label: { en: "VARA official website", zh: "VARA 官网" }, url: "https://www.vara.ae/" }, source: VARA_RULE },
      { status: "official", title: { en: "AEDC Stable Coin", zh: "AEDC Stable Coin" }, summary: { en: "The third dirham-token issuer entity in the CBUAE register. Its licence is verified, while a named operating token and distribution channel are not yet evidenced here.", zh: "CBUAE 名录中的第三家迪拉姆代币发行主体。牌照已经核验，但本页尚未找到具名运行代币与分发渠道的证据。" }, website: { label: { en: "CBUAE licensing register", zh: "CBUAE 许可名录" }, url: "https://centralbank.ae/en/licensing" }, source: CBUAE_REGISTER },
    ],
    institutionalMap: [
      { status: "official", title: { en: "CBUAE · Federal perimeter", zh: "CBUAE · 联邦范围" }, summary: { en: "Payment-token services and AED-referenced issuance; financial free zones are treated separately where the rule specifies.", zh: "负责支付代币服务与 AED 参考发行；规则另有说明时，金融自由区单独处理。" }, source: CBUAE_RULE },
      { status: "official", title: { en: "VARA · Dubai", zh: "VARA · 迪拜" }, summary: { en: "Dubai mainland and free zones within VARA's perimeter, excluding DIFC; AED-referenced issuance remains with CBUAE.", zh: "覆盖 VARA 管辖的迪拜大陆及自由区，不包括 DIFC；AED 参考发行仍归 CBUAE。" }, source: VARA_RULE },
      { status: "watch", title: { en: "DFSA · DIFC", zh: "DFSA · 迪拜国际金融中心" }, summary: { en: "A separate financial-free-zone framework; verify the applicable token category and activity directly with DFSA materials.", zh: "属于独立金融自由区制度；具体代币类别与活动应直接依据 DFSA 文件核验。" } },
      { status: "watch", title: { en: "FSRA · ADGM", zh: "FSRA · 阿布扎比全球市场" }, summary: { en: "A separate Abu Dhabi financial-free-zone framework and not part of Dubai's VARA perimeter.", zh: "属于阿布扎比的独立金融自由区制度，不在迪拜 VARA 范围内。" } },
    ],
    watchpoints: [
      { status: "watch", title: { en: "Three issuer entries do not prove three live tokens", zh: "三家发行主体不等于三个产品都已上线" }, summary: { en: "AE Coin and Zand AED have operating product evidence. AEDC Stable Coin appears in the register, but its token and channels still require separate verification.", zh: "AE Coin 与 Zand AED 已有产品运行证据。AEDC Stable Coin 出现在许可名录中，但其代币与渠道仍需另行核验。" }, source: CBUAE_REGISTER },
      { status: "watch", title: { en: "Authority routing", zh: "监管机构路由" }, summary: { en: "Tag every observation by currency, activity and location so CBUAE, VARA, DFSA and FSRA facts are not combined incorrectly.", zh: "每条观测都应标记参考货币、活动与地点，避免把 CBUAE、VARA、DFSA 和 FSRA 的事实错误合并。" }, source: CBUAE_RULE },
      { status: "watch", title: { en: "Merchant names do not measure adoption scale", zh: "具名商户不代表采用规模" }, summary: { en: "The merchant directory proves acceptance at named locations. It does not disclose total merchant coverage, active users or payment value.", zh: "商户名录证明具名地点可以受理，但没有披露商户总覆盖、活跃用户或支付额。" }, source: AECOIN_MERCHANTS },
    ],
    outlook: [
      { status: "watch", title: { en: "Publish product-level market and payment data", zh: "补充产品级市场与支付数据" }, summary: { en: "The next evidence gap is supply, mint and redemption flows, active wallets, merchant coverage and attributed payment value for each token.", zh: "下一步的数据缺口是按产品披露供应量、铸造与赎回流量、活跃钱包、商户覆盖及可归因支付额。" }, source: AECOIN_WALLET },
      { status: "preparing", title: { en: "Develop selected payment uses", zh: "发展特定支付用途" }, summary: { en: "CBUAE points to regulated domestic and cross-border uses while retaining reserve, redemption and operational safeguards.", zh: "CBUAE 指向受监管的境内及跨境用途，同时保留储备、赎回和运营保障要求。" }, source: CBUAE_REPORT },
      { status: "watch", title: { en: "Coordinate a multi-authority market", zh: "协调多监管机构市场" }, summary: { en: "Users and firms need clear routing across federal, Dubai and financial-free-zone rules as products and distribution models develop.", zh: "随着产品和分发模式发展，用户与机构需要在联邦、迪拜及金融自由区制度之间获得清晰的监管路径。" } },
    ],
    sources: [CBUAE_RULE, VARA_RULE, CBUAE_REPORT, CBUAE_REGISTER, AECOIN_WALLET, AECOIN_MERCHANTS, ZAND_AED],
  },
};
