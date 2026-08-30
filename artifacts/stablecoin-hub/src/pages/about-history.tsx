import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLanguage } from "@/lib/language-context";
import { ContentEdgeNav } from "@/components/content-edge-nav";
import {
  ArrowRight,
  Banknote,
  Blocks,
  ExternalLink,
  GitMerge,
  Landmark,
  Network,
  RefreshCcw,
  ShieldAlert,
  Waypoints,
} from "lucide-react";

type Source = {
  label: string;
  title: string;
  url: string;
};

type HistoryEvent = {
  date: string;
  titleEn: string;
  titleZh: string;
  summaryEn: string;
  summaryZh: string;
  meaningEn: string;
  meaningZh: string;
  tagsEn: string[];
  tagsZh: string[];
  sources: Source[];
};

type HistoryPhase = {
  id: string;
  range: string;
  titleEn: string;
  titleZh: string;
  thesisEn: string;
  thesisZh: string;
  color: string;
  events: HistoryEvent[];
};

type MarketSnapshot = {
  source: "DefiLlama";
  sourceUrl: string;
  refreshedAt: string;
  projects: Array<{
    status: "active" | "historical";
    currentMarketCapUsd: number;
  }>;
};

const PHASES: HistoryPhase[] = [
  {
    id: "foundations",
    range: "Before 2008",
    titleEn: "Monetary Precedents",
    titleZh: "货币与制度前史",
    thesisEn: "Stablecoins did not invent private money or par redemption. They recombined older monetary promises with a new settlement rail.",
    thesisZh: "稳定币并未发明私人货币或按面值赎回，而是把既有的货币承诺与新的结算网络重新组合。",
    color: "#6b7280",
    events: [
      {
        date: "19th–20th c.",
        titleEn: "Private money-like claims establish the economic analogy",
        titleZh: "私人货币型债权构成经济上的类似物",
        summaryEn: "Bank deposits, currency boards, offshore dollars, and money-market fund shares all illustrate a recurring structure: a privately managed claim promises conversion at par into a more fundamental form of money.",
        summaryZh: "银行存款、货币发行局、离岸美元和货币市场基金份额都体现了反复出现的结构：私人管理的债权承诺按面值兑换为更基础的货币。",
        meaningEn: "These are analogies, not direct ancestors. They help explain reserve quality, liquidity, redemption, and run risk in modern stablecoins.",
        meaningZh: "这些是制度类似物，而非直接祖先；它们帮助解释现代稳定币的储备质量、流动性、赎回与挤兑风险。",
        tagsEn: ["par redemption", "private money", "liquidity"],
        tagsZh: ["面值赎回", "私人货币", "流动性"],
        sources: [
          { label: "BIS, 2023", title: "On par: A Money View of stablecoins", url: "https://www.bis.org/publ/work1146.htm" },
          { label: "BIS, 2024", title: "Stablecoins, money market funds and monetary policy", url: "https://www.bis.org/publ/work1219.htm" },
        ],
      },
      {
        date: "1993–2000",
        titleEn: "Electronic money separates value from physical cash",
        titleZh: "电子货币使货币价值脱离实体现金载体",
        summaryEn: "European central banks studied prepaid cards and software-based e-money in the 1990s. The EU's first e-money directive then defined electronically stored value as a claim on an issuer, issued on receipt of funds and accepted by third parties.",
        summaryZh: "欧洲中央银行在20世纪90年代研究预付卡和软件型电子货币；欧盟首部电子货币指令随后将其界定为对发行人的债权，由收到资金后发行，并可由第三方接受。",
        meaningEn: "Issuer claims, safeguarding, supervision, and par redemption were policy questions before public blockchains existed.",
        meaningZh: "早在公共区块链出现之前，发行人债权、资金保护、审慎监管和按面值赎回就已经是政策问题。",
        tagsEn: ["e-money", "issuer claim", "supervision"],
        tagsZh: ["电子货币", "发行人债权", "审慎监管"],
        sources: [
          { label: "ECB, 1998", title: "Report on electronic money", url: "https://www.ecb.europa.eu/press/pr/date/1998/html/pr980831.en.html" },
          { label: "European Union, 2000", title: "Directive 2000/46/EC", url: "https://eur-lex.europa.eu/eli/dir/2000/46/oj/eng" },
        ],
      },
    ],
  },
  {
    id: "infrastructure",
    range: "2008–2013",
    titleEn: "The Settlement Rail",
    titleZh: "链上结算基础形成",
    thesisEn: "Public blockchains made scarce digital bearer assets transferable without a central ledger operator, but their price volatility left a missing monetary layer.",
    thesisZh: "公共区块链使稀缺数字资产能够在没有中央账本运营者的情况下转移，但价格波动留下了缺失的稳定货币层。",
    color: "#3867c8",
    events: [
      {
        date: "2008–2009",
        titleEn: "Bitcoin demonstrates peer-to-peer digital settlement",
        titleZh: "比特币证明点对点数字结算可以运行",
        summaryEn: "The Bitcoin paper proposed electronic cash based on a peer-to-peer network rather than a trusted financial intermediary. The network launched in 2009.",
        summaryZh: "比特币白皮书提出以点对点网络而非受信任金融中介为基础的电子现金，网络于2009年启动。",
        meaningEn: "The breakthrough was the transfer rail and ledger architecture, not price stability. Volatility later created demand for a stable unit that could circulate on similar networks.",
        meaningZh: "突破在于转移轨道与账本架构，而非价格稳定；其波动性随后催生了对可在同类网络流通的稳定计价单位的需求。",
        tagsEn: ["distributed ledger", "bearer transfer", "volatility"],
        tagsZh: ["分布式账本", "持有人转移", "价格波动"],
        sources: [
          { label: "Nakamoto, 2008", title: "Bitcoin: A Peer-to-Peer Electronic Cash System", url: "https://bitcoin.org/en/bitcoin-paper" },
          { label: "BIS, 2025", title: "The next-generation monetary and financial system", url: "https://www.bis.org/publ/arpdf/ar2025e3.htm" },
        ],
      },
    ],
  },
  {
    id: "formation",
    range: "2014–2018",
    titleEn: "Modern Stablecoins Take Shape",
    titleZh: "现代稳定币成形",
    thesisEn: "The core designs appeared in quick succession: market-backed experiments, fiat-reserve issuers, and on-chain collateralised protocols.",
    thesisZh: "市场支持型实验、法币储备发行人与链上抵押协议相继出现，构成现代稳定币的主要设计谱系。",
    color: "#16877d",
    events: [
      {
        date: "Jul–Oct 2014",
        titleEn: "BitUSD and Tether open the modern stablecoin era",
        titleZh: "BitUSD 与 Tether 开启现代稳定币时代",
        summaryEn: "BitUSD, now inactive, was issued in July 2014. Tether followed in October 2014 with a centrally issued dollar-referenced token backed by off-chain reserves.",
        summaryZh: "现已停止运行的 BitUSD 于2014年7月发行；Tether 随后于同年10月推出由中心化主体发行、以链下储备支持的美元锚定代币。",
        meaningEn: "Two enduring branches appeared immediately: crypto-native stabilisation and issuer-managed reserve backing.",
        meaningZh: "两条延续至今的路径几乎同时出现：加密原生稳定机制与发行人管理的储备支持。",
        tagsEn: ["BitUSD", "USDT", "first wave"],
        tagsZh: ["BitUSD", "USDT", "首批项目"],
        sources: [
          { label: "BIS, 2023", title: "Will the real stablecoin please stand up?", url: "https://www.bis.org/publ/bppdf/bispap141.htm" },
          { label: "BIS, 2026", title: "The impact of stablecoins on the international monetary and financial system", url: "https://www.bis.org/publ/bppdf/bispap170.htm" },
        ],
      },
      {
        date: "Dec 2017",
        titleEn: "Dai brings overcollateralised issuance on-chain",
        titleZh: "Dai 将超额抵押发行带到链上",
        summaryEn: "MakerDAO launched the first Dai system, allowing users to generate a dollar-referenced token against ETH held in smart contracts.",
        summaryZh: "MakerDAO 推出首个 Dai 系统，允许用户以智能合约中的 ETH 为抵押生成美元锚定代币。",
        meaningEn: "Collateral monitoring, liquidation, fees, and governance could now be embedded in a protocol rather than managed only by a conventional issuer.",
        meaningZh: "抵押品监控、清算、费用和治理可以嵌入协议，而不再只能由传统发行人管理。",
        tagsEn: ["DAI", "crypto collateral", "smart contracts"],
        tagsZh: ["DAI", "加密资产抵押", "智能合约"],
        sources: [
          { label: "MakerDAO, 2017", title: "The Dai Stablecoin System", url: "https://makerdao.com/whitepaper/Dai-Whitepaper-Dec17-en.pdf" },
        ],
      },
      {
        date: "Sep 2018",
        titleEn: "USDC formalises the regulated full-reserve model",
        titleZh: "USDC 推进受监管的全额储备模式",
        summaryEn: "Circle and the CENTRE consortium launched USDC with one-to-one reserves, issuer eligibility standards, compliance controls, and monthly reserve attestations.",
        summaryZh: "Circle 与 CENTRE 联盟推出 USDC，采用一比一储备、发行人准入标准、合规控制和每月储备审验。",
        meaningEn: "Stablecoins began to look less like isolated crypto products and more like interoperable financial infrastructure with an explicit operating perimeter.",
        meaningZh: "稳定币开始不再只是孤立的加密产品，而更像具有明确运营边界、可互操作的金融基础设施。",
        tagsEn: ["USDC", "full reserve", "attestation"],
        tagsZh: ["USDC", "全额储备", "储备审验"],
        sources: [
          { label: "Circle, 2018", title: "Introducing USD Coin", url: "https://www.circle.com/blog/introducing-usd-coin" },
        ],
      },
    ],
  },
  {
    id: "scale",
    range: "2019–2021",
    titleEn: "Scale, DeFi, and Global Ambition",
    titleZh: "规模扩张、DeFi 与全球化设想",
    thesisEn: "Stablecoins became crypto's settlement asset. A global platform proposal also moved them from a niche market issue to an international policy question.",
    thesisZh: "稳定币成为加密市场的结算资产；全球平台型方案又使其从小众市场议题转变为国际政策问题。",
    color: "#8b5ca8",
    events: [
      {
        date: "Jun–Oct 2019",
        titleEn: "Libra turns stablecoins into a global policy issue",
        titleZh: "Libra 将稳定币推向全球政策议程",
        summaryEn: "Facebook's Libra proposal suggested that a technology platform could distribute a private stable-value instrument at global scale. The G7 working group responded with a cross-border assessment of legal, monetary, competition, and financial-stability risks.",
        summaryZh: "Facebook 的 Libra 方案表明，科技平台可能在全球范围分发私人稳定价值工具；七国集团工作组随后从法律、货币、竞争与金融稳定角度开展跨境评估。",
        meaningEn: "Regulators began analysing the whole arrangement—issuer, reserve, governance, wallets, and transfer system—not merely the token.",
        meaningZh: "监管者开始审视发行人、储备、治理、钱包和转移系统构成的整体安排，而不只是代币本身。",
        tagsEn: ["Libra", "global stablecoin", "policy"],
        tagsZh: ["Libra", "全球稳定币", "政策转折"],
        sources: [
          { label: "G7 Working Group, 2019", title: "Investigating the impact of global stablecoins", url: "https://www.bis.org/cpmi/publ/d187.htm" },
          { label: "BIS, 2020", title: "Stablecoins: risks, potential and regulation", url: "https://www.bis.org/publ/work905.htm" },
        ],
      },
      {
        date: "2020–2021",
        titleEn: "Pandemic-era growth and DeFi make stablecoins core market infrastructure",
        titleZh: "疫情时期增长与 DeFi 使稳定币成为核心市场基础设施",
        summaryEn: "Market capitalisation rose sharply from the onset of the pandemic, while the number of active stablecoins grew from 13 at the start of 2020 to 40 at the end of 2021. Stablecoins increasingly served trading, collateral, and settlement functions in DeFi.",
        summaryZh: "自疫情开始后，稳定币市值快速增长；运行项目数量从2020年初的13个增至2021年底的40个，并日益承担 DeFi 中的交易、抵押与结算功能。",
        meaningEn: "Network effects and composability increased utility, but also connected stablecoins more tightly to leverage, exchanges, protocols, and one another.",
        meaningZh: "网络效应与可组合性提升了实用性，也使稳定币与杠杆、交易所、协议及彼此之间形成更紧密的联系。",
        tagsEn: ["market growth", "DeFi", "settlement"],
        tagsZh: ["市场增长", "DeFi", "结算"],
        sources: [
          { label: "BIS, 2023", title: "Will the real stablecoin please stand up?", url: "https://www.bis.org/publ/bppdf/bispap141.htm" },
          { label: "BIS, 2021", title: "DeFi risks and the decentralisation illusion", url: "https://www.bis.org/publ/qtrpdf/r_qt2112b.htm" },
        ],
      },
    ],
  },
  {
    id: "stress",
    range: "2022–2023",
    titleEn: "Stress Tests and Contagion",
    titleZh: "压力检验与风险传染",
    thesisEn: "Two crises exposed different failure channels: an endogenous algorithmic spiral and a reserve asset trapped inside the banking system.",
    thesisZh: "两次危机揭示了不同的失效渠道：内生算法螺旋，以及储备资产被困在银行体系中的流动性冲击。",
    color: "#cf5f50",
    events: [
      {
        date: "May 2022",
        titleEn: "TerraUSD collapses in less than a week",
        titleZh: "TerraUSD 在不足一周内崩溃",
        summaryEn: "The roughly $18 billion algorithmic stablecoin relied on conversion into LUNA and incentives rather than a full reserve of external assets. A run erased the peg and transmitted losses across the crypto and DeFi ecosystem.",
        summaryZh: "市值约180亿美元的算法稳定币依赖与 LUNA 的兑换和激励，而非充分的外部资产储备；挤兑导致锚定失效，并将损失传导至加密与 DeFi 生态。",
        meaningEn: "A stabilisation rule is not equivalent to loss-absorbing backing. Reflexive designs can fail precisely when confidence and arbitrage capacity disappear together.",
        meaningZh: "稳定规则不等于能够吸收损失的价值支撑；当信心与套利能力同时消失时，反身性机制可能迅速失效。",
        tagsEn: ["TerraUSD", "algorithmic", "run"],
        tagsZh: ["TerraUSD", "算法机制", "挤兑"],
        sources: [
          { label: "Federal Reserve, 2022", title: "The Financial Stability Implications of Digital Assets", url: "https://www.federalreserve.gov/econres/feds/files/2022058pap.pdf" },
          { label: "Federal Reserve, 2022", title: "Financial Stability Report — Funding Risks", url: "https://www.federalreserve.gov/publications/2022-november-financial-stability-report-funding-risks.htm" },
        ],
      },
      {
        date: "Mar 2023",
        titleEn: "The SVB failure temporarily breaks USDC's peg",
        titleZh: "硅谷银行倒闭导致 USDC 短暂脱锚",
        summaryEn: "Circle disclosed that $3.3 billion of USDC reserves was held at Silicon Valley Bank. USDC fell to about $0.87 before public protection of bank depositors helped restore confidence and parity.",
        summaryZh: "Circle 披露有33亿美元 USDC 储备存放于硅谷银行；USDC 一度跌至约0.87美元，随后对银行存款人的公共保护帮助恢复信心和锚定。",
        meaningEn: "Even high-quality reserves can be unavailable at the moment of redemption. Banking concentration, operating hours, and cross-protocol holdings became visible parts of stablecoin risk.",
        meaningZh: "即使储备资产质量较高，也可能在赎回时点无法动用；银行集中度、营业时间和协议间持仓由此成为可见的稳定币风险。",
        tagsEn: ["USDC", "bank exposure", "contagion"],
        tagsZh: ["USDC", "银行敞口", "风险传染"],
        sources: [
          { label: "Federal Reserve, 2023", title: "Financial Stability Report, May 2023", url: "https://www.federalreserve.gov/publications/files/financial-stability-report-20230508.pdf" },
          { label: "Federal Reserve, 2024", title: "Primary and Secondary Markets for Stablecoins", url: "https://www.federalreserve.gov/econres/notes/feds-notes/primary-and-secondary-markets-for-stablecoins-20240223.html" },
        ],
      },
    ],
  },
  {
    id: "institutionalisation",
    range: "2023–2026",
    titleEn: "Institutionalisation",
    titleZh: "制度化与支付层扩展",
    thesisEn: "The central question shifted from whether stablecoins should exist to the conditions under which issuers, reserves, redemption, and cross-border use may operate.",
    thesisZh: "核心问题从“稳定币是否应当存在”转向发行人、储备、赎回与跨境使用应在何种条件下运行。",
    color: "#c28a24",
    events: [
      {
        date: "2023–2024",
        titleEn: "International standards and MiCA move into implementation",
        titleZh: "国际标准与 MiCA 进入实施阶段",
        summaryEn: "The FSB finalised global stablecoin recommendations in July 2023. In the EU, MiCA's stablecoin titles began applying on 30 June 2024, followed by the wider regulation on 30 December 2024.",
        summaryZh: "金融稳定理事会于2023年7月完成全球稳定币建议；欧盟 MiCA 的稳定币相关篇章自2024年6月30日起适用，其余规定自同年12月30日起适用。",
        meaningEn: "Governance, reserve management, disclosures, legal claims, and timely par redemption became explicit components of the regulatory perimeter.",
        meaningZh: "治理、储备管理、信息披露、法律请求权与及时按面值赎回成为监管边界中的明确组成部分。",
        tagsEn: ["FSB", "MiCA", "implementation"],
        tagsZh: ["FSB", "MiCA", "制度实施"],
        sources: [
          { label: "FSB, 2023", title: "High-level Recommendations for Global Stablecoin Arrangements", url: "https://www.fsb.org/2023/07/high-level-recommendations-for-the-regulation-supervision-and-oversight-of-global-stablecoin-arrangements-final-report/" },
          { label: "European Union, 2023", title: "MiCA Article 149: Entry into force and application", url: "https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mica/article-149-entry-force-and-application" },
        ],
      },
      {
        date: "2025",
        titleEn: "Major jurisdictions establish issuer regimes",
        titleZh: "主要司法辖区建立发行人制度",
        summaryEn: "The United States enacted the GENIUS Act on 18 July 2025. Hong Kong's licensing regime for fiat-referenced stablecoin issuers took effect on 1 August 2025. These frameworks differ, but both place issuance inside an explicit supervisory perimeter.",
        summaryZh: "美国于2025年7月18日颁布《GENIUS Act》；香港法币参考稳定币发行人发牌制度于同年8月1日生效。两者制度设计不同，但都将发行活动纳入明确监管边界。",
        meaningEn: "Reserve-backed payment stablecoins increasingly became a regulated issuer category rather than only a crypto-market convention.",
        meaningZh: "储备支持型支付稳定币日益成为受监管的发行人类别，而不再只是加密市场惯例。",
        tagsEn: ["GENIUS Act", "Hong Kong", "licensing"],
        tagsZh: ["GENIUS Act", "香港", "发牌制度"],
        sources: [
          { label: "U.S. Government, 2025", title: "Public Law 119-27 — GENIUS Act", url: "https://www.govinfo.gov/app/details/PLAW-119publ27" },
          { label: "HKMA, 2025", title: "Stablecoin issuer regulatory regime", url: "https://www.hkma.gov.hk/media/eng/doc/key-functions/ifc/stablecoin-issuers/Consultation_conclusions_on_the_Guideline_on_Supervision_of_Licensed_Stablecoin_Issuers.pdf" },
        ],
      },
      {
        date: "2025–2026",
        titleEn: "Stablecoins extend beyond crypto trading",
        titleZh: "稳定币开始超越加密交易场景",
        summaryEn: "Research increasingly examines stablecoins as payment instruments, cross-border dollar access, treasury infrastructure, and a new channel connecting on-chain markets with foreign-exchange and traditional funding markets.",
        summaryZh: "研究日益将稳定币视为支付工具、跨境美元获取渠道和资金管理基础设施，并关注其连接链上市场、外汇市场与传统融资市场的新传导渠道。",
        meaningEn: "The history remains open-ended: future importance depends less on token issuance alone than on real-world adoption, interoperability, regulation, and the credibility of redemption.",
        meaningZh: "这段历史尚未结束：未来影响不只取决于代币发行量，更取决于现实采用、互操作性、监管以及赎回承诺的可信度。",
        tagsEn: ["payments", "cross-border", "dollar access"],
        tagsZh: ["支付", "跨境使用", "美元获取"],
        sources: [
          { label: "BIS, 2025", title: "The next-generation monetary and financial system", url: "https://www.bis.org/publ/arpdf/ar2025e3.htm" },
          { label: "BIS, 2026", title: "Stablecoin flows and spillovers to FX markets", url: "https://www.bis.org/publ/work1340.htm" },
        ],
      },
    ],
  },
];

