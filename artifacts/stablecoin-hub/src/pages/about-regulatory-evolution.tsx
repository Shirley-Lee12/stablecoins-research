import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Building2,
  ExternalLink,
  FileCheck2,
  GitBranch,
  Globe2,
  Landmark,
  Network,
  Scale,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { ContentEdgeNav } from "@/components/content-edge-nav";
import { useLanguage } from "@/lib/language-context";

type ConcernId = "integrity" | "consumer" | "issuer" | "payments" | "stability" | "sovereignty";

type PolicyEvent = {
  id: string;
  year: number;
  yearLabel: string;
  titleEn: string;
  titleZh: string;
  summaryEn: string;
  summaryZh: string;
  significanceEn: string;
  significanceZh: string;
  concerns: ConcernId[];
  sources: { label: string; url: string }[];
};

type JurisdictionMilestone = {
  year: number;
  stageEn: string;
  stageZh: string;
  titleEn: string;
  titleZh: string;
  noteEn: string;
  noteZh: string;
  source: string;
  url: string;
};

const CONCERNS: Array<{
  id: ConcernId;
  en: string;
  zh: string;
  color: string;
  summaryEn: string;
  summaryZh: string;
  ys: number[];
}> = [
  { id: "integrity", en: "Financial integrity", zh: "金融诚信", color: "#3f63c7", summaryEn: "AML/CFT, sanctions, travel rules, identity and transaction monitoring", summaryZh: "反洗钱、反恐融资、制裁、旅行规则、身份与交易监测", ys: [86, 92, 82, 96, 88, 80, 92, 84] },
  { id: "consumer", en: "Consumer & market protection", zh: "消费者与市场保护", color: "#c45f4d", summaryEn: "Disclosure, misleading claims, conflicts, conduct and customer-asset protection", summaryZh: "信息披露、误导性宣传、利益冲突、市场行为与客户资产保护", ys: [154, 150, 164, 142, 150, 144, 152, 146] },
  { id: "issuer", en: "Issuer, reserve & redemption", zh: "发行人、储备与赎回", color: "#248a78", summaryEn: "Issuer eligibility, reserve quality, custody, audit, liquidity and par redemption", summaryZh: "发行资格、储备质量、托管、审计、流动性与按面值赎回", ys: [222, 218, 204, 226, 212, 220, 206, 216] },
  { id: "payments", en: "Payments & operations", zh: "支付与运营体系", color: "#bd8a25", summaryEn: "Payment services, intermediaries, technology, operational resilience and settlement", summaryZh: "支付服务、中介机构、技术风险、运营韧性与结算", ys: [286, 292, 276, 284, 270, 282, 274, 266] },
  { id: "stability", en: "Financial stability", zh: "金融稳定与系统性风险", color: "#8355a5", summaryEn: "Runs, contagion, financial-sector links, systemic designation, recovery and resolution", summaryZh: "挤兑、传染、金融机构关联、系统重要性、恢复与处置", ys: [350, 324, 338, 318, 326, 314, 322, 310] },
  { id: "sovereignty", en: "Monetary sovereignty & coordination", zh: "货币主权与跨境协调", color: "#327d9b", summaryEn: "Currency substitution, capital flows, offshore issuers and cross-border cooperation", summaryZh: "货币替代、资本流动、境外发行人与跨境监管合作", ys: [414, 348, 394, 376, 388, 370, 382, 374] },
];

const POLICY_YEARS = [2015, 2019, 2020, 2022, 2023, 2024, 2025, 2026];

