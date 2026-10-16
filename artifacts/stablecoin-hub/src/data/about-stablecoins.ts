import frozen from "./about-stablecoins-v02.generated.json";

// Public-copy adjustments only; the imported source archive stays unchanged.
export const ABOUT = {
  ...frozen,
  nav: {
    ...frozen.nav,
    type_nav: frozen.nav.type_nav.map((item) => ({
      ...item,
      label_en: item.route.endsWith("/synthetic")
        ? "Synthetic-hedged"
        : item.label_en,
    })),
  },
  regulatory: frozen.regulatory.map((stage) => ({
    ...stage,
    label_en: stage.stage === 3 ? "International standards" : stage.label_en,
  })),
  applications: frozen.applications.map((row) => ({
    ...row,
    evidence_state: row.evidence_state
      .replace(
        "Crypto trading remains a major/current dominant use",
        "Crypto trading remains the main use case",
      )
      .replace(
        "Potential/growing use case",
        "Potential or developing use case",
      ),
    why_stablecoin_may_help: row.why_stablecoin_may_help
      .replace(
        "Programmability and non-bank-hour transfer",
        "Programmability and transfers outside banking hours",
      )
      .replace(
        "Digital-native transferability",
        "Digitally native transferability",
      ),
    constraint: row.constraint
      .replace(
        "Trading volume != merchant-payment adoption",
        "Trading volume ≠ merchant-payment adoption",
      )
      .replace("Authorization", "Authorisation"),
  })),
};
export type AboutCopy = readonly [en: string, zh: string];
export type AboutFigureId = keyof typeof frozen.svg;
export type AboutRow = {
  title: AboutCopy;
  text: AboutCopy;
  sources?: string[];
};
export type AboutModule = {
  id: string;
  title: AboutCopy;
  paragraphs?: AboutCopy[];
  bullets?: AboutCopy[];
  rows?: AboutRow[];
  sources?: string[];
  note?: AboutCopy;
  figure?: { id: AboutFigureId; summary: AboutCopy };
  kind?: "timeline" | "applications" | "taxonomy" | "regulatory" | "milestones";
  links?: { href: string; label: AboutCopy }[];
};
export type AboutPage = {
  title: AboutCopy;
  lead?: AboutCopy;
  modules: AboutModule[];
};
const link = (href: string, en: string, zh: string) => ({
  href,
  label: [en, zh] as AboutCopy,
});

export const MONEY_BOUNDARIES: AboutRow[] = [
  {
    title: ["Stablecoin", "稳定币"],
    text: [
      "Usually issued by a private entity or protocol arrangement, targeting a reference value and circulating on digital networks.",
      "通常由私人主体或协议安排发行，目标是维持某个参考价值，并在数字网络中流通。",
    ],
  },
  {
    title: ["CBDC", "央行数字货币（CBDC）"],
    text: [
      "Digital central-bank money: a liability of the central bank.",
      "中央银行发行的数字法定货币，属于央行负债。",
    ],
  },
  {
    title: ["Tokenised bank deposit", "代币化银行存款"],
    text: [
      "A digital representation of a commercial bank's deposit liability.",
      "对商业银行存款负债的数字化表示。",
    ],
  },
  {
    title: [
      "Tokenised MMF / Treasury fund share",
      "代币化货币市场 / 国债基金份额",
    ],
    text: [
      "A tokenised fund or security claim, not the stablecoin itself.",
      "代表基金份额或证券资产的 tokenised claim，不是稳定币本体。",
    ],
  },
];

export const CLASSIFICATION_WARNINGS: AboutCopy[] = [
  [
    "Decentralised does not automatically mean algorithmic.",
    "不因为“去中心化”就自动归为算法型。",
  ],
  [
    "A token named USD is not necessarily backed 1:1 by fiat reserves.",
    "不因为 token 叫“USD”就认为是 1:1 法币储备。",
  ],
  [
    "A project's historical mechanism is not a permanent classification.",
    "不因为项目过去使用某种机制，就永久沿用旧标签。",
  ],
  [
    "A yield-bearing wrapper is not identical to its underlying stablecoin.",
    "不把收益型 wrapper 与基础 stablecoin 本体混为一谈。",
  ],
];