const LINEAGE = [
  {
    icon: Banknote,
    color: "#c58a19",
    titleEn: "Monetary institutions",
    titleZh: "货币制度传统",
    bodyEn: "Deposits, currency boards, offshore dollars, and money-market funds establish the logic of claims, reserves, par redemption, and runs.",
    bodyZh: "存款、货币发行局、离岸美元和货币市场基金建立了债权、储备、面值赎回与挤兑的制度逻辑。",
  },
  {
    icon: Blocks,
    color: "#138a7e",
    titleEn: "Electronic value",
    titleZh: "电子价值传统",
    bodyEn: "E-money and prepaid value separate monetary claims from physical cash while foregrounding issuer liability and safeguarding.",
    bodyZh: "电子货币与预付价值使货币债权脱离实体现金，并突出发行人责任与资金保护问题。",
  },
  {
    icon: Waypoints,
    color: "#3558c9",
    titleEn: "Distributed settlement",
    titleZh: "分布式结算传统",
    bodyEn: "Public blockchains add programmable ownership, bearer-style transfer, composability, and settlement on a shared ledger.",
    bodyZh: "公共区块链加入可编程所有权、持有人式转移、可组合性以及共享账本上的结算。",
  },
];

const LONG_RUN_SHIFTS = [
  { icon: Waypoints, fromEn: "Trading bridge", fromZh: "交易桥梁", toEn: "Settlement layer", toZh: "结算层", bodyEn: "Stablecoins moved from a bridge between cryptoassets and fiat money to collateral and settlement media across on-chain markets.", bodyZh: "稳定币从加密资产与法币之间的交易桥梁，逐步发展为链上市场的抵押品与结算媒介。" },
  { icon: ShieldAlert, fromEn: "Peg promise", fromZh: "锚定承诺", toEn: "Risk architecture", toZh: "风险架构", bodyEn: "Terra and SVB exposed how identical $1 targets can conceal different backing, liquidity, governance, and contagion channels.", bodyZh: "Terra 与硅谷银行事件表明，相同的1美元目标背后可能隐藏不同的支撑、流动性、治理与传染渠道。" },
  { icon: Landmark, fromEn: "Crypto product", fromZh: "加密产品", toEn: "Regulated arrangement", toZh: "受监管安排", bodyEn: "Policy increasingly treats issuance, reserves, custody, redemption, governance, and distribution as one connected arrangement.", bodyZh: "政策日益将发行、储备、托管、赎回、治理与分销视为相互关联的整体安排。" },
];

