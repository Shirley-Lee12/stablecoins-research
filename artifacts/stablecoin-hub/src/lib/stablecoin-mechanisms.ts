export type LocalizedList = {
  en: string[];
  zh: string[];
};

export type MechanismReference = {
  title: string;
  publisher: string;
  year: string;
  url: string;
};

export type MechanismCopy = {
  id: string;
  en: string;
  zh: string;
  summaryEn: string;
  summaryZh: string;
  principleEn: string;
  principleZh: string;
  redemptionEn: string;
  redemptionZh: string;
  riskEn: string;
  riskZh: string;
  examplesEn: string;
  examplesZh: string;
  flowEn: string[];
  flowZh: string[];
  strengths: LocalizedList;
  failureModes: LocalizedList;
  references: MechanismReference[];
  video?: {
    titleEn: string;
    titleZh: string;
    publisher: string;
    embedUrl: string;
    watchUrl: string;
  };
};

export const MECHANISM_COLORS: Record<string, string> = {
  "fiat-backed": "#3558c9",
  "crypto-backed": "#138a7e",
  synthetic: "#d45d4c",
  algorithmic: "#c58a19",
  other: "#77808f",
};

export const MECHANISMS: MechanismCopy[] = [
  {
    id: "fiat-backed", en: "Fiat-backed", zh: "法币储备型",
    summaryEn: "An identifiable issuer holds off-chain cash or high-quality liquid assets against tokens in circulation.",
    summaryZh: "由明确的发行主体持有链下现金或高流动性资产，为流通代币提供支持。",
    principleEn: "The peg is maintained through issuance and redemption near par. Reserve quality, segregation, custody, and the issuer's legal obligations are central.",
    principleZh: "通过接近面值的发行与赎回维持锚定，核心在于储备质量、资产隔离、托管安排及发行人的法律义务。",
    redemptionEn: "Usually a direct claim on an issuer, although access, minimum amounts, fees, and intermediary arrangements vary.",
    redemptionZh: "通常形成对发行人的赎回请求，但准入、最低金额、费用和中介安排各不相同。",
    riskEn: "Reserve credit and liquidity risk, custody and banking concentration, operational resilience, disclosure quality, and legal enforceability.",
    riskZh: "储备信用与流动性风险、托管与银行集中度、运营韧性、披露质量及法律可执行性。",
    examplesEn: "Representative projects include USDT, USDC, PYUSD, and EURC.",
    examplesZh: "代表项目包括 USDT、USDC、PYUSD 与 EURC。",
    flowEn: ["Fiat deposit", "Reserve assets", "Token issuance", "On-chain circulation", "Redemption and burn"],
    flowZh: ["存入法币", "形成储备", "发行代币", "链上流通", "赎回并销毁"],
    strengths: {
      en: ["Intuitive par-redemption anchor", "Can use highly liquid reserve assets", "Clear issuer and operating perimeter"],
      zh: ["面值赎回机制直观", "可配置高流动性储备资产", "发行人与运营边界较清晰"],
    },
    failureModes: {
      en: ["Reserve losses or delayed liquidation", "Banking and custodian concentration", "Unequal access to primary redemption"],
      zh: ["储备损失或变现延迟", "银行与托管机构集中", "一级赎回渠道并非人人可得"],
    },
    references: [
      { title: "Tokenizing and Redeeming USDC", publisher: "Circle", year: "2026", url: "https://help.circle.com/support/en/tokenizing-and-redeeming-usdc?id=kb_article_view&sysparm_article=KB0010781" },
      { title: "USDC Transparency and Stability", publisher: "Circle", year: "2026", url: "https://www.circle.com/transparency" },
      { title: "The Next-generation Monetary and Financial System", publisher: "Bank for International Settlements", year: "2025", url: "https://www.bis.org/publ/arpdf/ar2025e3.htm" },
    ],
    video: { titleEn: "Meet Circle", titleZh: "认识 Circle 与数字美元", publisher: "Circle", embedUrl: "https://www.youtube-nocookie.com/embed/oGplX-iLLTc", watchUrl: "https://www.youtube.com/watch?v=oGplX-iLLTc" },
  },
  {
    id: "crypto-backed", en: "Crypto-collateralized", zh: "加密资产抵押型",
    summaryEn: "Tokens are issued against on-chain collateral, commonly with overcollateralization and automated liquidation.",
    summaryZh: "以链上加密资产作抵押发行，通常配合超额抵押和自动清算。",
    principleEn: "Smart contracts monitor collateral value. When ratios fall below required levels, liquidation and arbitrage are intended to protect the peg.",
    principleZh: "智能合约监控抵押品价值；当抵押率低于要求时，通过清算与套利机制维护锚定。",
    redemptionEn: "Users may repay debt to unlock collateral or exchange the token through protocol facilities and secondary markets.",
    redemptionZh: "用户可偿还债务取回抵押品，也可通过协议设施或二级市场兑换。",
    riskEn: "Collateral volatility, oracle failure, liquidation congestion, smart-contract vulnerabilities, governance, and collateral concentration.",
    riskZh: "抵押品波动、预言机故障、清算拥堵、智能合约漏洞、治理及抵押品集中度。",
    examplesEn: "Representative projects include DAI, USDS, GHO, and crvUSD.",
    examplesZh: "代表项目包括 DAI、USDS、GHO 与 crvUSD。",
    flowEn: ["Lock crypto collateral", "Oracle valuation", "Mint below collateral value", "Monitor ratio", "Repay or liquidate"],
    flowZh: ["锁定加密抵押品", "预言机估值", "按折扣铸币", "持续监控抵押率", "偿还或触发清算"],
    strengths: {
      en: ["Collateral and positions can be auditable on-chain", "Rules may execute without a conventional issuer", "Overcollateralization absorbs moderate price moves"],
      zh: ["抵押品与头寸可在链上核验", "规则可不依赖传统发行人执行", "超额抵押可吸收一定价格波动"],
    },
    failureModes: {
      en: ["Fast collateral drawdown", "Oracle or liquidation failure", "Governance and smart-contract intervention"],
      zh: ["抵押品快速下跌", "预言机或清算失灵", "治理与智能合约干预风险"],
    },
    references: [
      { title: "Sky Protocol Documentation", publisher: "Sky", year: "2026", url: "https://developers.sky.money/" },
      { title: "Will the Real Stablecoin Please Stand Up?", publisher: "Bank for International Settlements", year: "2023", url: "https://www.bis.org/publ/bppdf/bispap141.pdf" },
    ],
    video: { titleEn: "How MakerDAO Works", titleZh: "MakerDAO 与 DAI 的运行机制", publisher: "CoinDesk", embedUrl: "https://www.youtube-nocookie.com/embed/J9q8hkyy8oM", watchUrl: "https://www.youtube.com/watch?v=J9q8hkyy8oM" },
  },
  {
    id: "synthetic", en: "Synthetic", zh: "合成型",
    summaryEn: "Value is supported by a hedged portfolio or derivatives strategy rather than a simple one-for-one cash reserve.",
    summaryZh: "通过对冲组合或衍生品策略支持价值，而非简单的一比一现金储备。",
    principleEn: "A protocol combines collateral with offsetting derivatives positions so that gains and losses are intended to neutralize price exposure.",
    principleZh: "协议将抵押品与方向相反的衍生品头寸组合，以期抵消价格敞口。",
    redemptionEn: "Minting and redemption depend on protocol rules, eligible collateral, hedging venues, and available market liquidity.",
    redemptionZh: "铸造与赎回取决于协议规则、合格抵押品、对冲场所及市场流动性。",
    riskEn: "Exchange and custodian exposure, basis and funding-rate risk, hedge execution, liquidity stress, and operational complexity.",
    riskZh: "交易所与托管风险、基差与资金费率风险、对冲执行、流动性压力及运营复杂性。",
    examplesEn: "USDe is the principal large-scale example in the current dataset.",
    examplesZh: "USDe 是当前数据中最主要的大规模代表。",
    flowEn: ["Deposit eligible collateral", "Open offsetting hedge", "Mint synthetic dollar", "Rebalance hedge", "Redeem and unwind"],
    flowZh: ["存入合格抵押品", "建立反向对冲", "铸造合成美元", "动态再平衡", "赎回并平仓"],
    strengths: {
      en: ["Can reduce directional exposure without cash reserves", "Combines collateral and derivatives infrastructure", "Potentially scalable when hedge markets are deep"],
      zh: ["无需现金储备也可降低方向性敞口", "结合抵押品与衍生品基础设施", "对冲市场充足时具备扩张能力"],
    },
    failureModes: {
      en: ["Persistent adverse funding rates", "Exchange, custodian, or settlement failure", "Hedge slippage during stressed liquidity"],
      zh: ["资金费率持续不利", "交易所、托管或结算故障", "流动性压力下对冲滑点放大"],
    },
    references: [
      { title: "USDe Overview", publisher: "Ethena", year: "2026", url: "https://docs.ethena.fi/solution-overview/overview" },
      { title: "How to Mint and Redeem USDe", publisher: "Ethena", year: "2026", url: "https://docs.ethena.fi/video-guides/how-to-mint-usde" },
      { title: "Meeting with Representatives of Ethena Labs", publisher: "U.S. Securities and Exchange Commission", year: "2025", url: "https://www.sec.gov/files/ctf-memo-ethena-labs-s-morrison-cohen-llp-070125.pdf" },
    ],
  },
  {
    id: "algorithmic", en: "Algorithmic", zh: "算法型",
    summaryEn: "Supply rules and arbitrage incentives seek to maintain the peg without full, readily redeemable backing.",
    summaryZh: "主要依靠供给规则与套利激励维持锚定，并不具备充分且可随时赎回的储备。",
    principleEn: "Designs may expand and contract supply, use a paired token, or combine partial collateral with algorithmic controls. These subtypes should not be treated as identical.",
    principleZh: "机制可能调节供给、使用双代币结构，或结合部分抵押与算法控制；不同子类型不能视为完全相同。",
    redemptionEn: "The route back to the reference asset often depends on market incentives or conversion into another token rather than a direct issuer claim.",
    redemptionZh: "恢复锚定往往依赖市场激励或兑换为另一代币，而非对发行人的直接赎回请求。",
    riskEn: "Reflexive runs, insufficient arbitrage capacity, confidence shocks, governance intervention, and death-spiral dynamics.",
    riskZh: "反身性挤兑、套利容量不足、信心冲击、治理干预及死亡螺旋。",
    examplesEn: "UST and FEI are retained as historical cases; FRAX represents a design that evolved over time.",
    examplesZh: "UST 与 FEI 作为历史案例保留；FRAX 则代表机制随时间演变的项目。",
    flowEn: ["Observe market price", "Trigger rule or arbitrage", "Expand or contract supply", "Trade paired asset", "Attempt to restore peg"],
    flowZh: ["观察市场价格", "触发规则或套利", "扩张或收缩供给", "交易配对资产", "尝试恢复锚定"],
    strengths: {
      en: ["Can minimize direct reserve holdings", "Policy rules can be transparent and automatic", "Useful as a design laboratory"],
      zh: ["可减少直接储备资产需求", "政策规则可透明并自动执行", "具有机制实验价值"],
    },
    failureModes: {
      en: ["Confidence and collateral values fall together", "Arbitrage capacity disappears under stress", "Paired-token dilution accelerates a run"],
      zh: ["信心与支撑资产价值同步下降", "压力期套利能力消失", "配对代币稀释加速挤兑"],
    },
    references: [
      { title: "Stablecoin Growth: Policy Challenges and Approaches", publisher: "Bank for International Settlements", year: "2025", url: "https://www.bis.org/publ/bisbull108.pdf" },
      { title: "The Future Monetary System", publisher: "Bank for International Settlements", year: "2022", url: "https://www.bis.org/publ/arpdf/ar2022e3.htm" },
    ],
    video: { titleEn: "The Future Monetary System", titleZh: "未来货币体系与加密资产风险", publisher: "Bank for International Settlements", embedUrl: "https://www.youtube-nocookie.com/embed/Y7cotUV4z1s", watchUrl: "https://www.youtube.com/watch?v=Y7cotUV4z1s" },
  },
  {
    id: "other", en: "Other / provider-specific", zh: "其他 / 数据源特定分类",
    summaryEn: "Projects whose provider classification does not map cleanly to the four principal mechanisms.",
    summaryZh: "数据提供方分类无法清晰对应上述四类主要机制的项目。",
    principleEn: "These projects require project-level review before a more precise mechanism label is assigned.",
    principleZh: "此类项目需要逐项核验后，才能分配更精确的机制标签。",
    redemptionEn: "Varies by project.", redemptionZh: "因项目而异。",
    riskEn: "The main additional risk is classification uncertainty; readers should consult primary project documentation.",
    riskZh: "额外风险主要来自分类不确定性，应查阅项目的一手文件。",
    examplesEn: "No single design should be inferred from this residual category.",
    examplesZh: "不能从这一剩余类别推断出统一设计。",
    flowEn: ["Inspect project documents", "Identify backing", "Verify redemption", "Map risk bearer", "Assign mechanism"],
    flowZh: ["查阅项目文件", "识别支撑资产", "核验赎回机制", "定位风险承担者", "重新归类"],
    strengths: { en: ["Prevents forced classification", "Keeps uncertain records visible"], zh: ["避免强行归类", "保留待核验项目的可见性"] },
    failureModes: { en: ["Users infer a common design from a residual group", "Provider labels become stale"], zh: ["用户误以为剩余类别具有共同机制", "数据源标签未及时更新"] },
    references: [
      { title: "Stablecoins Dashboard", publisher: "DefiLlama", year: "Live", url: "https://defillama.com/stablecoins" },
    ],
  },
];

export function getMechanism(id: string | undefined) {
  return MECHANISMS.find((item) => item.id === id);
}
