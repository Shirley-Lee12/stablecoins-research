import current from "./home-research-v02.generated.json";
import {
  LIFECYCLE,
  AMPLIFICATION,
  MODULES,
  FUTURE,
  DISTINCTIONS,
} from "./conference-risk-framework";
export const HOME_RESEARCH = current;
export type HubCopy = readonly [en: string, zh: string];
export type ResearchStatus = keyof typeof current.labels;
export { LIFECYCLE, AMPLIFICATION, MODULES, FUTURE, DISTINCTIONS };
export const PUBLIC_SUPPORT_LINE: HubCopy = [
  "Sponsored by the Academy of Internet Finance (AIF), Zhejiang University.",
  "由浙江大学金融科技研究院（AIF）支持。",
];
export const RESEARCH_BOUNDARY: HubCopy = [
  "Future extensions are not existing results and are not yet implemented. They do not constitute a validated model or a live monitoring product.",
  "未来延展不是既有成果，尚未实施，不构成已经验证的模型或运行中的监测产品。",
];
export const TAXONOMY_BOUNDARY: HubCopy = [
  "55 is the submitted-framework count. The examples shown here are representative risks from the conference study, not a reconstructed complete list.",
  "55 是已提交框架的风险数量。这里仅展示会议研究提供的代表性风险，不补造完整名单。",
];
export const ATOMIC_BOUNDARY: HubCopy = [
  "Atomic does not mean causally or statistically independent. Risks can interact, amplify one another and transmit across systems.",
  "Atomic 不表示因果独立或统计独立。风险仍可相互作用、放大其他风险，并跨系统传导。",
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
      "Explore the conference study, atomic-risk concept and two complementary analytical mappings.",
      "了解会议研究、atomic-risk 概念与两个互补的分析维度。",
    ],
  },
];
export const RECORD_LINKS: Record<string, string> = {
  "risk-framework": "/quantitative",
  "conference-paper": "/research#conference-paper",
};
export const RESEARCH_RECORDS: {
  id: string;
  title: HubCopy;
  summary: HubCopy;
  boundary: HubCopy;
  status: ResearchStatus;
}[] = [
  {
    id: "risk-framework",
    title: [
      "2026 · Multi-dimensional stablecoin risk framework",
      "2026 · 稳定币多维风险框架",
    ],
    summary: [
      "55 atomic risks in the submitted framework, with T0–T3 lifecycle mapping and L0–L3 amplification/transmission mapping.",
      "已提交框架中的 55 个 atomic risks，具有 T0–T3 生命周期映射与 L0–L3 放大 / 传导映射。",
    ],
    boundary: TAXONOMY_BOUNDARY,
    status: "CURRENT_STUDY",
  },
  {
    id: "conference-paper",
    title: [
      "2026 · AI-DEFIT accepted conference paper",
      "2026 · AI-DEFIT 已接收会议论文",
    ],
    summary: [current.study.title, current.study.title],
    boundary: [
      "The accepted conference study contributes conceptual decomposition and mapping.",
      "已接收的会议研究贡献是概念风险拆解与映射。",
    ],
    status: "ACCEPTED_CONFERENCE_PAPER",
  },
];
export const FRAMEWORK_STEPS: HubCopy[] = [
  ["Stablecoin system", "稳定币系统"],
  ["Presentation-level risk modules", "展示层风险模块"],
  ["Atomic risk units", "最小有用风险单元"],
  ["Two-dimensional mapping", "二维映射"],
];
export const CONTRIBUTIONS: HubCopy[] = [
  [
    "Distinguish common financial risks from risks tied to stablecoin architecture and operation.",
    "区分一般金融风险与稳定币架构和运行特有的风险。",
  ],
  [
    "Define minimum useful risk units with clear conceptual boundaries.",
    "定义概念边界清晰的最小有用风险单元。",
  ],
  [
    "Combine full-lifecycle location with amplification and transmission roles.",
    "结合全生命周期位置与风险放大、传导角色。",
  ],
  [
    "Provide a conceptual foundation for future measurement and comparative regulatory analysis.",
    "为未来测量与比较监管分析建立概念基础。",
  ],
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
export const EVIDENCE_LINKS: { href: string; title: HubCopy }[] = [
  { href: "/regulatory", title: ["Regulatory overview", "监管概览"] },
  { href: "/market-data", title: ["Market data", "市场数据"] },
  { href: "/academic-resources", title: ["Research library", "研究资源库"] },
  { href: "/experts", title: ["Researchers & institutions", "研究者与机构"] },
];