const PHASE_ICONS = [Banknote, Blocks, Waypoints, Network, ShieldAlert, Landmark];

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "");
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export default function AboutHistoryPage() {
  const { t, language } = useLanguage();
  const zh = language === "zh";
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);

  useEffect(() => {
    fetch(`${apiBase()}/api/stablecoin-market`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setSnapshot(data))
      .catch(() => setSnapshot(null));
  }, []);

  const currentMarketCap = useMemo(() => (snapshot?.projects ?? [])
    .filter((project) => project.status === "active")
    .reduce((total, project) => total + project.currentMarketCapUsd, 0), [snapshot]);

  const scaleData = useMemo(() => [
    { period: "2019", value: 5, color: "#77808f", note: t("Early scale", "早期规模") },
    { period: t("Mar 2022", "2022年3月"), value: 180, color: "#8b5ca8", note: t("Pre-Terra peak", "Terra危机前") },
    { period: t("Sep 2022", "2022年9月"), value: 151.4, color: "#cf5f50", note: t("Post-shock", "危机后") },
    ...(currentMarketCap > 0 ? [{ period: t("Current", "当前"), value: currentMarketCap / 1_000_000_000, color: "#3867c8", note: t("Live market", "实时市场") }] : []),
  ], [currentMarketCap, t]);

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-12 overflow-x-clip">
      <ContentEdgeNav label={t("On this page", "本页目录")} items={[
        { id: "history-lineage", label: t("Historical lineage", "历史谱系") },
        { id: "history-scale", label: t("History at a glance", "历史一览") },
        { id: "history-timeline", label: t("Timeline", "发展时间线") },
      ]} />
      <header className="pb-3">
        <p className="editorial-kicker">{t("About Stablecoins", "关于稳定币")}</p>
        <h1 className="mt-3 break-words text-3xl font-serif font-bold text-primary sm:text-4xl">{t("A History of Stablecoins", "稳定币发展历程")}</h1>
        <p className="mt-4 max-w-4xl editorial-copy">{t("Stablecoins are recent, but the problems they address are not. Private monetary claims, electronic value and distributed settlement converged before market crises and regulation reshaped the resulting arrangements.", "稳定币出现时间不长，但它试图解决的问题并不新。私人货币型债权、电子价值与分布式结算逐步汇合，随后又受到市场危机与监管制度的共同重塑。")}</p>
      </header>

      <section id="history-lineage" className="scroll-mt-24 pt-4">
        <div className="flex items-center gap-3"><Network className="h-6 w-6 text-primary" /><h2 className="text-3xl font-serif font-bold text-primary">{t("A Braided Lineage", "三条传统汇成稳定币")}</h2></div>
        <p className="mt-3 max-w-4xl editorial-note">{t("These streams are institutional and technical sources of ideas, not a claim of direct descent. Modern stablecoins recombine selected features from all three.", "这些线索是制度与技术思想的来源，并不表示直接的历史继承；现代稳定币选择性地重组了三者的特征。")}</p>

        <div className="mt-10 hidden min-h-[410px] grid-cols-[minmax(0,1fr)_15rem_minmax(0,.85fr)] items-center gap-5 lg:grid">
          <div className="space-y-8">
            {LINEAGE.map((item) => <article key={item.titleEn} className="grid grid-cols-[3.25rem_1fr] gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ backgroundColor: item.color }}><item.icon className="h-6 w-6" /></span>
              <div><h3 className="text-xl font-semibold">{zh ? item.titleZh : item.titleEn}</h3><p className="mt-2 text-[16px] leading-7 text-foreground/84">{zh ? item.bodyZh : item.bodyEn}</p></div>
            </article>)}
          </div>
          <svg className="h-[350px] w-full" viewBox="0 0 240 350" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 55 C95 55 105 175 220 175" fill="none" stroke="#c58a19" strokeWidth="24" strokeLinecap="round" opacity=".66" />
            <path d="M0 175 C105 175 120 175 220 175" fill="none" stroke="#138a7e" strokeWidth="30" strokeLinecap="round" opacity=".7" />
            <path d="M0 295 C95 295 105 175 220 175" fill="none" stroke="#3558c9" strokeWidth="24" strokeLinecap="round" opacity=".66" />
            <circle cx="222" cy="175" r="26" fill="hsl(var(--primary))" />
          </svg>
          <div className="relative pl-8">
            <span className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-primary" aria-hidden="true" />
            <Waypoints className="h-10 w-10 text-primary" />
            <p className="mt-5 editorial-kicker">{t("The recombination", "重组结果")}</p>
            <h3 className="mt-2 text-3xl font-serif font-bold text-primary">{t("Stablecoin arrangement", "稳定币安排")}</h3>
            <p className="mt-4 editorial-copy">{t("A transferable token links a reference value to backing, redemption, governance, and market liquidity on a programmable settlement rail.", "可转移代币在可编程结算网络上，将锚定价值与支撑、赎回、治理和市场流动性连接起来。")}</p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-primary"><span>{t("Claim", "债权")}</span><span>{t("Backing", "支撑")}</span><span>{t("Settlement", "结算")}</span><span>{t("Governance", "治理")}</span></div>
          </div>
        </div>

        <div className="relative mt-8 space-y-8 pl-7 lg:hidden">
          <span className="absolute bottom-14 left-[1.35rem] top-6 w-1 rounded-full bg-primary/20" aria-hidden="true" />
          {LINEAGE.map((item) => <article key={item.titleEn} className="relative grid grid-cols-[2.75rem_1fr] gap-4"><span className="z-10 flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ backgroundColor: item.color }}><item.icon className="h-5 w-5" /></span><div><h3 className="text-lg font-semibold">{zh ? item.titleZh : item.titleEn}</h3><p className="mt-1 editorial-note">{zh ? item.bodyZh : item.bodyEn}</p></div></article>)}
          <article className="relative grid grid-cols-[2.75rem_1fr] gap-4"><span className="z-10 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"><GitMerge className="h-5 w-5" /></span><div><h3 className="text-xl font-serif font-bold text-primary">{t("Stablecoin arrangement", "稳定币安排")}</h3><p className="mt-2 editorial-note">{t("Reference value, backing, redemption, governance, and market liquidity meet on a programmable settlement rail.", "锚定价值、支撑、赎回、治理与市场流动性在可编程结算网络上汇合。")}</p></div></article>
        </div>
      </section>

      <section id="history-scale" className="editorial-section">
        <div className="editorial-rule" />
        <div className="mt-9 flex items-end justify-between gap-6">
          <div><p className="editorial-kicker">{t("History at a glance", "历史一览")}</p><h2 className="mt-2 text-3xl font-serif font-bold text-primary">{t("Scale Changed the Question", "规模改变了问题")}</h2></div>
          {currentMarketCap > 0 && <div className="hidden text-right sm:block"><p className="text-4xl editorial-number text-primary">{formatUsd(currentMarketCap)}</p><p className="mt-1 text-sm text-muted-foreground">{t("current active market", "当前运行中市场规模")}</p></div>}
        </div>
        <div className="mt-8 grid gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="max-w-2xl editorial-copy">{t("For years, stablecoins were a small piece of crypto-market plumbing. Rapid growth made reserve management, redemption capacity, and links to traditional finance material policy questions. The 2022 correction did not end the market; it changed which mechanisms and issuers attracted trust.", "稳定币多年只是加密市场中规模较小的基础工具。快速增长使储备管理、赎回能力以及与传统金融的联系成为实质性政策问题。2022年的调整并未终结市场，而是改变了哪些机制与发行人能够获得信任。")}</p>
            <div className="mt-6 h-72 min-w-0" aria-label={t("Selected stablecoin market capitalisation milestones", "稳定币市场规模部分历史节点")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scaleData} margin={{ top: 20, right: 10, bottom: 8, left: 0 }}>
                  <XAxis dataKey="period" axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} tick={{ fontSize: 13, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(value) => `$${value}B`} width={62} />
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(1)}B`, t("Market capitalisation", "市场规模")]} contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: 4, boxShadow: "none" }} />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]} isAnimationActive={false}>{scaleData.map((item) => <Cell key={item.period} fill={item.color} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs leading-5 text-muted-foreground">
              <a href="https://www.bis.org/publ/bppdf/bispap141.htm" target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">{t("2019 and Sep 2022: BIS (2023)", "2019年及2022年9月：BIS（2023）")}</a>
              <a href="https://www.federalreserve.gov/publications/2022-may-financial-stability-report-funding.htm" target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">{t("Mar 2022: Federal Reserve (2022)", "2022年3月：美联储（2022）")}</a>
              {snapshot && <a href={snapshot.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">{t("Current: DefiLlama", "当前：DefiLlama")} · {new Intl.DateTimeFormat(zh ? "zh-CN" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(snapshot.refreshedAt))}</a>}
            </div>
          </div>
          <div id="history-shifts" className="scroll-mt-24 divide-y divide-border/80 border-y border-border/80">
            {LONG_RUN_SHIFTS.map((item, index) => <article key={item.fromEn} className="py-6">
              <div className="flex items-center gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><item.icon className="h-5 w-5" /></span><div className="flex min-w-0 flex-wrap items-center gap-2 text-lg font-semibold"><span>{zh ? item.fromZh : item.fromEn}</span><ArrowRight className="h-5 w-5 shrink-0 text-primary" /><span className="text-primary">{zh ? item.toZh : item.toEn}</span></div><span className="ml-auto text-xs tabular-nums text-muted-foreground">0{index + 1}</span></div>
              <p className="mt-3 pl-14 text-[16px] leading-7 text-foreground/84">{zh ? item.bodyZh : item.bodyEn}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section id="history-timeline" aria-labelledby="timeline-heading" className="scroll-mt-24 editorial-section">
        <div className="flex items-center gap-3"><RefreshCcw className="h-6 w-6 text-primary" /><h2 id="timeline-heading" className="text-3xl font-serif font-bold text-primary">{t("Historical Timeline", "发展时间线")}</h2></div>
        <p className="mt-3 max-w-4xl editorial-note">{t("The timeline distinguishes dated events from this hub's interpretation. Primary documents and authoritative reports open from each citation.", "时间线将有日期依据的事件与本研究中心的解释区分呈现；每条引用均可打开原始文件或权威报告。")}</p>

        <nav aria-label={t("History phases", "历史阶段")} className="sticky top-16 z-20 mt-7 border-y border-border/80 bg-background/95 py-3 backdrop-blur">
          <div className="flex min-w-max items-start overflow-x-auto pr-4">
            {PHASES.map((phase, index) => <a key={phase.id} href={`#${phase.id}`} className="group relative min-w-[11.5rem] flex-1 px-4 py-1 first:pl-1">
              <span className="absolute left-0 right-0 top-3 h-1 bg-border" aria-hidden="true" />
              <span className="relative z-10 block h-6 w-6 rounded-full border-4 border-background transition-transform group-hover:scale-125" style={{ backgroundColor: phase.color }} />
              <span className="mt-2 block text-xs tabular-nums text-muted-foreground">0{index + 1} · {phase.range}</span>
              <span className="mt-1 block text-sm font-semibold group-hover:text-primary">{zh ? phase.titleZh : phase.titleEn}</span>
            </a>)}
          </div>
        </nav>

        <div className="mt-5">
          {PHASES.map((phase, phaseIndex) => {
            const PhaseIcon = PHASE_ICONS[phaseIndex];
            return <section key={phase.id} id={phase.id} className="scroll-mt-48 border-b border-border/80 py-12 first:pt-8 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12">
              <div className="lg:sticky lg:top-48 lg:self-start">
                <div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ backgroundColor: phase.color }}><PhaseIcon className="h-6 w-6" /></span><span className="text-4xl font-semibold tabular-nums text-foreground/18">0{phaseIndex + 1}</span></div>
                <p className="mt-5 text-sm font-semibold uppercase tabular-nums" style={{ color: phase.color }}>{phase.range}</p>
                <h3 className="mt-2 text-2xl font-serif font-bold text-primary">{zh ? phase.titleZh : phase.titleEn}</h3>
                <p className="mt-4 text-[16px] leading-7 text-foreground/84">{zh ? phase.thesisZh : phase.thesisEn}</p>
              </div>

              <div className="relative mt-9 lg:mt-0">
                <span className="absolute bottom-6 left-[.43rem] top-4 w-1 rounded-full opacity-30" style={{ backgroundColor: phase.color }} aria-hidden="true" />
                <div className="space-y-2">
                  {phase.events.map((event, eventIndex) => <article key={`${phase.id}-${event.date}`} className="relative pl-10 pb-10 last:pb-2">
                    <span className="absolute left-0 top-2 h-4 w-4 rounded-full border-4 border-background" style={{ backgroundColor: phase.color, boxShadow: `0 0 0 2px ${phase.color}` }} aria-hidden="true" />
                    <p className="text-base font-semibold tabular-nums" style={{ color: phase.color }}>{event.date}</p>
                    <h4 className={`mt-2 font-semibold leading-tight ${eventIndex === 0 ? "text-2xl" : "text-xl"}`}>{zh ? event.titleZh : event.titleEn}</h4>
                    <p className="mt-4 editorial-reading">{zh ? event.summaryZh : event.summaryEn}</p>
                    <p className="mt-4 max-w-4xl text-[16px] font-medium leading-7 text-foreground">{zh ? event.meaningZh : event.meaningEn}</p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">{event.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" title={source.title} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">{source.label}<ExternalLink className="h-3.5 w-3.5" /></a>)}</div>
                  </article>)}
                </div>
              </div>
            </section>;
          })}
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-5 border-t border-border pt-7">
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{t("This is a selective analytical timeline, not an exhaustive list of every token launch. Dates and factual claims prioritise primary documents, central banks, international standard setters, and official issuer records.", "这是经过筛选的分析性时间线，并非所有代币发行的完整清单。日期与事实陈述优先采用原始文件、中央银行、国际标准制定机构及发行人官方记录。")}</p>
        <div className="flex gap-4"><Link href="/about-stablecoins/types" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">{t("Compare mechanisms", "比较稳定机制")}<ArrowRight className="h-3.5 w-3.5" /></Link><Link href="/regulatory" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">{t("Current regulation", "查看监管现状")}<ArrowRight className="h-3.5 w-3.5" /></Link></div>
      </footer>
    </div>
  );
}