// English details absent from the concise English Master are faithful translations
// of the Chinese Master / structured data, not additional research claims.
export const ABOUT_PAGES: Record<string, AboutPage> = {
  overview: {
    title: [
      "Understand the mechanism before the label",
      "先理解机制，再理解稳定币",
    ],
    lead: [
      "A stablecoin is a transferable digital token designed to maintain a relatively stable value against a reference asset or unit. Stability is not an intrinsic property of the token; it depends on reserves, collateral, redemption, liquidation, hedging or other stabilisation arrangements.",
      "稳定币是一类试图围绕某个参考价值保持相对稳定的可转移数字代币。美元是最常见的参考单位，但“稳定”并不是代币天然拥有的属性，而是由储备、抵押、赎回、清算、对冲或其他稳定机制共同维持。",
    ],
    modules: [
      {
        id: "four-questions",
        title: [
          "Four questions, beyond ‘pegged to $1’",
          "稳定币是什么：不只看“锚定 1 美元”",
        ],
        sources: ["SRC-STB-01", "SRC-STB-02"],
        rows: [
          {
            title: ["Reference value", "参考价值"],
            text: ["What value is it trying to track?", "它试图追踪什么？"],
          },
          {
            title: ["Economic support", "经济支撑"],
            text: [
              "What assets, positions or mechanisms support the claim and absorb losses?",
              "什么资产、头寸或机制吸收损失？",
            ],
          },
          {
            title: ["Issuance and exit", "发行与退出"],
            text: [
              "Who can mint, hold, transfer and directly redeem?",
              "谁能铸造、持有、转移和直接赎回？",
            ],
          },
          {
            title: ["Restoring the reference value", "偏离后如何恢复"],
            text: [
              "Arbitrage, redemption, liquidation, hedging or supply adjustment?",
              "靠套利、赎回、清算、对冲还是供给调整？",
            ],
          },
        ],
        figure: {
          id: "STB-D01",
          summary: [
            "Backing / collateral / hedge → mint / issuance → circulation → price deviation → stabilisation response → burn / settlement. Not every stablecoin uses every node. Ask where losses are absorbed under stress.",
            "储备 / 抵押 / 对冲 → 铸造发行 → 流通 → 价格偏离 → 稳定机制响应 → 销毁 / 结算。不是每种稳定币都会经过每个环节；重点看压力下损失由谁承担。",
          ],
        },
      },
      {
        id: "why-stablecoins",
        title: ["Why stablecoins emerged", "为什么会出现"],
        sources: ["SRC-STB-02", "SRC-STB-03"],
        paragraphs: [
          [
            "Stablecoins first addressed stable pricing and settlement in crypto markets, then expanded towards other financial and payment tasks.",
            "稳定币最初解决的是加密市场中的“稳定计价与结算”问题，随后逐步进入其他金融与支付任务。",
          ],
        ],
        bullets: [
          [
            "Cross-border transfers; merchant and business settlement",
            "跨境资金转移；商户与企业结算",
          ],
          [
            "DeFi collateral and liquidity; tokenised-asset settlement",
            "DeFi 抵押与流动性；tokenised assets 的链上结算",
          ],
          ["Machine and agentic payments", "机器 / 智能体支付等新场景"],
        ],
        note: [
          "Application ≠ adoption. A possible use case is not evidence of mass adoption.",
          "“可以用于某个场景”不等于“已经大规模采用”。",
        ],
      },
      {
        id: "money-boundaries",
        title: [
          "Different forms of digital money, different claims",
          "稳定币不是这些东西",
        ],
        sources: ["SRC-STB-02"],
        rows: MONEY_BOUNDARIES,
        figure: {
          id: "STB-D02",
          summary: [
            "Compare issuer or obligor, legal claim, redemption, backing and transfer rail. Stablecoin ≠ CBDC ≠ tokenised deposit ≠ tokenised fund share; these are distinctions, not rankings.",
            "从发行 / 负债主体、法律权利、赎回、支撑资产与转移轨道理解差别。稳定币不等于 CBDC、代币化存款或基金份额；这里区分权利，不做优劣排名。",
          ],
        },
      },
      {
        id: "next",
        title: ["Where to go next", "从哪里继续"],
        links: [
          link("/about-stablecoins/history", "History", "看历史"),
          link(
            "/about-stablecoins/types",
            "Types and mechanisms",
            "看类别与机制",
          ),
          link("/about-stablecoins/applications", "Applications", "看应用"),
          link(
            "/about-stablecoins/regulatory-evolution",
            "Regulatory evolution",
            "看监管演进",
          ),
          link("/regulatory", "Current regulation", "看当前各地监管"),
          link(
            "/regional-developments",
            "Live products in Asia",
            "看亚洲真实产品",
          ),
        ],
      },
    ],
  },
  history: {
    title: [
      "Stablecoin history is a history of mechanisms being stress-tested",
      "稳定币的历史，是稳定机制不断接受压力测试的历史",
    ],
    lead: [
      "From fiat value on-chain to crypto collateral, DeFi, algorithmic experiments and issuer regulation, the recurring questions are: what supports value, who can redeem, and who bears the stress?",
      "从把法币价值搬到链上，到加密抵押、DeFi、算法实验，再到发行人监管和跨境监测，稳定币的发展并不是简单的“规模增长”，而是一次次重新回答：价值支撑在哪里、谁能赎回、压力由谁承担。",
    ],
    modules: [
      {
        id: "causal-timeline",
        title: ["What changed at each milestone", "每次转折，改变了什么"],
        kind: "timeline",
      },
      {
        id: "lessons",
        title: ["Read the history through mechanisms", "从历程回到机制"],
        bullets: [
          [
            "Follow changes in backing, redemption and the allocation of losses—not just growth in scale.",
            "关注价值支撑、赎回和压力承担方式的变化，而不只是规模增长。",
          ],
          [
            "A historical failure explains a particular mechanism; it is not a verdict on every non-fiat stablecoin.",
            "历史失败用于解释特定机制，不代表所有非法币储备型稳定币。",
          ],
        ],
      },
      {
        id: "next",
        title: ["Continue with mechanisms", "继续理解机制"],
        links: [
          link(
            "/about-stablecoins/types",
            "Compare stabilisation mechanisms",
            "比较稳定机制",
          ),
          link(
            "/about-stablecoins/regulatory-evolution",
            "Understand regulatory evolution",
            "理解监管演进",
          ),
        ],
      },
    ],
  },
  types: {
    title: ["Mechanism before taxonomy", "与其记住标签，不如先看稳定机制"],
    lead: [
      "These five groups form a mechanism-based teaching framework, not a universally binding legal taxonomy. Categories may overlap or change as projects alter their backing, redemption structure and stabilisation mechanism.",
      "“法币储备型”“加密抵押型”“合成型”“算法型”是理解机制的入口，不是永远互斥的法律分类。项目会升级、改变抵押和赎回结构，甚至彻底迁移稳定机制。",
    ],
    modules: [
      {
        id: "three-axis-taxonomy",
        title: ["Three axes for comparison", "三轴分类法"],
        kind: "taxonomy",
        figure: {
          id: "STB-D03",
          summary: [
            "Compare economic support, exit/redemption and stabilisation. Categories may overlap or change. Classify the current mechanism—not a project's historical reputation.",
            "同时看价值支撑、退出 / 赎回路径和稳定机制。类别可以重叠或变化；按当前机制分类，不永久沿用历史标签。",
          ],
        },
      },
      {
        id: "five-groups",
        title: ["Five teaching groups", "五类机制，从这里进入"],
        rows: [
          {
            title: ["Fiat-reserve-backed", "法币储备型"],
            text: [
              "Issuer + reserve + redemption.",
              "核心是 issuer + reserve + redemption。",
            ],
          },
          {
            title: ["Crypto-collateralised", "加密资产抵押型"],
            text: [
              "Collateral + overcollateralisation + liquidation/redemption.",
              "核心是 collateral + overcollateralisation + liquidation/redemption。",
            ],
          },
          {
            title: ["Synthetic / hedged", "合成 / 对冲型"],
            text: [
              "Backing + hedge + derivatives/custody infrastructure.",
              "核心是 backing + hedge + derivatives/custody infrastructure。",
            ],
          },
          {
            title: ["Algorithmic", "算法型"],
            text: [
              "Supply, incentive and arbitrage feedback; TerraUSD is a historical failure case.",
              "核心是供给、激励和套利反馈；UST 是历史上典型的失败案例。",
            ],
          },
          {
            title: ["Hybrid & boundary cases", "混合与边界"],
            text: [
              "Mechanism migration, combined structures and adjacent forms of tokenised money.",
              "用于机制迁移、复合结构，以及与 CBDC / tokenised deposit / tokenised fund 的边界说明。",
            ],
          },
        ],
      },
      {
        id: "classification-warnings",
        title: ["Avoid these shortcuts", "不要这样分类"],
        bullets: CLASSIFICATION_WARNINGS,
      },
      {
        id: "type-nav",
        title: ["Explore a mechanism", "选择一个机制继续阅读"],
        links: ABOUT.nav.type_nav.map((n) =>
          link(n.route, n.label_en, n.label_zh),
        ),
      },
    ],
  },
  applications: {
    title: [
      "Application is not adoption",
      "应用回答“能解决什么任务”，采用回答“实际用了多少”",
    ],
    lead: [
      "This page explains financial and payment tasks. Actual volumes, user numbers, geography and channel adoption belong on the Adoption data page.",
      "这一页讲稳定币可以承担哪些金融与支付任务；真实交易量、用户规模、地区分布和渠道采用，应到 Adoption 数据页查看。",
    ],
    modules: [
      {
        id: "application-vs-adoption",
        title: [
          "Capability does not equal market adoption",
          "可以使用，不等于已经采用",
        ],
        note: [
          "Applications ask what task a stablecoin could perform. Adoption asks how much it is actually used, by whom, where and through which channel.",
          "应用回答稳定币能承担什么任务；采用回答实际用了多少、由谁使用、在哪里以及通过什么渠道使用。",
        ],
      },
      {
        id: "application-matrix",
        title: ["Tasks, benefits and constraints", "任务、作用与现实约束"],
        kind: "applications",
      },
      {
        id: "constraints",
        title: [
          "Keep the evidence boundary visible",
          "不要把潜在用途写成普遍采用",
        ],
        sources: ["SRC-STB-02", "SRC-STB-03"],
        paragraphs: [
          [
            "Current IMF evidence still identifies crypto trading as the main use case, with cross-border payments increasing. This does not establish that stablecoins have broadly replaced cards or bank transfers.",
            "当前 IMF 研究仍指出，加密交易是稳定币的主要用途；跨境支付正在增长。因此不能表述为“已经广泛取代银行卡 / 银行转账”。",
          ],
        ],
      },
      {
        id: "links",
        title: ["Move from tasks to usage evidence", "从应用走向真实使用证据"],
        links: [
          link("/market-data/adoption", "Actual adoption data", "实际采用数据"),
          link(
            "/agentic-payments",
            "Agentic payments: authorisation and payment rails",
            "智能体支付：授权与支付轨道",
          ),
        ],
      },
    ],
  },
  "regulatory-evolution": {
    title: [
      "From risk perimeter to issuer, redemption and systemic oversight",
      "稳定币监管正在从“风险提示”转向“发行、赎回与系统性监督”",
    ],
    lead: [
      "This page explains how regulatory logic developed, not what each jurisdiction permits today. Current jurisdiction-level status remains in the independent regulation section.",
      "这一页解释监管逻辑怎样变化，不承担“今天哪个国家允许什么”的实时比较任务。当前制度状态请进入独立监管栏目。",
    ],
    modules: [
      {
        id: "five-stages",
        title: ["Five shifts in regulatory focus", "监管重点的五次转变"],
        kind: "regulatory",
        figure: {
          id: "STB-D04",
          summary: [
            "Risk perimeter → stability obligations → international standards → dedicated issuer regimes → systemic and cross-border monitoring. These are stages of regulatory logic, not a current country ranking.",
            "风险与边界 → 稳定性义务 → 国际共同基准 → 专门发行人制度 → 系统性与跨境监测。这里解释监管逻辑的演进，不是当前国家排名。",
          ],
        },
      },
      {
        id: "milestones",
        title: ["Dated regulatory anchors", "制度演进的时间坐标"],
        kind: "milestones",
      },
      {
        id: "current-regulation-links",
        title: [
          "For current rules and live products",
          "查看现行规则与真实产品",
        ],
        links: [
          link("/regulatory", "Current regulatory comparison", "当前监管比较"),
          link(
            "/regional-developments",
            "Asian regimes and live products",
            "亚洲制度与真实产品",
          ),
        ],
      },
    ],
  },
  "fiat-backed": {
    title: [
      "Fiat-reserve-backed: reserves and redemption mechanisms",
      "法币储备型：稳定来自“可兑现的储备 + 赎回机制”",
    ],
    modules: [
      {
        id: "mechanism",
        title: ["How it works", "机制如何运转"],
        sources: ["SRC-STB-01", "SRC-STB-07", "SRC-STB-10"],
        figure: {
          id: "STB-D05",
          summary: [
            "Fiat/reserve assets → authorised issuer receives funds → mint → secondary circulation → eligible customer redeems → token burn and reserve payout. Secondary holders are not necessarily direct issuer customers.",
            "法币 / 储备资产 → 获授权发行人接收资金或资产 → 铸造 → 二级市场流通 → 符合资格的客户赎回 → 销毁并支付储备。二级持有人不等于直接发行人客户。",
          ],
        },
      },
      {
        id: "peg",
        title: ["Why the peg can hold", "为什么锚定可能维持"],
        paragraphs: [
          [
            "When primary-market participants can mint and redeem near par, secondary-market deviations can create an arbitrage incentive.",
            "如果一级市场参与者可以接近面值铸造 / 赎回，二级市场偏离就会产生套利动机。",
          ],
        ],
        note: [
          "Reserve backing does not mean every holder has identical direct issuer redemption access.",
          "储备支持，不等于每个持有人都拥有相同的直接发行人赎回权。",
        ],
      },
      {
        id: "inspection-checklist",
        title: ["What to inspect", "要检查什么"],
        bullets: [
          ["Reserve composition and liquidity", "储备构成与流动性"],
          [
            "Custodian/bank structure and the holder's legal claim",
            "托管人 / 银行结构与持有人的法律权利",
          ],
          [
            "Direct redemption eligibility, timing, fees and minimums",
            "直接赎回资格、时间、费用和最低限额",
          ],
          [
            "Disclosure, assurance and secondary-market liquidity",
            "披露、鉴证与二级市场流动性",
          ],
        ],
        note: ["Attestation ≠ audit.", "鉴证不等于审计。"],
      },
      {
        id: "examples",
        title: [
          "Current teaching examples—not recommendations",
          "当前教学案例，不是产品推荐",
        ],
        rows: [
          {
            title: ["USDC", "USDC"],
            text: [
              "Circle describes highly liquid cash and cash-equivalent backing and 1:1 redemption. Direct Circle Mint access is institutional, not for individuals or small businesses; other users typically access USDC via exchanges and wallets.",
              "Circle 表示 USDC 由高流动性的现金与现金等价资产支持并可按 1:1 赎回。Circle Mint 的直接 mint/redeem 面向机构，不面向个人和小企业；普通用户通常通过交易所、钱包等渠道获得。",
            ],
            sources: ["SRC-STB-07", "SRC-STB-08"],
          },
          {
            title: ["USDT", "USDT"],
            text: [
              "Tether states that its tokens are pegged 1:1 to their corresponding fiat currencies and backed by reserves.",
              "Tether 表示 Tether tokens 与对应法币 1:1 挂钩并由储备支持。",
            ],
            sources: ["SRC-STB-10"],
          },
          {
            title: ["PYUSD", "PYUSD"],
            text: [
              "PayPal USD is issued by Paxos. PayPal describes backing comprising US dollar deposits, short-term US Treasuries and similar cash equivalents, with 1:1 buying and selling.",
              "PayPal USD 由 Paxos 发行，PayPal 表示其储备包括美元存款、短期美国国债及类似现金等价物，并可 1:1 买卖。",
            ],
            sources: ["SRC-STB-11"],
          },
        ],
      },
      {
        id: "risks",
        title: ["Where the risks sit", "风险在哪里"],
        bullets: [
          [
            "Reserve, bank, custody, issuer and legal risk",
            "储备、银行、托管、发行人和法律风险",
          ],
          [
            "Compliance, redemption, operations and market liquidity",
            "合规、赎回、运营和市场流动性风险",
          ],
        ],
      },
    ],
  },
  "crypto-backed": {
    title: [
      "Crypto-collateralised: overcollateralisation and liquidation absorb volatility",
      "加密抵押型：用超额抵押与清算抵御高波动资产风险",
    ],
    modules: [
      {
        id: "mechanism",
        title: ["How it works", "机制如何运转"],
        sources: ["SRC-STB-13", "SRC-STB-14", "SRC-STB-15"],
        figure: {
          id: "STB-D06",
          summary: [
            "Crypto collateral → borrowing position → stablecoin debt → changing collateral ratio → liquidation if unsafe. Redemption and market arbitrage separately support the peg; solvency and price stability are not the same question.",
            "加密抵押品 → 借款仓位 → 铸造稳定币债务 → 抵押率变化 → 不安全时清算。赎回和市场套利另行支持锚定；清偿能力与价格稳定不是同一个问题。",
          ],
        },
      },
      {
        id: "bold",
        title: [
          "Contemporary example: Liquity V2 BOLD",
          "当前案例：Liquity V2 BOLD",
        ],
        sources: ["SRC-STB-13", "SRC-STB-14", "SRC-STB-15"],
        paragraphs: [
          [
            "Liquity V2 describes BOLD as USD-pegged and overcollateralised by WETH, wstETH and rETH. BOLD can be redeemed for protocol collateral under face-value logic; undercollateralised positions are subject to liquidation.",
            "Liquity V2 将 BOLD 描述为美元锚定、超额抵押，并由 WETH、wstETH、rETH 支持；BOLD 可以按面值逻辑兑换协议抵押品，抵押不足的仓位进入清算机制。",
          ],
        ],
      },
      {
        id: "dai-history",
        title: [
          "Historical milestone: original Dai / Sai",
          "历史里程碑：原始 Dai / Sai",
        ],
        sources: ["SRC-STB-12"],
        paragraphs: [
          [
            "Maker launched Single-Collateral Dai in 2017, allowing users to deposit ETH and create Dai; the system later expanded to multiple collateral assets. This historical mechanism does not determine the current system's classification.",
            "Maker 于 2017 年推出 Single-Collateral Dai，允许用户抵押 ETH 生成 Dai，后来扩展到多抵押品体系。这里是历史机制里程碑，不据此推断当前系统的纯粹分类。",
          ],
        ],
      },
      {
        id: "stress-path",
        title: ["Stability is not free", "稳定不是没有代价"],
        paragraphs: [
          [
            "Overcollateralisation reduces capital efficiency. During a sharp fall, the system depends on oracles, liquidators, stability pools or auctions, blockchain capacity and collateral liquidity.",
            "超额抵押的代价是资本效率较低；极端下跌时系统依赖预言机、清算人、稳定池 / 拍卖、区块链容量和抵押品流动性。",
          ],
        ],
      },
      {
        id: "risks",
        title: ["Where the risks sit", "风险在哪里"],
        bullets: [
          [
            "Collateral crashes, oracle failure, liquidation congestion and bad debt",
            "抵押品暴跌、预言机失效、清算拥堵与坏账",
          ],
          [
            "Smart-contract, liquidity, governance and parameter risk",
            "智能合约、流动性、治理与参数风险",
          ],
        ],
        note: [
          "Decentralised does not mean risk-free, and crypto-collateralised does not mean algorithmic.",
          "去中心化不等于没有风险；加密资产抵押型也不等于算法型。",
        ],
      },
    ],
  },
  synthetic: {
    title: [
      "Synthetic / hedged: inspect the hedge, not just the assets",
      "合成型：稳定不仅看“持有什么”，还要看“如何对冲”",
    ],
    modules: [
      {
        id: "mechanism",
        title: ["How it works", "机制如何运转"],
        sources: ["SRC-STB-16", "SRC-STB-17"],
        figure: {
          id: "STB-D07",
          summary: [
            "Backing assets + offsetting derivatives hedge → synthetic dollar exposure. Funding, basis, PnL and custody require continuous management; eligible counterparties and secondary holders use distinct access lanes.",
            "支撑资产 + 抵消风险的衍生品对冲 → 合成美元暴露。资金费率、基差、损益和托管需要持续管理；合格直接交易对手与二级持有人的准入路径不同。",
          ],
        },
      },
      {
        id: "usde",
        title: ["Example: Ethena USDe", "案例：Ethena USDe"],
        sources: ["SRC-STB-16", "SRC-STB-17"],
        paragraphs: [
          [
            "Ethena describes USDe's stability as supported by protocol-held assets and delta-hedging derivatives positions. Economic backing and hedge effectiveness must be assessed together.",
            "Ethena 表示 USDe 的稳定性由协议持有资产与 delta-hedging derivatives positions 支持；资产支撑与对冲效果需要一起看。",
          ],
        ],
      },
      {
        id: "rights",
        title: [
          "Holding is not direct mint/redeem eligibility",
          "持有不等于直接铸造 / 赎回资格",
        ],
        sources: ["SRC-STB-18"],
        paragraphs: [
          [
            "Direct minting and redemption require KYC/KYB and whitelisting. Secondary holders do not have the same rights as eligible direct counterparties.",
            "直接 mint/redeem 需要 KYC/KYB 并进入白名单；普通 holding user 与 direct mint user 的权利不同。",
          ],
        ],
      },
      {
        id: "risk-stack",
        title: ["What the hedge depends on", "对冲机制依赖什么"],
        bullets: [
          ["Backing value and hedge effectiveness", "支撑资产价值与对冲效果"],
          [
            "Derivative liquidity, funding and basis",
            "衍生品流动性、资金费率与基差",
          ],
          [
            "Exchange settlement, counterparties and custody architecture",
            "交易所结算、交易对手与托管架构",
          ],
          [
            "Hedge execution, liquidity and redemption access",
            "对冲执行、流动性与赎回准入",
          ],
        ],
      },
      {
        id: "boundary",
        title: ["Keep the mechanism distinction", "明确机制边界"],
        note: [
          "Synthetic / hedged is not the same as a classic endogenous algorithmic stablecoin. It does not simply mean ‘unbacked’.",
          "合成 / 对冲型不等于经典内生算法稳定币，也不是简单“没有资产支撑”。",
        ],
      },
    ],
  },
  algorithmic: {
    title: [
      "Algorithmic: confidence and endogenous arbitrage can reinforce stress",
      "算法型：当稳定依赖信心和内生套利，压力可能自我强化",
    ],
    modules: [
      {
        id: "mechanism",
        title: ["The intended stabilisation loop", "原本设计的稳定循环"],
        paragraphs: [
          [
            "Below-target stablecoin → arbitrage purchase → conversion/burn against an endogenous token → supply adjustment → intended return to peg.",
            "稳定币低于目标价格 → 套利买入 → 与内生 token 兑换 / 销毁 → 供给调整 → 预期恢复锚定。",
          ],
        ],
        sources: ["SRC-STB-21"],
      },
      {
        id: "death-spiral",
        title: ["When the stress loop takes over", "当压力循环反过来强化"],
        figure: {
          id: "STB-D08",
          summary: [
            "Confidence falls → stablecoin selling → endogenous token issuance → token price falls → arbitrage capacity and confidence weaken → more selling. TerraUSD is a historical failure case, not a universal description of non-fiat stablecoins.",
            "信心下降 → 稳定币抛售 → 内生 token 增发 → token 价格下跌 → 套利能力和信心减弱 → 更多抛售。TerraUSD 是历史失败案例，不是所有非法币稳定币的共同描述。",
          ],
        },
      },
      {
        id: "ust-case",
        title: ["Historical case: TerraUSD", "历史案例：TerraUSD"],
        sources: ["SRC-STB-21"],
        paragraphs: [
          [
            "BIS documents UST's convertibility into $1 worth of LUNA. In May 2022, collapsing confidence drove UST conversions into newly minted LUNA, further depressing LUNA's price and creating a death spiral.",
            "BIS 记录显示，UST 依赖与 LUNA 之间的 1 美元价值兑换与套利。2022 年 5 月信心崩溃后，大量 UST 换成新铸 LUNA，LUNA 价格进一步下跌，机制进入死亡螺旋。",
          ],
        ],
      },
      {
        id: "lessons",
        title: ["What the case teaches", "这个案例说明什么"],
        paragraphs: [
          [
            "If the stabilising asset depends on confidence in the same ecosystem, the mechanism can become reflexive precisely when it is under stress.",
            "稳定机制如果依赖一个与系统信心高度共振的内生资产，就可能在压力下出现反身性。",
          ],
        ],
      },
      {
        id: "boundary",
        title: [
          "A mechanism/history category, not an endorsement",
          "这是机制与历史分类，不是推荐",
        ],
        bullets: [
          [
            "UST is a classic failure case, not a proxy for every non-reserve-backed stablecoin.",
            "UST 是经典失败案例，不代表所有非储备型 stablecoin。",
          ],
          ["Algorithmic ≠ decentralised.", "算法型不等于去中心化。"],
          [
            "Crypto-collateralised designs have overcollateralisation and liquidation; they must not be conflated with the UST model.",
            "加密资产抵押型有真实超额抵押与清算机制，不能与 UST 模式混为一谈。",
          ],
        ],
      },
    ],
  },
  other: {
    title: [
      "Classify today's mechanism, not the project's historical reputation",
      "混合与边界：产品名称不重要，今天的经济机制才重要",
    ],
    modules: [
      {
        id: "mechanism-migration",
        title: ["Mechanisms can change", "为什么需要这一页"],
        paragraphs: [
          [
            "Projects can change reserve assets, move from algorithms to reserves, add RWA/tokenised Treasuries or redemption modules, and change governance or issuer structures. Classification must change with the mechanism.",
            "真实项目会更换储备资产、从算法机制转向资产储备、引入 RWA / tokenised Treasuries、增加 PSM / redemption modules，或改变治理与发行主体。所以分类必须随机制变化。",
          ],
        ],
      },
      {
        id: "frxusd",
        title: ["Current mechanism example: frxUSD", "当前机制案例：frxUSD"],
        sources: ["SRC-STB-19", "SRC-STB-20"],
        paragraphs: [
          [
            "Frax currently describes frxUSD as fiat-redeemable and fully collateralised with permitted cash-equivalent/tokenised-Treasury reserves. An older FRAX-era label is not a description of the current token mechanism.",
            "Frax 当前将 frxUSD 描述为可法币赎回、fully collateralised，并由 permitted cash-equivalent reserves / tokenised Treasury funds 支持。不能因为一个品牌历史上采用过另一种稳定机制，就用旧标签描述当前 token。",
          ],
        ],
      },
      {
        id: "adjacent-money",
        title: [
          "Adjacent assets are not automatically stablecoins",
          "边界资产不是自动归入稳定币",
        ],
        sources: ["SRC-STB-02"],
        rows: [
          ...MONEY_BOUNDARIES.slice(1),
          {
            title: ["Yield-bearing wrapper", "收益型 wrapper"],
            text: [
              "A staking or yield receipt may carry economic rights different from the underlying stablecoin.",
              "例如某些 stablecoin 的质押 / 收益凭证，经济权利可能与基础 stablecoin 不同。",
            ],
          },
        ],
        figure: {
          id: "STB-D09",
          summary: [
            "Separate mechanism migration from adjacent digital-money claims. Current frxUSD illustrates a reserve-backed/fiat-redeemable mechanism under current documentation; CBDCs, deposits, fund shares and wrappers remain distinct.",
            "把机制迁移与相邻数字货币权利分开。当前文档中的 frxUSD 用于说明储备支持 / 法币赎回机制；CBDC、存款、基金份额和收益凭证需要另行区分。",
          ],
        },
      },
      {
        id: "checklist",
        title: ["Before assigning a label, ask", "最终判断清单"],
        bullets: [
          [
            "Redeemable against what—and by whom?",
            "可赎回为什么资产？由谁赎回？",
          ],
          ["On what terms?", "按照什么条件？"],
          ["What absorbs losses?", "由什么吸收损失？"],
          ["What restores the peg?", "由什么恢复锚定？"],
          ["What happens under stress?", "压力下会发生什么？"],
        ],
      },
    ],
  },
};

