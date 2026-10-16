import frozen from "./home-research-v02.generated.json";

export const HOME_RESEARCH = frozen;
export type ResearchStatus = keyof typeof frozen.labels;
export type HubCopy = readonly [en: string, zh: string];
export const PUBLIC_SUPPORT_LINE: HubCopy = [
  "Sponsored by the Academy of Internet Finance (AIF), Zhejiang University.",
  "由浙江大学金融科技研究院（AIF）支持。",
];
export const RESEARCH_BOUNDARY: HubCopy = [
  "The website does not currently provide real-time depeg-probability estimates or a production-grade early-warning score.",
  "当前网站不提供“实时脱锚概率”或已验证的生产级风险预警评分。",
];
export const TAXONOMY_BOUNDARY: HubCopy = [
  "The number 55 refers to the conceptual taxonomy. It does not imply that 55 variables are entered directly into a single empirical model.",
  "55 项风险是概念分解结果，不等于当前量化模型直接使用 55 个节点。",
];
export const QUESTIONS: { href: string; title: HubCopy; detail: HubCopy }[] = [
  {
    href: "/about-stablecoins",
    title: ["How do stablecoins maintain value?", "稳定币到底如何维持价格？"],
    detail: [
      "Understand reserves, collateral, redemption, arbitrage, liquidation and different stability mechanisms.",
      "理解储备、抵押、赎回、套利、清算和不同稳定机制。",
    ],
  },
  {
    href: "/regional-developments",
    title: [
      "Which stablecoins are actually live in Asia?",
      "亚洲哪些稳定币已经真正上线？",
    ],
    detail: [
      "Separate policy permission, issuer licences, token launches, distribution channels and current user access.",
      "区分政策允许、发行人牌照、token 上线、分销渠道和当前用户准入。",
    ],
  },
  {
    href: "/agentic-payments",
    title: [
      "Can AI agents really pay on a user's behalf?",
      "AI 真的能替用户付款吗？",
    ],
    detail: [
      "Understand agent identity, authorisation, control of funds, payment protocols and stablecoin rails.",
      "理解 Agent 的身份、授权、资金控制、支付协议与 stablecoin rail。",
    ],
  },
  {
    href: "/market-data",
    title: [
      "What is happening in markets and on-chain activity?",
      "当前市场和链上发生了什么？",
    ],
    detail: [
      "Inspect supply, price stability, on-chain activity, issuer reserves, macro conditions and adoption evidence.",
      "查看供应、价格稳定性、链上活动、发行人储备、宏观环境和采用证据。",
    ],
  },
  {
    href: "/research",
    title: [
      "How do stablecoin risks form and propagate?",
      "稳定币风险怎样形成并传播？",
    ],
    detail: [
      "Explore the risk framework, quantitative transmission research and the current state of the research.",
      "进入课题组的风险框架、量化传导研究和研究状态。",
    ],
  },
];
export const RECORD_LINKS: Record<string, string> = {
  "risk-framework": "/research#55-risk-framework",
  "asia-research": "/regional-developments",
  "agentic-payments": "/agentic-payments",
};
export const MATURITY: {
  title: HubCopy;
  status?: ResearchStatus;
  items: HubCopy[];
}[] = [
  {
    title: ["Completed / public", "已完成 / 可公开查看"],
    items: [
      ["55-risk conceptual framework", "全生命周期 55 项风险概念框架"],
      ["AI-DEFIT 2026 paper and presentation", "AI-DEFIT 2026 会议论文与汇报"],
      ["Asia Stablecoin Development", "亚洲稳定币发展专题"],
      ["Agentic Payments", "智能体支付专题"],
    ],
  },
  {
    title: ["Interim empirical results", "中期实证结果"],
    status: "INTERIM_EMPIRICAL_RESULTS",
    items: [
      ["Measurable risk indicators and nodes", "风险指标与可量化节点构建"],
      [
        "Transfer Entropy transmission analysis",
        "Transfer Entropy 风险传导网络",
      ],
      ["Multivariate Hawkes event dynamics", "多元 Hawkes 极端事件互激"],
      [
        "Interim stress-scenario and historical-event results",
        "压力情景与历史事件的阶段结果",
      ],
    ],
  },
  {
    title: ["Validation in progress", "验证进行中"],
    status: "VALIDATION_IN_PROGRESS",
    items: [
      ["Robustness", "稳健性"],
      ["Reproducibility", "可复现性"],
      ["Out-of-sample evaluation", "样本外评估"],
      ["Event interpretation", "事件解释"],
    ],
  },
  {
    title: ["Planned", "未来计划"],
    status: "PLANNED",
    items: [
      ["Continuous monitoring interface", "持续风险监测界面"],
      ["Interpretable warning signals", "可解释的预警信号"],
      ["Regulatory coverage mapping", "更系统的监管覆盖映射"],
      ["Integrated research and market data", "动态市场与研究数据整合"],
    ],
  },
];
export const PIPELINE: {
  title: HubCopy;
  stage: HubCopy;
  detail: HubCopy;
  status?: ResearchStatus;
}[] = [
  {
    title: ["Conceptual framework", "概念框架"],
    stage: ["Completed", "已完成"],
    status: "COMPLETED_CONCEPTUAL_OUTPUT",
    detail: [
      "Identify and organise financial, institutional, technical, governance and DeFi risks.",
      "识别并组织稳定币的金融、制度、技术、治理和 DeFi 风险。",
    ],
  },
  {
    title: ["Measurement design", "测量设计"],
    stage: [
      "Core design established; refinement ongoing",
      "已完成主要设计 / 持续修订",
    ],
    detail: [
      "Translate conceptual risks into defensible, accessible and comparable indicators and empirical nodes.",
      "把概念风险转化为可辩护、可获取、可比较的量化指标与研究节点。",
    ],
  },
  {
    title: ["Audited data", "经审计的研究数据"],
    stage: ["Audited research data pipeline established", "已建立研究数据链"],
    detail: [
      "Acquire and audit data on issuance, reserves, redemption, on-chain activity, protocol mechanisms, macro and market variables.",
      "围绕发行、储备、赎回、链上活动、协议机制、宏观与市场变量进行数据获取和审计。",
    ],
  },
  {
    title: ["Transmission models", "传导模型"],
    stage: ["Interim empirical results", "已有中期实证结果"],
    status: "INTERIM_EMPIRICAL_RESULTS",
    detail: [
      "Transfer Entropy analyses directed, time-varying risk-signal transmission; multivariate Hawkes analyses self- and cross-excitation of extreme events.",
      "Transfer Entropy 用于识别有向、时变的风险信号传导；多元 Hawkes 用于分析极端事件的自激与交叉激发。",
    ],
  },
  {
    title: ["Validation", "验证"],
    stage: ["In progress", "正在收口"],
    status: "VALIDATION_IN_PROGRESS",
    detail: [
      "Historical events, stress scenarios, out-of-sample performance, robustness and local reproducibility still require validation.",
      "历史事件、压力情景、样本外表现、稳健性与本地可复现性仍需继续验证。",
    ],
  },
  {
    title: ["Monitoring / early warning", "持续监测 / 早期预警"],
    stage: ["Planned", "未来计划"],
    status: "PLANNED",
    detail: [
      "Continuous monitoring and interpretable warnings follow only once measurement, modelling and validation are sufficiently stable.",
      "只有当测量、模型与验证链条足够稳定后，才进入持续监测和可解释预警。",
    ],
  },
];
export const QUANTITATIVE: {
  title: HubCopy;
  question: HubCopy;
  result: HubCopy;
  boundary: HubCopy;
  status: ResearchStatus;
}[] = [
  {
    title: ["Transfer Entropy", "Transfer Entropy"],
    question: [
      "Which risk signals lead and transmit to other risk states?",
      "哪些风险信号会领先并传导到其他风险状态？",
    ],
    result: [
      "Interim results have been produced for directed, time-varying transmission among measured risk signals.",
      "已有中期实证结果包；网络表现为稀疏、集中且随时间变化。",
    ],
    boundary: [
      "Research-stage transmission analysis, not a real-time causal graph or production monitoring network.",
      "属于研究阶段的传导分析，不是实时因果图或生产监测网络。",
    ],
    status: "INTERIM_EMPIRICAL_RESULTS",
  },
  {
    title: ["Multivariate Hawkes", "多元 Hawkes"],
    question: [
      "Does one type of extreme risk event increase the short-term conditional intensity of other risk events?",
      "某类极端风险事件是否会增加其他风险事件在短期内发生的条件强度？",
    ],
    result: [
      "Interim model fits and cross-excitation patterns have been obtained, while out-of-sample performance and interpretation still require further validation.",
      "已有中期拟合结果与交叉激发结构，但样本外表现和解释仍需谨慎验证。",
    ],
    boundary: [
      "Not a validated real-time prediction model.",
      "不是已验证的实时预测模型。",
    ],
    status: "INTERIM_EMPIRICAL_RESULTS",
  },
  {
    title: ["Stress scenarios & historical events", "压力情景与历史事件"],
    question: [
      "How do risks amplify under joint macro and crypto-market stress, and do historical depeg/liquidation events support the model interpretation?",
      "在宏观与加密市场共同压力下，风险会沿哪些路径被放大？历史脱锚 / 清算事件能否支持模型解释？",
    ],
    result: [
      "Interim stress-scenario and historical case-study results have been produced; reproducibility and integrated validation remain in progress.",
      "已有阶段性情景和案例结果；完整本地复现与整合验证仍在继续。",
    ],
    boundary: [
      "Research and validation evidence, not a deployed stress-testing service.",
      "属于研究与验证证据，不是已部署的压力测试服务。",
    ],
    status: "INTERIM_RESEARCH_RESULTS",
  },
];
export const SCREENING: HubCopy[] = [
  ["Economic construct", "经济含义"],
  ["Measurable proxy", "可测量性"],
  ["Data quality", "数据质量"],
  ["Time frequency", "时间频率"],
  ["Comparability across nodes", "节点之间的可比较性"],
];
export const NEXT_STAGE: HubCopy[] = [
  ["Measurement validity", "测量有效性"],
  ["Data reproducibility", "数据可复现性"],
  ["Robustness", "稳健性"],
  ["Out-of-sample validation", "样本外验证"],
  ["Event interpretation", "事件解释"],
  ["Stress-scenario consistency", "压力情景一致性"],
];
export const EVIDENCE_KINDS: HubCopy[] = [
  ["Official rule", "官方规则"],
  ["Licence", "发行人牌照"],
  ["Product launch", "产品上线"],
  ["Beta / pilot", "Beta / 试点"],
  ["Distribution", "分销渠道"],
  ["Observed adoption", "可观测采用"],
  ["Research inference", "研究推断"],
];