const POLICY_EVENTS: PolicyEvent[] = [
  {
    id: "fatf-2015", year: 2015, yearLabel: "2015", titleEn: "Virtual-currency gateways enter the AML perimeter", titleZh: "虚拟货币出入口进入反洗钱监管范围",
    summaryEn: "FATF's risk-based guidance focused on convertible virtual-currency gateways and their points of contact with the regulated financial system.", summaryZh: "FATF 的风险为本指引首先聚焦可兑换虚拟货币出入口及其与受监管金融体系的连接点。",
    significanceEn: "Stablecoin-specific rules had not yet formed, but the financial-integrity track was already being built.", significanceZh: "当时尚未形成稳定币专门制度，但金融诚信这一监管线已经开始建立。",
    concerns: ["integrity"], sources: [{ label: "FATF, 2015", url: "https://www.fatf-gafi.org/en/publications/Fatfgeneral/Outcomes-plenary-june2015.html" }],
  },
  {
    id: "g7-2019", year: 2019, yearLabel: "2019", titleEn: "Global stablecoins become a cross-border policy problem", titleZh: "全球稳定币成为跨境政策议题",
    summaryEn: "The prospect of a privately sponsored stablecoin reaching global scale moved the debate beyond crypto trading into payments, monetary sovereignty and systemic reach.", summaryZh: "私人机构推动的稳定币可能迅速达到全球规模，使讨论从加密交易扩展至支付、货币主权与系统性影响。",
    significanceEn: "One proposal activated several regulatory mandates at once; no single regulator could cover the full arrangement.", significanceZh: "同一方案同时触发多个监管目标，单一监管机构难以覆盖完整稳定币安排。",
    concerns: ["consumer", "issuer", "payments", "stability", "sovereignty"], sources: [{ label: "FSB, 2019", url: "https://www.fsb.org/2019/10/regulatory-issues-of-stablecoins/" }],
  },
  {
    id: "fsb-2020", year: 2020, yearLabel: "2020", titleEn: "International recommendations address the arrangement as a whole", titleZh: "国际建议开始整体监管稳定币安排",
    summaryEn: "The FSB proposed a comprehensive approach covering governance, risk management, data, recovery, disclosures and redemption rather than treating a stablecoin as only a token.", summaryZh: "FSB 提出覆盖治理、风险管理、数据、恢复、披露与赎回的综合方法，不再仅把稳定币视为一种代币。",
    significanceEn: "The regulatory unit shifted toward functions, participants and their interactions across the full arrangement.", significanceZh: "监管对象开始转向完整安排中的功能、参与者及其相互关系。",
    concerns: ["consumer", "issuer", "payments", "stability", "sovereignty"], sources: [{ label: "FSB, 2020", url: "https://www.fsb.org/uploads/P131020-3.pdf" }],
  },
  {
    id: "terra-2022", year: 2022.05, yearLabel: "2022", titleEn: "Market failure exposes differences hidden by the same peg", titleZh: "市场失败暴露相同锚定目标背后的机制差异",
    summaryEn: "The collapse of Terra highlighted that a common price target can conceal radically different backing, redemption, governance and contagion channels.", summaryZh: "Terra 崩溃表明，相同的价格锚定目标背后可能隐藏完全不同的价值支撑、赎回、治理与传染路径。",
    significanceEn: "Policy attention widened from issuer promises to mechanism design, market linkages and credible loss absorption.", significanceZh: "政策关注从发行人承诺扩展至机制设计、市场关联与可信的损失吸收能力。",
    concerns: ["consumer", "issuer", "stability"], sources: [{ label: "FSB, 2022", url: "https://www.fsb.org/2022/10/international-regulation-of-crypto-asset-activities-questions-for-consultation/" }],
  },
  {
    id: "pfmi-2022", year: 2022.58, yearLabel: "2022", titleEn: "Systemically important arrangements enter payment-infrastructure standards", titleZh: "具有系统重要性的稳定币安排纳入支付基础设施标准",
    summaryEn: "CPMI-IOSCO confirmed that systemically important stablecoin arrangements performing transfer functions should observe relevant Principles for Financial Market Infrastructures.", summaryZh: "CPMI-IOSCO 确认，承担转移功能且具有系统重要性的稳定币安排应遵守相关金融市场基础设施原则。",
    significanceEn: "Stablecoin regulation connected directly with governance, settlement finality and system-wide operational resilience.", significanceZh: "稳定币监管由此直接连接到治理、结算最终性与系统层面的运营韧性。",
    concerns: ["payments", "stability"], sources: [{ label: "CPMI-IOSCO, 2022", url: "https://www.bis.org/cpmi/publ/d206.pdf" }],
  },
  {
    id: "global-eu-2023", year: 2023.18, yearLabel: "2023", titleEn: "Global principles and a comprehensive regional regime mature", titleZh: "全球原则与区域综合制度走向成熟",
    summaryEn: "The FSB finalised revised recommendations while the European Union adopted MiCA, translating broad principles into issuer, reserve, redemption and supervisory requirements.", summaryZh: "FSB 完成修订建议，欧盟通过 MiCA，将宏观原则落实为发行人、储备、赎回与监管要求。",
    significanceEn: "International convergence strengthened, but domestic legal categories and supervisory architectures continued to differ.", significanceZh: "国际原则进一步收敛，但各辖区的法律分类与监管架构仍然存在差异。",
    concerns: ["integrity", "consumer", "issuer", "payments", "stability", "sovereignty"], sources: [
      { label: "FSB, 2023", url: "https://www.fsb.org/2023/07/high-level-recommendations-for-the-regulation-supervision-and-oversight-of-global-stablecoin-arrangements-final-report/" },
      { label: "European Union, 2023", url: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj" },
    ],
  },
  {
    id: "mica-2024", year: 2024, yearLabel: "2024", titleEn: "Rules move from adoption to application", titleZh: "监管从制度通过转入规则适用",
    summaryEn: "MiCA's titles for asset-referenced and e-money tokens began applying on 30 June 2024, followed by the broader regulation from 30 December 2024.", summaryZh: "MiCA 关于资产参考代币与电子货币代币的篇章自 2024 年 6 月 30 日起适用，整体法规随后于 12 月 30 日起适用。",
    significanceEn: "Implementation made licensing, reserves, disclosures and supervisory coordination operational rather than aspirational.", significanceZh: "发牌、储备、披露与监管协调开始从原则转化为可执行制度。",
    concerns: ["integrity", "consumer", "issuer", "payments"], sources: [{ label: "European Union, 2023", url: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj" }],
  },
  {
    id: "licensing-2025", year: 2025.35, yearLabel: "2025", titleEn: "Issuer regimes spread, but through different institutional routes", titleZh: "发行人制度扩展，但采取不同制度路径",
    summaryEn: "The United States enacted a federal payment-stablecoin framework and Hong Kong brought its fiat-referenced stablecoin issuer licensing regime into force.", summaryZh: "美国建立联邦支付稳定币框架，中国香港则实施法币参考稳定币发行人发牌制度。",
    significanceEn: "Shared themes such as eligible issuers, reserves and redemption increasingly appeared in law, while allocation of supervisory authority remained jurisdiction-specific.", significanceZh: "合格发行人、储备与赎回等共同主题日益进入法律，但监管权限分配仍具有辖区差异。",
    concerns: ["integrity", "consumer", "issuer", "payments", "stability"], sources: [
      { label: "U.S. Congress, 2025", url: "https://www.congress.gov/bill/119th-congress/senate-bill/1582" },
      { label: "HKMA, 2025", url: "https://www.hkma.gov.hk/media/eng/doc/key-functions/ifc/stablecoin-issuers/Guideline_on_supervision_of_licensed_stablecoin_issuers_eng.pdf" },
    ],
  },
];

const JURISDICTIONS: Array<{ id: string; en: string; zh: string; color: string; milestones: JurisdictionMilestone[] }> = [
  { id: "us", en: "United States", zh: "美国", color: "#3f63c7", milestones: [
    { year: 2021, stageEn: "Policy report", stageZh: "政策报告", titleEn: "Federal agencies set out risks and legislative recommendations", titleZh: "联邦机构提出风险分析与立法建议", noteEn: "The policy debate focused on prudential safeguards, payment-system risk and the appropriate issuer perimeter.", noteZh: "政策讨论聚焦审慎保障、支付系统风险与发行主体范围。", source: "U.S. Treasury, 2021", url: "https://home.treasury.gov/news/press-releases/jy0454" },
    { year: 2025, stageEn: "Federal law", stageZh: "联邦立法", titleEn: "GENIUS Act establishes a federal payment-stablecoin framework", titleZh: "GENIUS Act 建立联邦支付稳定币框架", noteEn: "Federal and qualifying state supervision are placed within an issuer-focused statutory framework.", noteZh: "联邦监管与符合条件的州监管被纳入以发行人为核心的法律框架。", source: "U.S. Congress, 2025", url: "https://www.congress.gov/bill/119th-congress/senate-bill/1582" },
  ] },
  { id: "eu", en: "European Union", zh: "欧盟", color: "#248a78", milestones: [
    { year: 2020, stageEn: "Proposal", stageZh: "法规提案", titleEn: "European Commission proposes MiCA", titleZh: "欧盟委员会提出 MiCA", noteEn: "The proposal created dedicated categories for asset-referenced and e-money tokens.", noteZh: "提案为资产参考代币和电子货币代币建立专门类别。", source: "European Commission, 2020", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52020PC0593" },
    { year: 2023, stageEn: "Adopted", stageZh: "正式通过", titleEn: "MiCA enters into force", titleZh: "MiCA 生效", noteEn: "A harmonised EU-wide framework establishes authorisation, reserve, redemption and disclosure requirements.", noteZh: "统一的欧盟制度确立授权、储备、赎回与披露要求。", source: "European Union, 2023", url: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj" },
    { year: 2024, stageEn: "Applied", stageZh: "开始适用", titleEn: "Stablecoin titles begin to apply", titleZh: "稳定币相关篇章开始适用", noteEn: "Titles III and IV apply from 30 June 2024.", noteZh: "第三篇与第四篇自 2024 年 6 月 30 日起适用。", source: "European Union, 2023", url: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj" },
  ] },
  { id: "uk", en: "United Kingdom", zh: "英国", color: "#8355a5", milestones: [
    { year: 2023, stageEn: "Statutory perimeter", stageZh: "法律监管范围", titleEn: "FSMA 2023 brings qualifying stablecoin activity into the regulatory perimeter", titleZh: "《2023年金融服务与市场法》将合格稳定币活动纳入监管范围", noteEn: "Detailed conduct and systemic frameworks remained subject to implementation work.", noteZh: "具体行为监管与系统性监管制度仍需后续实施。", source: "UK Parliament, 2023", url: "https://www.legislation.gov.uk/ukpga/2023/29/contents" },
    { year: 2026, stageEn: "Implementation policy", stageZh: "实施政策", titleEn: "Bank of England and FCA clarify joint oversight", titleZh: "英格兰银行与 FCA 明确联合监管安排", noteEn: "The policy distinguishes systemic prudential oversight from the wider conduct framework.", noteZh: "政策区分系统性审慎监管与更广泛的行为监管框架。", source: "Bank of England / FCA, 2026", url: "https://www.bankofengland.co.uk/paper/2026/boe-and-fcas-approach-to-joint-regulation-of-systemic-stablecoin-issuers" },
  ] },
  { id: "hk", en: "Hong Kong", zh: "中国香港", color: "#c45f4d", milestones: [
    { year: 2022, stageEn: "Discussion", stageZh: "讨论文件", titleEn: "HKMA begins a dedicated stablecoin policy process", titleZh: "香港金管局启动稳定币专项政策进程", noteEn: "The process examined the regulatory perimeter for payment-related stablecoins.", noteZh: "政策进程开始研究支付相关稳定币的监管范围。", source: "HKMA, 2022", url: "https://www.hkma.gov.hk/eng/news-and-media/press-releases/2022/01/20220112-3/" },
    { year: 2025, stageEn: "In force", stageZh: "正式生效", titleEn: "Issuer licensing regime takes effect", titleZh: "发行人发牌制度正式生效", noteEn: "The Stablecoins Ordinance and supervisory guidance took effect on 1 August 2025.", noteZh: "《稳定币条例》及监管指引于 2025 年 8 月 1 日生效。", source: "HKMA, 2025", url: "https://www.hkma.gov.hk/media/eng/doc/key-functions/ifc/stablecoin-issuers/Guideline_on_supervision_of_licensed_stablecoin_issuers_eng.pdf" },
  ] },
  { id: "sg", en: "Singapore", zh: "新加坡", color: "#bd8a25", milestones: [
    { year: 2022, stageEn: "Consultation", stageZh: "公开咨询", titleEn: "MAS consults on a single-currency stablecoin framework", titleZh: "新加坡金管局就单一货币稳定币框架征求意见", noteEn: "The consultation focused on Singapore-issued stablecoins pegged to SGD or G10 currencies.", noteZh: "咨询聚焦在新加坡发行并锚定新元或 G10 货币的稳定币。", source: "MAS, 2022", url: "https://www.mas.gov.sg/publications/consultations/2022/consultation-paper-on-proposed-regulatory-approach-for-stablecoin-related-activities" },
    { year: 2023, stageEn: "Framework finalised", stageZh: "框架定稿", titleEn: "MAS finalises its stablecoin regulatory framework", titleZh: "新加坡金管局完成稳定币监管框架", noteEn: "The framework sets value-stability, capital, redemption and disclosure expectations.", noteZh: "框架确立价值稳定、资本、赎回与披露要求。", source: "MAS, 2023", url: "https://www.sgpc.gov.sg/api/file/getfile/Media%20Release_MAS%20Finalises%20Stablecoin%20Regulatory%20Framework.pdf?path=%2Fsgpcmedia%2Fmedia_releases%2Fmas%2Fpress_release%2FP-20230815-2%2Fattachment%2FMedia+Release_MAS+Finalises+Stablecoin+Regulatory+Framework.pdf" },
  ] },
  { id: "jp", en: "Japan", zh: "日本", color: "#327d9b", milestones: [
    { year: 2022, stageEn: "Legislation", stageZh: "立法", titleEn: "Payment Services Act amendments define electronic payment instruments", titleZh: "《资金结算法》修订确立电子支付工具类别", noteEn: "Fiat-linked, par-redeemable instruments were placed within a digital-money regulatory structure.", noteZh: "与法币挂钩且可按面值赎回的工具被纳入数字货币监管结构。", source: "Japan FSA, 2022", url: "https://www.fsa.go.jp/inter/etc/20221207/01.pdf" },
    { year: 2023, stageEn: "In force", stageZh: "制度生效", titleEn: "Electronic payment instrument regime commences", titleZh: "电子支付工具制度开始实施", noteEn: "Intermediaries became subject to registration and related conduct and AML/CFT obligations.", noteZh: "中介机构开始适用登记、行为监管及反洗钱义务。", source: "Japan FSA, 2023", url: "https://www.fsa.go.jp/common/shinsei/dendai/dentori.html" },
  ] },
  { id: "uae", en: "United Arab Emirates", zh: "阿联酋", color: "#9b6d32", milestones: [
    { year: 2024, stageEn: "Regulation", stageZh: "监管规则", titleEn: "CBUAE issues the Payment Token Services Regulation", titleZh: "阿联酋中央银行发布支付代币服务监管规则", noteEn: "The central-bank perimeter covers payment-token issuance, custody, conversion and transfer activities.", noteZh: "中央银行监管范围覆盖支付代币发行、托管、兑换与转移活动。", source: "CBUAE, 2024", url: "https://rulebook.centralbank.ae/en/rulebook/payment-token-services-regulation" },
  ] },
  { id: "cn", en: "China (Mainland)", zh: "中国内地", color: "#686f7b", milestones: [
    { year: 2021, stageEn: "Restrictive perimeter", stageZh: "限制性监管边界", titleEn: "Virtual-currency restrictions define the domestic perimeter", titleZh: "虚拟货币监管文件确立境内限制性边界", noteEn: "Mainland China has not established a public licensing regime for privately issued stablecoins; broader virtual-currency restrictions shape the perimeter.", noteZh: "中国内地尚未建立私人发行稳定币的公开发牌制度，相关边界主要由更广泛的虚拟货币限制性政策塑造。", source: "PBOC and authorities, 2021", url: "http://www.pbc.gov.cn/goutongjiaoliu/113456/113469/4348521/index.html" },
  ] },
];

const FRAMEWORK_OBJECTS = [
  { en: "Issuer", zh: "发行人", x: 500, y: 54, icon: Building2 },
  { en: "Reserve", zh: "储备资产", x: 744, y: 104, icon: Landmark },
  { en: "Redemption", zh: "赎回机制", x: 838, y: 220, icon: WalletCards },
  { en: "Intermediaries", zh: "中介机构", x: 724, y: 340, icon: Network },
  { en: "Users", zh: "使用者", x: 500, y: 384, icon: ShieldCheck },
  { en: "Payment system", zh: "支付体系", x: 266, y: 340, icon: FileCheck2 },
  { en: "Financial system", zh: "金融体系", x: 162, y: 220, icon: Scale },
  { en: "Cross-border reach", zh: "跨境影响", x: 274, y: 104, icon: Globe2 },
];

const CONVERGENCE = [
  { en: "Authorisation or a defined eligible-issuer perimeter", zh: "发行许可或明确的合格发行人范围" },
  { en: "Segregated, liquid and conservatively managed backing assets", zh: "隔离、高流动性并审慎管理的支持资产" },
  { en: "Clear and timely redemption rights", zh: "清晰且及时的赎回权利" },
  { en: "Governance, audit, disclosure and operational resilience", zh: "治理、审计、披露与运营韧性" },
  { en: "AML/CFT and cross-border supervisory cooperation", zh: "反洗钱、反恐融资与跨境监管合作" },
];

const DIVERGENCE = [
  { en: "Whether banks, nonbanks or both may issue", zh: "银行、非银行机构或两者是否可以发行" },
  { en: "Whether the legal object is a token, issuer, payment service or full arrangement", zh: "法律对象是代币、发行人、支付服务还是完整安排" },
  { en: "Treatment of algorithmic and non-fiat-referenced designs", zh: "算法型及非单一法币参考设计的处理方式" },
  { en: "Market access for offshore issuers and intermediaries", zh: "境外发行人与中介机构的市场准入" },
  { en: "Allocation of conduct, prudential and systemic oversight", zh: "行为、审慎与系统性监管权限的分配" },
];

function xForYear(year: number) {
  return 175 + ((year - 2015) / 11) * 965;
}

function yForConcern(concern: (typeof CONCERNS)[number], year: number) {
  if (year <= POLICY_YEARS[0]) return concern.ys[0];
  for (let index = 1; index < POLICY_YEARS.length; index += 1) {
    if (year <= POLICY_YEARS[index]) {
      const start = POLICY_YEARS[index - 1];
      const end = POLICY_YEARS[index];
      const ratio = (year - start) / (end - start);
      return concern.ys[index - 1] + (concern.ys[index] - concern.ys[index - 1]) * ratio;
    }
  }
  return concern.ys[concern.ys.length - 1];
}

function streamPath(concern: (typeof CONCERNS)[number]) {
  const points = POLICY_YEARS.map((year, index) => ({ x: xForYear(year), y: concern.ys[index] }));
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const midpoint = (previous.x + point.x) / 2;
    return `${path} C ${midpoint} ${previous.y}, ${midpoint} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

export default function AboutRegulatoryEvolutionPage() {
  const { t, language } = useLanguage();
  const zh = language === "zh";
  const [view, setView] = useState<"concerns" | "jurisdictions">("concerns");
  const [selectedEventId, setSelectedEventId] = useState(POLICY_EVENTS[1].id);
  const [selectedMilestone, setSelectedMilestone] = useState<{ jurisdictionId: string; milestone: JurisdictionMilestone }>({ jurisdictionId: "eu", milestone: JURISDICTIONS[1].milestones[1] });

  const selectedEvent = useMemo(() => POLICY_EVENTS.find((event) => event.id === selectedEventId) ?? POLICY_EVENTS[0], [selectedEventId]);
  const selectedJurisdiction = JURISDICTIONS.find((item) => item.id === selectedMilestone.jurisdictionId) ?? JURISDICTIONS[0];

  return (
    <div className="mx-auto max-w-7xl space-y-12 pb-8">
      <ContentEdgeNav label={t("On this page", "本页目录")} items={[
        { id: "evolution-map", label: t("What regulation sees", "监管对象") },
        { id: "evolution-streams", label: t("Evolution map", "演进图谱") },
        { id: "evolution-patterns", label: t("Convergence and divergence", "收敛与分化") },
        { id: "evolution-reading", label: t("Continue exploring", "继续了解") },
      ]} />

      <header className="border-b border-border pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("About Stablecoins", "关于稳定币")}</p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-primary">{t("Regulatory Evolution", "监管演进")}</h1>
        <p className="mt-3 max-w-4xl editorial-copy">{t("Stablecoin regulation did not move through a single sequence of concerns. Financial integrity, consumer protection, issuer safeguards, payment oversight, financial stability and monetary sovereignty emerged at different moments, accumulated, and increasingly interacted.", "稳定币监管并不是从一个问题依次转向另一个问题。金融诚信、消费者保护、发行人保障、支付监管、金融稳定与货币主权在不同阶段出现、不断叠加，并日益相互交织。")}</p>
      </header>

      <section id="evolution-map" className="scroll-mt-24">
        <div className="flex items-center gap-3"><Network className="h-6 w-6 text-primary" /><h2 className="font-serif text-2xl font-bold text-primary">{t("Regulation Sees an Arrangement, Not Only a Token", "监管面对的是完整安排，而不只是代币")}</h2></div>
        <p className="mt-2 max-w-4xl editorial-note">{t("The same stablecoin can activate several legal mandates because value creation, custody, redemption, transfer and systemic use may be performed by different participants.", "同一种稳定币可能同时触发多项监管职责，因为价值创造、托管、赎回、转移与系统性使用可能由不同参与者承担。")}</p>

        <div className="mt-7 hidden md:block" aria-label={t("Stablecoin regulatory object map", "稳定币监管对象关系图")}>
          <svg viewBox="0 0 1000 440" className="mx-auto h-auto w-full max-w-5xl" role="img">
            <defs><radialGradient id="evolutionCenter" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.95" /><stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.9" /></radialGradient></defs>
            {FRAMEWORK_OBJECTS.map((item) => <line key={`line-${item.en}`} x1="500" y1="220" x2={item.x} y2={item.y} stroke="hsl(var(--border))" strokeWidth="1.5" />)}
            <circle cx="500" cy="220" r="92" fill="url(#evolutionCenter)" />
            <text x="500" y="210" textAnchor="middle" fill="white" fontSize="20" fontWeight="700">{t("Stablecoin", "稳定币")}</text>
            <text x="500" y="238" textAnchor="middle" fill="white" fontSize="20" fontWeight="700">{t("arrangement", "完整安排")}</text>
            {FRAMEWORK_OBJECTS.map((item, index) => <g key={item.en}>
              <circle cx={item.x} cy={item.y} r="25" fill={CONCERNS[index % CONCERNS.length].color} opacity="0.92" />
              <text x={item.x} y={item.y + 4} textAnchor="middle" fill="white" fontSize="12" fontWeight="700">{String(index + 1).padStart(2, "0")}</text>
              <text x={item.x} y={item.y + (item.y < 220 ? -38 : 48)} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="15" fontWeight="600">{zh ? item.zh : item.en}</text>
            </g>)}
          </svg>
        </div>
        <div className="mt-7 grid gap-x-8 gap-y-5 sm:grid-cols-2 md:hidden">
          {FRAMEWORK_OBJECTS.map((item, index) => <div key={item.en} className="flex items-center gap-3 border-t border-border pt-3"><span className="flex h-7 w-7 items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: CONCERNS[index % CONCERNS.length].color }}>0{index + 1}</span><span className="font-semibold">{zh ? item.zh : item.en}</span></div>)}
        </div>
        <div className="mt-7 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {CONCERNS.map((concern) => <div key={concern.id} className="border-t-2 pt-4" style={{ borderTopColor: concern.color }}><p className="font-semibold">{zh ? concern.zh : concern.en}</p><p className="mt-1 text-sm leading-6 text-foreground/72">{zh ? concern.summaryZh : concern.summaryEn}</p></div>)}
        </div>
      </section>

      <section id="evolution-streams" className="editorial-section">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><div className="flex items-center gap-3"><GitBranch className="h-6 w-6 text-primary" /><h2 className="font-serif text-2xl font-bold text-primary">{t("Interwoven Regulatory Paths", "相互交织的监管路径")}</h2></div><p className="mt-2 max-w-3xl editorial-note">{t("Policy concerns and jurisdictional implementation developed at different speeds. Each milestone is tied to the official instrument that changed the regulatory perimeter.", "监管议题与各辖区的制度实施并不同步；每个里程碑均对应改变监管边界的官方制度文件。")}</p></div>
          <div className="inline-flex border-b border-border" role="group" aria-label={t("Evolution view", "演进视图")}>
            <button type="button" onClick={() => setView("concerns")} className={`border-b-2 px-4 py-2 text-sm font-semibold ${view === "concerns" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t("By regulatory concern", "按监管议题")}</button>
            <button type="button" onClick={() => setView("jurisdictions")} className={`border-b-2 px-4 py-2 text-sm font-semibold ${view === "jurisdictions" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t("By jurisdiction", "按辖区")}</button>
          </div>
        </div>

        {view === "concerns" ? <>
          <div className="mt-7 overflow-x-auto border-y border-border py-4">
            <svg viewBox="0 0 1200 455" className="min-w-[1050px]" role="img" aria-label={t("Interwoven stablecoin regulatory policy streams from 2015 to 2026", "2015年至2026年稳定币监管议题交织图")}>
              {POLICY_YEARS.map((year) => <g key={year}><line x1={xForYear(year)} x2={xForYear(year)} y1="38" y2="430" stroke="hsl(var(--border))" strokeDasharray="3 7" /><text x={xForYear(year)} y="24" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="12">{year}</text></g>)}
              {CONCERNS.map((concern) => <g key={concern.id}><path d={streamPath(concern)} fill="none" stroke={concern.color} strokeWidth="7" strokeLinecap="round" opacity="0.82" /><text x="10" y={concern.ys[0] + 5} fill="hsl(var(--foreground))" fontSize="13" fontWeight="600">{zh ? concern.zh : concern.en}</text></g>)}
              {POLICY_EVENTS.map((event) => {
                const x = xForYear(event.year);
                const selected = event.id === selectedEvent.id;
                const affected = CONCERNS.filter((concern) => event.concerns.includes(concern.id));
                const ys = affected.map((concern) => yForConcern(concern, event.year));
                return <g key={event.id} role="button" tabIndex={0} aria-label={`${event.yearLabel} ${zh ? event.titleZh : event.titleEn}`} onClick={() => setSelectedEventId(event.id)} onKeyDown={(keyboardEvent) => { if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") setSelectedEventId(event.id); }} className="cursor-pointer outline-none">
                  <line x1={x} x2={x} y1={Math.min(...ys)} y2={Math.max(...ys)} stroke={selected ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))"} strokeWidth={selected ? 2 : 1} opacity={selected ? 0.7 : 0.35} />
                  {affected.map((concern) => <circle key={concern.id} cx={x} cy={yForConcern(concern, event.year)} r={selected ? 8 : 6} fill={concern.color} stroke="hsl(var(--background))" strokeWidth="3" />)}
                  <rect x={x - 12} y="40" width="24" height="385" fill="transparent" />
                </g>;
              })}
            </svg>
          </div>
          <div className="mt-6 grid gap-6 border-l-4 border-primary pl-5 lg:grid-cols-[10rem_minmax(0,1fr)_18rem] lg:pl-7">
            <div><p className="text-2xl font-semibold tabular-nums text-primary">{selectedEvent.yearLabel}</p><div className="mt-3 flex flex-wrap gap-2">{selectedEvent.concerns.map((id) => { const concern = CONCERNS.find((item) => item.id === id)!; return <span key={id} className="inline-flex items-center gap-1.5 text-xs font-medium"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: concern.color }} />{zh ? concern.zh : concern.en}</span>; })}</div></div>
            <div><h3 className="text-xl font-semibold">{zh ? selectedEvent.titleZh : selectedEvent.titleEn}</h3><p className="mt-3 text-base leading-8 text-foreground/80">{zh ? selectedEvent.summaryZh : selectedEvent.summaryEn}</p><p className="mt-3 text-sm leading-7 text-primary"><span className="font-semibold">{t("Why it matters", "为何重要")}：</span>{zh ? selectedEvent.significanceZh : selectedEvent.significanceEn}</p></div>
            <div className="lg:border-l lg:border-border lg:pl-5"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t("Primary sources", "官方来源")}</p><div className="mt-3 space-y-2">{selectedEvent.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">({source.label})<ExternalLink className="h-3.5 w-3.5" /></a>)}</div></div>
          </div>
        </> : <>
          <div className="mt-7 overflow-x-auto border-y border-border py-5">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[11rem_1fr] gap-5"><div /><div className="relative h-7">{[2020, 2021, 2022, 2023, 2024, 2025, 2026].map((year) => <span key={year} className="absolute -translate-x-1/2 text-xs tabular-nums text-muted-foreground" style={{ left: `${((year - 2020) / 6) * 100}%` }}>{year}</span>)}</div></div>
              <div className="space-y-1">
                {JURISDICTIONS.map((jurisdiction) => <div key={jurisdiction.id} className="grid min-h-16 grid-cols-[11rem_1fr] items-center gap-5 border-t border-border/70 first:border-t-0">
                  <p className="font-semibold">{zh ? jurisdiction.zh : jurisdiction.en}</p>
                  <div className="relative h-16"><div className="absolute inset-x-0 top-1/2 h-px bg-border" />{jurisdiction.milestones.map((milestone) => {
                    const active = selectedMilestone.jurisdictionId === jurisdiction.id && selectedMilestone.milestone.titleEn === milestone.titleEn;
                    return <button key={`${jurisdiction.id}-${milestone.year}-${milestone.titleEn}`} type="button" onClick={() => setSelectedMilestone({ jurisdictionId: jurisdiction.id, milestone })} title={zh ? milestone.titleZh : milestone.titleEn} className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-background transition-transform hover:scale-125 ${active ? "scale-125 ring-2 ring-foreground/30" : ""}`} style={{ left: `${((milestone.year - 2020) / 6) * 100}%`, backgroundColor: jurisdiction.color }}><span className="sr-only">{zh ? milestone.titleZh : milestone.titleEn}</span></button>;
                  })}</div>
                </div>)}
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-6 border-l-4 pl-5 lg:grid-cols-[11rem_minmax(0,1fr)_16rem] lg:pl-7" style={{ borderLeftColor: selectedJurisdiction.color }}>
            <div><p className="font-semibold" style={{ color: selectedJurisdiction.color }}>{zh ? selectedJurisdiction.zh : selectedJurisdiction.en}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{selectedMilestone.milestone.year}</p><p className="mt-1 text-sm text-muted-foreground">{zh ? selectedMilestone.milestone.stageZh : selectedMilestone.milestone.stageEn}</p></div>
            <div><h3 className="text-xl font-semibold">{zh ? selectedMilestone.milestone.titleZh : selectedMilestone.milestone.titleEn}</h3><p className="mt-3 text-base leading-8 text-foreground/80">{zh ? selectedMilestone.milestone.noteZh : selectedMilestone.milestone.noteEn}</p></div>
            <div className="lg:border-l lg:border-border lg:pl-5"><a href={selectedMilestone.milestone.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">({selectedMilestone.milestone.source})<ExternalLink className="h-3.5 w-3.5" /></a><Link href={`/regulatory#regulatory-comparison`} className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">{t("Open current status", "查看当前监管状态")}<ArrowRight className="h-3.5 w-3.5" /></Link></div>
          </div>
        </>}
      </section>

      <section id="evolution-patterns" className="editorial-section">
        <div className="flex items-center gap-3"><Scale className="h-6 w-6 text-primary" /><h2 className="font-serif text-2xl font-bold text-primary">{t("Convergence in Principles, Divergence in Legal Design", "原则趋于收敛，法律设计仍然分化")}</h2></div>
        <p className="mt-2 max-w-4xl editorial-note">{t("International standards increasingly define common outcomes, while domestic law still determines institutional form, regulatory perimeter and allocation of authority.", "国际标准日益形成共同监管目标，但制度形式、监管范围与权限分配仍由各辖区法律决定。")}</p>
        <div className="mt-8 grid gap-12 lg:grid-cols-2">
          <div className="border-t-4 border-secondary pt-5"><h3 className="text-xl font-semibold text-secondary">{t("Areas of convergence", "逐渐收敛的原则")}</h3><ol className="mt-5 space-y-4">{CONVERGENCE.map((item, index) => <li key={item.en} className="grid grid-cols-[2rem_1fr] gap-3"><span className="text-xs font-semibold tabular-nums text-secondary">0{index + 1}</span><span className="text-base leading-7 text-foreground/80">{zh ? item.zh : item.en}</span></li>)}</ol></div>
          <div className="border-t-4 border-chart-3 pt-5"><h3 className="text-xl font-semibold text-chart-3">{t("Persistent differences", "仍然存在的差异")}</h3><ol className="mt-5 space-y-4">{DIVERGENCE.map((item, index) => <li key={item.en} className="grid grid-cols-[2rem_1fr] gap-3"><span className="text-xs font-semibold tabular-nums text-chart-3">0{index + 1}</span><span className="text-base leading-7 text-foreground/80">{zh ? item.zh : item.en}</span></li>)}</ol></div>
        </div>
      </section>

      <section id="evolution-reading" className="editorial-section">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><h2 className="font-serif text-2xl font-bold text-primary">{t("From Evolution to Current Rules", "从监管演进进入现行制度")}</h2><p className="mt-3 max-w-3xl editorial-copy">{t("Regulatory concerns evolved from transaction integrity and global-stablecoin risk toward issuer safeguards, redemption, payments oversight and systemic resilience. Current requirements differ by jurisdiction and implementation stage.", "监管关注点由交易完整性与全球稳定币风险，逐步扩展至发行人保障、赎回、支付监管与系统韧性；各辖区的现行要求及实施阶段仍存在明显差异。")}</p></div>
          <Link href="/regulatory" className="inline-flex items-center gap-2 border-b-2 border-primary pb-1 text-base font-semibold text-primary hover:text-foreground">{t("Compare current frameworks", "比较当前监管框架")}<ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <footer className="border-t border-border pt-5 text-sm leading-6 text-foreground/65">{t("The timeline is selective rather than exhaustive. It prioritises official laws, regulators and international standard-setting bodies; current legal obligations should always be checked against the linked primary source.", "本时间线经过筛选，并非穷尽所有政策文件。内容优先采用法律、监管机构及国际标准制定机构的官方来源；现行法律义务应以链接中的原始文件为准。")}</footer>
    </div>
  );
}