export const HISTORY_CHANGE_EN = [
  "Fiat-denominated value becomes transferable on-chain.",
  "On-chain overcollateralisation and liquidation become a stablecoin issuance mechanism.",
  "Reserve transparency, compliant issuance and open-blockchain circulation become an important product route.",
  "Stablecoins become foundational assets for liquidity, collateral, lending and on-chain settlement.",
  "Runs and death spirals in reflexive algorithmic mechanisms become a key case study.",
  "Governance, risk management, redemption and cross-border coordination gain a common international framework.",
  "The EU enters a dedicated stablecoin issuance and supervisory framework.",
  "Regulation turns towards issuer eligibility, reserves, redemption and supervision.",
  "The UK advances systemic stablecoin rules; FSB deepens cross-border vulnerability analysis and data monitoring.",
] as const;

export const APPLICATION_ZH = [
  [
    "加密交易与结算",
    "在高波动加密资产之间提供稳定计价、交易和结算资产。",
    "24/7 可转移的结算资产。",
    "加密交易仍是当前主要用途。",
    "交易量不等于商户支付采用。",
  ],
  [
    "DeFi 抵押、借贷与流动性",
    "借贷、抵押、AMM 配对、保证金和可编程金融。",
    "可组合的链上资产。",
    "已融入加密 / DeFi 市场结构。",
    "智能合约、预言机、清算与流动性风险。",
  ],
  [
    "跨境转移与汇款",
    "跨境发送稳定价值。",
    "可能减少部分中间环节，并提供 24/7 轨道。",
    "使用正在增长。",
    "出入金、汇兑、合规与本地结算仍很关键。",
  ],
  [
    "企业资金与 B2B 结算",
    "供应商付款、内部资金调拨与跨时区结算。",
    "可编程，并可在银行营业时间之外转移。",
    "潜在 / 发展中的用途。",
    "会计、税务、对手方接受度和银行出入金。",
  ],
  [
    "商户 / P2P 支付",
    "零售或个人间付款。",
    "数字原生的可转移性。",
    "潜在用途，取决于所在法域。",
    "接受度、费用、用户保护、争议 / 退款。",
  ],
  [
    "代币化资产结算",
    "为基金、证券和资产提供链上现金腿。",
    "在数字轨道协调资产与结算。",
    "新兴用途。",
    "券款对付、法律权利、准入资格和互操作性。",
  ],
  [
    "机器 / 智能体支付",
    "API、智能体、条件式与小额支付轨道。",
    "可选的 24/7 可编程轨道。",
    "新兴基础设施用途。",
    "授权、责任与信任是需要另行解决的问题。",
  ],
] as const;

export const TYPE_AXES_ZH = [
  ["现金 / 国债 / 储备资产", "发行人或获授权的赎回", "一级赎回 + 套利"],
  [
    "链上加密抵押品",
    "协议赎回和 / 或偿还债务",
    "超额抵押 + 清算 + 赎回 / 套利",
  ],
  [
    "支撑资产 + 衍生品对冲",
    "直接铸造 / 赎回常受限，二级准入更广",
    "Delta 对冲 + 铸造 / 赎回 + 市场流动性",
  ],
  [
    "内生 token / 供给激励机制",
    "依具体机制进行兑换 / 套利",
    "供给调整 + 内生套利",
  ],
  ["混合或演变中的支撑", "多条 / 变化中的路径", "多机制组合或机制迁移"],
] as const;

export const REGULATORY_FOCUS_ZH = [
  ["法律分类", "消费者 / 投资者风险", "反洗钱 / 反恐融资", "金融稳定"],
  ["储备质量", "托管", "赎回", "治理", "披露", "运营韧性"],
  ["FSB 2023", "跨境协调", "及时赎回", "有效稳定机制"],
  ["MiCA", "GENIUS Act", "香港", "英国"],
  ["实施差距", "系统性支付用途", "跨境脆弱性", "数据监测"],
] as const;
export const REGULATORY_SOURCES = [
  [],
  [],
  ["SRC-STB-04"],
  ["SRC-STB-23", "SRC-STB-24", "SRC-STB-25", "SRC-STB-26"],
  ["SRC-STB-05", "SRC-STB-06"],
];
