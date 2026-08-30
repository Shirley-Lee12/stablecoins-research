import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  ArrowRight,
  BarChart3,
  Globe,
  Plus,
  Clock3,
  ExternalLink,
  Landmark,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ContentEdgeNav } from "@/components/content-edge-nav";
import { Link } from "wouter";

const entrySchema = z.object({
  country: z.string().min(1, "Country is required"),
  region: z.string().optional(),
  authority: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  title_zh: z.string().optional(),
  summary: z.string().optional(),
  summary_zh: z.string().optional(),
  document_url: z.string().url().optional().or(z.literal("")),
  effective_date: z.string().min(1, "Date is required"),
  category: z.string().optional(),
});

interface RegulatoryEntry {
  id: number;
  country: string;
  region?: string;
  authority?: string;
  title: string;
  title_zh?: string;
  summary?: string;
  summary_zh?: string;
  document_url?: string;
  effective_date: string;
  category?: string;
}

export const PRIMARY_FRAMEWORKS = [
  {
    country: "United States", countryZh: "美国", status: "Federal framework enacted", statusZh: "联邦框架已立法",
    scope: "Permitted payment stablecoins; federal and qualifying state supervision routes.", scopeZh: "许可支付稳定币；设联邦监管与符合条件的州监管路径。",
    issuer: "Permitted issuers include regulated subsidiaries, insured depository institutions, and approved nonbank issuers.", issuerZh: "许可发行人包括受监管子公司、受保存款机构及获批非银行发行人。",
    reserves: "One-to-one reserve framework with eligible liquid assets; implementing rules and supervision supply operational detail.", reservesZh: "实行一比一储备框架并限定合格流动资产；操作细则由实施规则与监管进一步明确。",
    redemption: "Issuer obligations center on timely redemption at par and an orderly insolvency framework.", redemptionZh: "发行人义务以按面值及时赎回及有序破产处置为核心。",
    controls: "Reserve disclosure, examination, AML obligations, and limits on non-permitted issuers.", controlsZh: "包括储备披露、检查、反洗钱义务及对非许可发行人的限制。",
    source: "U.S. Congress (2025)", href: "https://www.congress.gov/bill/119th-congress/senate-bill/1582",
  },
  {
    country: "European Union", countryZh: "欧盟", status: "MiCA applies", statusZh: "MiCA 已适用",
    scope: "Distinguishes e-money tokens (EMTs) from asset-referenced tokens (ARTs).", scopeZh: "区分电子货币代币（EMT）与资产参考代币（ART）。",
    issuer: "EMT and ART issuers require the authorisation applicable to their token class; significant issuers face enhanced oversight.", issuerZh: "EMT 与 ART 发行人须取得相应类别的授权，重大规模发行人适用强化监管。",
    reserves: "Token-class reserve, custody, liquidity, own-funds, and risk-management requirements.", reservesZh: "按代币类别规定储备、托管、流动性、自有资金与风险管理要求。",
    redemption: "EMTs carry par redemption rights in the referenced official currency; ART redemption follows MiCA rules.", redemptionZh: "EMT 持有人享有按所参考官方货币面值赎回的权利；ART 依 MiCA 规则赎回。",
    controls: "White papers, complaints, conflicts, recovery/redemption planning, and supervisory reporting.", controlsZh: "覆盖白皮书、投诉、利益冲突、恢复与赎回计划及监管报告。",
    source: "European Union (2023)", href: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj",
  },
  {
    country: "United Kingdom", countryZh: "英国", status: "Policy set; final code pending", statusZh: "政策已确定；最终规则待发布",
    scope: "FCA framework for UK-issued qualifying stablecoins; joint Bank/FCA oversight when an issuer is recognised as systemic.", scopeZh: "FCA 监管英国发行的合格稳定币；发行人被认定为系统性后由英格兰银行与 FCA 联合监管。",
    issuer: "Two-part regime separates non-systemic conduct regulation from systemic prudential and financial-stability oversight.", issuerZh: "双层制度区分非系统性行为监管与系统性审慎、金融稳定监管。",
    reserves: "For systemic sterling stablecoins, the 2026 policy permits high-quality backing including central-bank deposits and limited short-term UK government debt; draft rules remain to be finalised.", reservesZh: "对系统性英镑稳定币，2026 年政策允许央行存款及一定比例短期英国国债等高质量支持资产；规则草案仍待最终确定。",
    redemption: "Systemic issuers are expected to support face-value redemption in sterling under the policy and draft code.", redemptionZh: "政策声明与规则草案要求系统性发行人支持按英镑面值赎回。",
    controls: "Joint transition, capital, recovery, operational resilience, custody, and consumer-protection requirements.", controlsZh: "涵盖联合监管转换、资本、恢复、运营韧性、托管与消费者保护。",
    source: "Bank of England / FCA (2026)", href: "https://www.bankofengland.co.uk/paper/2026/boe-and-fcas-approach-to-joint-regulation-of-systemic-stablecoin-issuers",
  },
  {
    country: "Hong Kong", countryZh: "中国香港", status: "Issuer licensing in force", statusZh: "发行人发牌制已生效",
    scope: "In-scope fiat-referenced stablecoins offered in Hong Kong or issued by Hong Kong entities.", scopeZh: "覆盖在香港要约或由香港实体发行的范围内法币参考稳定币。",
    issuer: "Issuers must be licensed by the HKMA and meet governance, local presence, and fitness requirements.", issuerZh: "发行人须获香港金管局发牌，并符合治理、本地实体及适当人选要求。",
    reserves: "Full backing by high-quality, highly liquid reserve assets with segregation, custody, and risk-management controls.", reservesZh: "以高质量、高流动性储备资产充分支持，并实施隔离、托管与风险管理。",
    redemption: "Licensed issuers must provide par redemption in accordance with the Ordinance and supervisory guideline.", redemptionZh: "持牌发行人须依《条例》及监管指引提供按面值赎回。",
    controls: "Disclosure, audit, complaint handling, recovery, business continuity, and dedicated AML/CFT guidance.", controlsZh: "覆盖披露、审计、投诉、恢复、业务连续性及专门反洗钱/反恐融资指引。",
    source: "HKMA (2025)", href: "https://www.info.gov.hk/gia/general/202507/29/P2025072900703.htm",
  },
  {
    country: "Singapore", countryZh: "新加坡", status: "Framework finalised", statusZh: "框架已定稿",
    scope: "Singapore-issued single-currency stablecoins pegged to SGD or a G10 currency.", scopeZh: "覆盖在新加坡发行、锚定新元或 G10 货币的单一货币稳定币。",
    issuer: "Banks and nonbank issuers may fall within the framework; qualifying issuers may use the MAS-regulated label.", issuerZh: "银行及非银行发行人可适用该框架；符合要求者可使用 MAS 监管标签。",
    reserves: "Low-risk, highly liquid reserve assets, segregation, custody, and valuation expectations.", reservesZh: "要求低风险、高流动性储备资产，并规定隔离、托管与估值安排。",
    redemption: "Par redemption and timely fulfilment are central features of the finalised framework.", redemptionZh: "按面值赎回与及时履行为定稿框架的核心要求。",
    controls: "Capital, disclosure, audit, business restrictions, and prudential safeguards.", controlsZh: "涵盖资本、披露、审计、业务限制及审慎保障。",
    source: "MAS (2023)", href: "https://www.sgpc.gov.sg/api/file/getfile/Media%20Release_MAS%20Finalises%20Stablecoin%20Regulatory%20Framework.pdf?path=%2Fsgpcmedia%2Fmedia_releases%2Fmas%2Fpress_release%2FP-20230815-2%2Fattachment%2FMedia+Release_MAS+Finalises+Stablecoin+Regulatory+Framework.pdf",
  },
  {
    country: "Japan", countryZh: "日本", status: "Electronic payment instrument regime in force", statusZh: "电子支付工具制度已生效",
    scope: "Fiat-linked, par-redeemable stablecoins are treated as electronic payment instruments.", scopeZh: "与法币挂钩且承诺按面值赎回的稳定币被视为电子支付工具。",
    issuer: "Issuance is limited to legally eligible entities; intermediaries must register as electronic payment instrument service providers.", issuerZh: "发行限于法律规定的合格主体；中介须登记为电子支付工具服务提供商。",
    reserves: "Backing and safeguarding follow the issuer's legal form and applicable banking, funds-transfer, or trust framework.", reservesZh: "价值支持与资产保障依发行人的法律形式及适用银行、资金转移或信托制度确定。",
    redemption: "The regulated category is defined around redemption at par in the referenced fiat currency.", redemptionZh: "受监管类别以可按所参考法币面值赎回为重要界定条件。",
    controls: "Registration, customer protection, asset management, AML/CFT, and travel-rule obligations.", controlsZh: "包括登记、客户保护、资产管理、反洗钱/反恐融资及转账信息规则。",
    source: "Japan FSA (2023)", href: "https://www.fsa.go.jp/common/shinsei/dendai/dentori.html",
  },
  {
    country: "United Arab Emirates", countryZh: "阿联酋", status: "Multi-authority regime in force", statusZh: "多监管机构制度已生效",
    scope: "CBUAE payment-token activities coexist with virtual-asset rules in Dubai and financial free zones.", scopeZh: "中央银行支付代币规则与迪拜及金融自由区的虚拟资产规则并行。",
    issuer: "Licensing depends on the activity, token, location, and relevant authority; CBUAE regulates payment-token services in its perimeter.", issuerZh: "许可取决于业务、代币、地域及主管机构；中央银行负责其范围内支付代币服务。",
    reserves: "Fiat-referenced payment tokens and VARA-regulated FRVAs are subject to backing, custody, and risk controls under the applicable rulebook.", reservesZh: "法币参考支付代币及 VARA 监管的 FRVA 须按适用规则满足储备、托管与风险控制要求。",
    redemption: "Applicable regimes emphasize redemption and customer-asset protection, with details varying by authority.", redemptionZh: "相关制度强调赎回与客户资产保护，具体要求依主管机构而异。",
    controls: "Governance, safeguarding, technology, AML/CFT, disclosure, and conduct requirements.", controlsZh: "涵盖治理、资产保障、技术、反洗钱/反恐融资、披露与行为规范。",
    source: "CBUAE / VARA (2024–2026)", href: "https://rulebook.centralbank.ae/en/rulebook/payment-token-services-regulation",
  },
  {
    country: "China (Mainland)", countryZh: "中国大陆", status: "Restrictive perimeter", statusZh: "限制性监管边界",
    scope: "Private stablecoins are treated as virtual currencies rather than legal tender; virtual-currency-related business activities remain outside the permitted domestic financial perimeter.", scopeZh: "私人稳定币被视为虚拟货币而非法定货币；虚拟货币相关业务活动仍不属于境内获准金融业务范围。",
    issuer: "There is no domestic licensing route for private stablecoin issuance or operating a stablecoin business for mainland residents.", issuerZh: "目前不存在面向中国大陆居民开展私人稳定币发行或经营业务的境内许可路径。",
    reserves: "No dedicated prudential reserve regime applies because private stablecoin issuance and trading are not authorised activities.", reservesZh: "由于私人稳定币发行与交易并非获准业务，因此没有专门适用的审慎储备制度。",
    redemption: "There is no regulated public redemption framework for private stablecoins in the mainland market.", redemptionZh: "中国大陆市场不存在针对私人稳定币的受监管公众赎回框架。",
    controls: "Authorities focus on payment-channel controls, AML, cross-border service restrictions, enforcement, and investor risk warnings.", controlsZh: "监管重点包括支付渠道管控、反洗钱、限制境外平台向境内居民提供服务、执法与风险提示。",
    source: "PBOC (2021; reaffirmed 2025)", href: "https://www.pbc.gov.cn/en/3688110/3688172/5552468/2025121116132332435/index.html",
  },
];

export const OFFICIAL_DOCUMENTS = [
  { country: "United States", countryZh: "美国", documents: [
    { title: "GENIUS Act of 2025 (S. 1582)", authority: "U.S. Congress", year: "2025", href: "https://www.congress.gov/bill/119th-congress/senate-bill/1582" },
  ] },
  { country: "European Union", countryZh: "欧盟", documents: [
    { title: "Regulation (EU) 2023/1114 on Markets in Crypto-assets (MiCA)", authority: "European Union", year: "2023", href: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj" },
    { title: "Asset-referenced and E-money Tokens under MiCA", authority: "European Banking Authority", year: "Current", href: "https://www.eba.europa.eu/regulation-and-policy/asset-referenced-and-e-money-tokens-mica" },
  ] },
  { country: "United Kingdom", countryZh: "英国", documents: [
    { title: "Sterling-denominated Systemic Stablecoins: Policy Statement and Draft Code", authority: "Bank of England", year: "2026", href: "https://www.bankofengland.co.uk/paper/2026/ps/sterling-denominated-systemic-stablecoin" },
    { title: "Bank of England and FCA Joint Regulatory Approach", authority: "Bank of England / FCA", year: "2026", href: "https://www.bankofengland.co.uk/paper/2026/boe-and-fcas-approach-to-joint-regulation-of-systemic-stablecoin-issuers" },
    { title: "Financial Services and Markets Act 2023", authority: "UK Parliament", year: "2023", href: "https://www.legislation.gov.uk/ukpga/2023/29/contents" },
  ] },
  { country: "Hong Kong", countryZh: "中国香港", documents: [
    { title: "Implementation of the Regulatory Regime for Stablecoin Issuers", authority: "HKMA", year: "2025", href: "https://www.info.gov.hk/gia/general/202507/29/P2025072900703.htm" },
    { title: "Guideline on Supervision of Licensed Stablecoin Issuers", authority: "HKMA", year: "2025", href: "https://www.hkma.gov.hk/media/eng/doc/key-functions/ifc/stablecoin-issuers/Guideline_on_supervision_of_licensed_stablecoin_issuers_eng.pdf" },
    { title: "Guideline on AML/CFT for Licensed Stablecoin Issuers", authority: "HKMA", year: "2025", href: "https://www.hkma.gov.hk/media/eng/doc/key-functions/banking-stability/aml-cft/Guideline_on_Anti-Money_Laundering_and_Counter-Financing_of_Terrorism_For_Licensed_Stablecoin_Issuers_eng.pdf" },
  ] },
  { country: "Singapore", countryZh: "新加坡", documents: [
    { title: "MAS Finalises Stablecoin Regulatory Framework", authority: "Monetary Authority of Singapore", year: "2023", href: "https://www.sgpc.gov.sg/api/file/getfile/Media%20Release_MAS%20Finalises%20Stablecoin%20Regulatory%20Framework.pdf?path=%2Fsgpcmedia%2Fmedia_releases%2Fmas%2Fpress_release%2FP-20230815-2%2Fattachment%2FMedia+Release_MAS+Finalises+Stablecoin+Regulatory+Framework.pdf" },
  ] },
  { country: "Japan", countryZh: "日本", documents: [
    { title: "Electronic Payment Instrument Exchange Service Providers", authority: "Japan Financial Services Agency", year: "Current", href: "https://www.fsa.go.jp/common/shinsei/dendai/dentori.html" },
    { title: "Regulatory Framework for Crypto-assets and Stablecoins", authority: "Japan Financial Services Agency", year: "2022", href: "https://www.fsa.go.jp/inter/etc/20221207/01.pdf" },
  ] },
  { country: "United Arab Emirates", countryZh: "阿联酋", documents: [
    { title: "Payment Token Services Regulation", authority: "Central Bank of the UAE", year: "2024", href: "https://rulebook.centralbank.ae/en/rulebook/payment-token-services-regulation" },
    { title: "Fiat-referenced Virtual Assets Issuance Rules", authority: "Dubai VARA", year: "Current", href: "https://rulebooks.vara.ae/rulebook/annex-1-fiat-referenced-virtual-assets-issuance-rules" },
  ] },
  { country: "China (Mainland)", countryZh: "中国大陆", documents: [
    { title: "Notice on Further Preventing and Resolving the Risks of Virtual Currency Trading and Speculation", authority: "People's Bank of China and other authorities", year: "2021", href: "https://www.pbc.gov.cn/goutongjiaoliu/113456/113469/4348521/index.html" },
    { title: "Joint Meeting to Curb Speculation in Virtual Currency Trading", authority: "People's Bank of China", year: "2025", href: "https://www.pbc.gov.cn/en/3688110/3688172/5552468/2025121116132332435/index.html" },
  ] },
];

const CURRENT_POSITIONS = [
  { country: "United States", stage: "In force", stageZh: "已生效", framework: "GENIUS Act", timing: "2025", color: "#1f7a5b" },
  { country: "European Union", stage: "In force", stageZh: "已生效", framework: "MiCA", timing: "2023–2024", color: "#1f7a5b" },
  { country: "Hong Kong", stage: "In force", stageZh: "已生效", framework: "Stablecoins Ordinance", timing: "2025", color: "#1f7a5b" },
  { country: "Japan", stage: "In force", stageZh: "已生效", framework: "Payment Services Act", timing: "2023", color: "#1f7a5b" },
  { country: "United Arab Emirates", stage: "In force", stageZh: "已生效", framework: "Payment Token Services Regulation", timing: "2024", color: "#1f7a5b" },
  { country: "Singapore", stage: "Framework finalised", stageZh: "框架已定稿", framework: "MAS SCS Framework", timing: "2023", color: "#2f64c7" },
  { country: "United Kingdom", stage: "Implementation in progress", stageZh: "实施中", framework: "FSMA / FCA and Bank rules", timing: "2026–2027", color: "#c8791d" },
  { country: "China (Mainland)", stage: "Restrictive perimeter", stageZh: "限制性边界", framework: "Virtual-currency restrictions", timing: "2021–2025", color: "#9b3d4a" },
] as const;

const COMMON_DIRECTIONS = [
  { en: "Licensing or authorisation before issuance", zh: "发行前许可或授权" },
  { en: "Segregated, liquid backing assets", zh: "储备资产隔离与高流动性要求" },
  { en: "Clear legal claim and timely redemption", zh: "清晰法律请求权与及时赎回" },
  { en: "Disclosure, governance and operational resilience", zh: "披露、治理与运营韧性" },
];

const KEY_DIVERGENCES = [
  { en: "Who may issue: banks only, nonbanks, trusts, or multiple routes", zh: "谁可发行：银行、非银行、信托或多种准入路径" },
  { en: "Which tokens qualify and whether offshore issuance is captured", zh: "哪些代币适用，以及是否覆盖境外发行" },
  { en: "Treatment of interest, investment returns and wallet access", zh: "计息、投资收益与钱包准入的处理方式" },
  { en: "Allocation of authority across conduct, prudential and payment regulators", zh: "行为、审慎与支付监管机构之间的权限分配" },
];

const RECENT_UPDATES = [
  { date: "2026-06", en: "UK authorities published final FCA policy and draft systemic-stablecoin rules.", zh: "英国监管机构发布 FCA 最终政策及系统性稳定币规则草案。", href: "https://www.bankofengland.co.uk/paper/2026/boe-and-fcas-approach-to-joint-regulation-of-systemic-stablecoin-issuers" },
  { date: "2025-08", en: "Hong Kong's issuer-licensing regime entered into force.", zh: "香港稳定币发行人发牌制度正式生效。", href: "https://www.info.gov.hk/gia/general/202507/29/P2025072900703.htm" },
  { date: "2025-07", en: "The United States enacted a federal payment-stablecoin framework.", zh: "美国通过联邦支付稳定币监管框架。", href: "https://www.congress.gov/bill/119th-congress/senate-bill/1582" },
  { date: "2025-11", en: "Mainland Chinese authorities reaffirmed the restrictive virtual-currency perimeter, including stablecoins.", zh: "中国大陆监管部门重申包括稳定币在内的虚拟货币限制性监管边界。", href: "https://www.pbc.gov.cn/en/3688110/3688172/5552468/2025121116132332435/index.html" },
];

const INTERNATIONAL_BASELINES = [
  { organisation: "FSB", year: "2023", en: "Comprehensive oversight of global stablecoin arrangements, including governance, risk management, disclosure and redemption.", zh: "对全球稳定币安排实施全面监管，覆盖治理、风险管理、披露与赎回。", href: "https://www.fsb.org/2023/07/high-level-recommendations-for-the-regulation-supervision-and-oversight-of-global-stablecoin-arrangements-final-report/" },
  { organisation: "FATF", year: "2021", en: "Risk-based AML/CFT treatment of virtual assets and service providers, expressly considering stablecoins.", zh: "对虚拟资产及服务提供商实施风险为本的反洗钱与反恐融资监管，并明确涵盖稳定币。", href: "https://www.fatf-gafi.org/en/publications/Fatfrecommendations/Guidance-rba-virtual-assets-2021.html" },
  { organisation: "CPMI–IOSCO", year: "2022", en: "Application of the PFMI to systemically important stablecoin arrangements that perform a transfer function.", zh: "将《金融市场基础设施原则》适用于承担转移功能且具有系统重要性的稳定币安排。", href: "https://www.bis.org/cpmi/publ/d206.htm" },
];

function apiBase() {
  return (
    import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL
  ).replace(/\/$/, "");
}

export default function Regulatory() {
  const { t, language } = useLanguage();
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [selectedCountry, setSelectedCountry] = useState<string>(
    CURRENT_POSITIONS[0].country,
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [entries, setEntries] = useState<RegulatoryEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesRefresh, setEntriesRefresh] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!selectedCountry) {
      setEntries([]);
      return;
    }
    const controller = new AbortController();
    setEntriesLoading(true);
    fetch(
      `${apiBase()}/api/regulatory-entries?country=${encodeURIComponent(selectedCountry)}`,
      { signal: controller.signal },
    )
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch country entries");
        return response.json();
      })
      .then(setEntries)
      .catch((error) => {
        if (error.name !== "AbortError") setEntries([]);
      })
      .finally(() => setEntriesLoading(false));
    return () => controller.abort();
  }, [selectedCountry, entriesRefresh]);

  const selectedDocuments = useMemo(
    () =>
      OFFICIAL_DOCUMENTS.find((group) => group.country === selectedCountry)
        ?.documents ?? [],
    [selectedCountry],
  );

  const additionalEntries = useMemo(() => {
    const officialUrls = new Set(selectedDocuments.map((document) => document.href));
    return entries.filter(
      (entry) => !entry.document_url || !officialUrls.has(entry.document_url),
    );
  }, [entries, selectedDocuments]);

  const stageSummary = useMemo(() => {
    const counts = new Map<string, { count: number; color: string; labelZh: string }>();
    CURRENT_POSITIONS.forEach((position) => {
      const current = counts.get(position.stage);
      counts.set(position.stage, {
        count: (current?.count ?? 0) + 1,
        color: position.color,
        labelZh: position.stageZh,
      });
    });
    return Array.from(counts.entries()).map(([stage, details]) => ({
      stage,
      ...details,
      share: (details.count / CURRENT_POSITIONS.length) * 100,
    }));
  }, []);

  const form = useForm<z.infer<typeof entrySchema>>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      country: "",
      region: "",
      authority: "",
      title: "",
      title_zh: "",
      summary: "",
      summary_zh: "",
      document_url: "",
      effective_date: format(new Date(), "yyyy-MM-dd"),
      category: "legislation",
    },
  });

  const onSubmit = async (values: z.infer<typeof entrySchema>) => {
    if (!token) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${apiBase()}/api/regulatory-entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error("Failed to save regulatory entry");
      setSelectedCountry(values.country);
      setEntriesRefresh((value) => value + 1);
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: t("Entry saved", "条目已保存"),
        description: t(
          "The official-source list has been updated.",
          "官方来源列表已更新。",
        ),
      });
    } catch {
      toast({
        title: t("Unable to save", "无法保存"),
        description: t(
          "Please check the entry and try again.",
          "请检查条目后重试。",
        ),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <ContentEdgeNav label={t("On this page", "本页目录")} items={[
        { id: "regulatory-introduction", label: t("Introduction", "监管概览") },
        { id: "regulatory-comparison", label: t("Jurisdiction comparison", "辖区比较") },
        { id: "regulatory-current-status", label: t("Current status", "当前状态") },
        { id: "regulatory-analysis", label: t("Cross-jurisdiction analysis", "跨辖区分析") },
        { id: "regulatory-baselines", label: t("International baselines", "国际监管基准") },
      ]} />
      <div id="regulatory-introduction" className="scroll-mt-24 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-primary tracking-tight">
            {t("Regulatory Status", "监管现状")}
          </h2>
          <p className="mt-2 max-w-4xl editorial-copy">
            {t(
              "Compare current requirements across eight core jurisdictions, open the controlling official sources, and distinguish rules in force from frameworks still being implemented.",
              "比较八个重点辖区的现行监管要求，查阅具有控制效力的官方原文，并区分已生效规则与仍在实施中的框架。",
            )}
          </p>
        </div>

        {user?.role === "admin" && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                {t("Add Entry", "添加条目")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {t("Add Regulatory Entry", "添加监管条目")}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("Title (EN)", "标题 (英文)")}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="title_zh"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("Title (ZH)", "标题 (中文)")}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Country", "国家/地区")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g. USA, EU, China"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("Region/State", "州/省 (可选)")}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="effective_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("Effective Date", "生效日期")}
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="authority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("Regulatory Authority", "监管机构")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g. SEC, ECB, PBOC"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Category", "类别")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="legislation, guidance, warning..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="summary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("Summary (EN)", "摘要 (英文)")}
                          </FormLabel>
                          <FormControl>
                            <Textarea className="h-24" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="summary_zh"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("Summary (ZH)", "摘要 (中文)")}
                          </FormLabel>
                          <FormControl>
                            <Textarea className="h-24" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="document_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("Official Document URL", "官方文件链接")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving
                      ? t("Saving...", "保存中...")
                      : t("Save Entry", "保存条目")}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <section id="regulatory-comparison" className="editorial-section">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-serif font-bold text-primary">{t("Jurisdiction Comparison", "重点辖区监管比较")}</h3>
        </div>
        <p className="mt-2 max-w-4xl editorial-note">
          {t("The table compares regulatory perimeter, issuer access, reserves, redemption, and ongoing controls. Status labels distinguish rules in force from policy positions or draft rules that still require implementation.", "本表按监管范围、发行主体、储备、赎回和持续监管要求进行横向比较，并明确区分已生效规则、已确定政策与仍待实施的规则草案。")}
        </p>
        <div className="mt-6 overflow-x-auto border-y border-border">
          <table className="w-full min-w-[1500px] text-left">
            <thead className="border-b border-border bg-muted/35 text-xs uppercase tracking-[0.06em] text-muted-foreground">
              <tr>
                <th className="sticky left-0 z-10 w-52 bg-muted px-4 py-3 font-medium">{t("Jurisdiction & status", "辖区与状态")}</th>
                <th className="w-60 px-4 py-3 font-medium">{t("Scope & classification", "监管范围与分类")}</th>
                <th className="w-64 px-4 py-3 font-medium">{t("Issuer & licensing", "发行主体与许可")}</th>
                <th className="w-72 px-4 py-3 font-medium">{t("Reserves & safeguarding", "储备与资产保障")}</th>
                <th className="w-64 px-4 py-3 font-medium">{t("Redemption", "赎回")}</th>
                <th className="w-72 px-4 py-3 font-medium">{t("Disclosure, AML & controls", "披露、反洗钱与持续监管")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PRIMARY_FRAMEWORKS.map((framework) => <tr key={framework.country} className="align-top hover:bg-muted/20">
                <th className="sticky left-0 z-10 bg-card px-4 py-5 font-normal">
                  <a href={framework.href} target="_blank" rel="noreferrer" className="group block">
                    <span className="font-semibold group-hover:text-primary">{language === "zh" ? framework.countryZh : framework.country}<ExternalLink className="ml-1 inline h-3.5 w-3.5" /></span>
                    <span className="mt-2 block text-xs font-medium leading-5 text-primary">{language === "zh" ? framework.statusZh : framework.status}</span>
                    <span className="mt-3 block text-xs text-muted-foreground">{framework.source}</span>
                  </a>
                </th>
                <td className="px-4 py-5 text-[15px] leading-7 text-foreground/75">{language === "zh" ? framework.scopeZh : framework.scope}</td>
                <td className="px-4 py-5 text-[15px] leading-7 text-foreground/75">{language === "zh" ? framework.issuerZh : framework.issuer}</td>
                <td className="px-4 py-5 text-[15px] leading-7 text-foreground/75">{language === "zh" ? framework.reservesZh : framework.reserves}</td>
                <td className="px-4 py-5 text-[15px] leading-7 text-foreground/75">{language === "zh" ? framework.redemptionZh : framework.redemption}</td>
                <td className="px-4 py-5 text-[15px] leading-7 text-foreground/75">{language === "zh" ? framework.controlsZh : framework.controls}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="editorial-section">
        <div className="grid min-w-0 gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-16">
          <div id="regulatory-current-status" className="min-w-0 scroll-mt-24">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <h3 className="font-serif text-2xl font-bold text-primary">
                {t("Current Position and Sources", "当前监管状态与官方来源")}
              </h3>
            </div>
            <p className="mt-2 editorial-note">
              {t(
                "Controlling laws, rules and regulator guidance determine both the substantive requirements and the stage at which each jurisdiction's framework takes effect.",
                "具有控制效力的法律、规则与监管指引共同决定各辖区的实质监管要求及制度生效阶段。",
              )}
            </p>

            <div className="mt-6 overflow-x-auto border-y border-border">
              <table className="w-full min-w-[680px] text-left">
                <thead className="border-b border-border bg-muted/30 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("Jurisdiction", "辖区")}</th>
                    <th className="px-4 py-3 font-medium">{t("Implementation stage", "实施阶段")}</th>
                    <th className="px-4 py-3 font-medium">{t("Core framework", "核心框架")}</th>
                    <th className="px-4 py-3 text-right font-medium">{t("Timing", "时间")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {CURRENT_POSITIONS.map((position) => {
                    const framework = PRIMARY_FRAMEWORKS.find(
                      (item) => item.country === position.country,
                    );
                    const isSelected = selectedCountry === position.country;
                    return (
                      <tr key={position.country} className={isSelected ? "bg-primary/[0.06]" : "hover:bg-muted/20"}>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedCountry(position.country)}
                            className="flex w-full items-center gap-2 text-left font-semibold text-foreground hover:text-primary"
                            aria-pressed={isSelected}
                          >
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: position.color }} />
                            {language === "zh" ? framework?.countryZh : position.country}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium" style={{ color: position.color }}>
                          {language === "zh" ? position.stageZh : position.stage}
                        </td>
                        <td className="px-4 py-4 text-sm text-foreground/80">{position.framework}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-muted-foreground">{position.timing}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-8 border-t-2 border-primary pt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h4 className="text-xl font-bold text-foreground">
                  {language === "zh"
                    ? OFFICIAL_DOCUMENTS.find((group) => group.country === selectedCountry)?.countryZh
                    : selectedCountry}
                  <span className="ml-2 font-normal text-muted-foreground">{t("official sources", "官方原文")}</span>
                </h4>
                <span className="text-sm text-muted-foreground">
                  {selectedDocuments.length + additionalEntries.length} {t("documents", "份文件")}
                </span>
              </div>

              <div className="mt-3 divide-y divide-border border-b border-border">
                {selectedDocuments.map((document) => (
                  <a key={document.href} href={document.href} target="_blank" rel="noreferrer" className="group grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-5">
                    <span>
                      <span className="block font-medium leading-6 text-foreground group-hover:text-primary group-hover:underline">{document.title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{document.authority} · {document.year}</span>
                    </span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                ))}
                {entriesLoading ? (
                  <div className="py-4"><Skeleton className="h-12 w-full" /></div>
                ) : (
                  additionalEntries.map((entry) => {
                    const content = (
                      <>
                        <span className="block font-medium leading-6 text-foreground group-hover:text-primary group-hover:underline">
                          {language === "zh" && entry.title_zh ? entry.title_zh : entry.title}
                        </span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {entry.authority || t("Official source", "官方来源")} · {format(new Date(entry.effective_date), "yyyy-MM-dd")}
                        </span>
                      </>
                    );
                    return entry.document_url ? (
                      <a key={entry.id} href={entry.document_url} target="_blank" rel="noreferrer" className="group grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-5">
                        <span>{content}</span><ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </a>
                    ) : (
                      <div key={entry.id} className="group py-4">{content}</div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <aside id="regulatory-analysis" className="min-w-0 scroll-mt-24 lg:border-l lg:border-border lg:pl-10">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="font-serif text-2xl font-bold text-primary">
                {t("How to Read the Comparison", "如何理解跨辖区比较")}
              </h3>
            </div>
            <p className="mt-2 editorial-note">
              {t(
                "The jurisdictions are converging on several safeguards, but not on institutional form, regulatory perimeter or implementation speed.",
                "各辖区正在若干保障措施上趋同，但在制度形式、监管边界与实施速度上仍存在明显差异。",
              )}
            </p>

            <div className="mt-7">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="text-4xl font-semibold text-foreground">{CURRENT_POSITIONS.length}</span>
                  <span className="ml-2 text-sm text-muted-foreground">{t("core jurisdictions", "个重点辖区")}</span>
                </div>
                <span className="text-xs text-muted-foreground">{t("Verified 27 Aug 2026", "核验于 2026-08-27")}</span>
              </div>
              <div className="mt-4 flex h-3 overflow-hidden rounded-sm" aria-label={t("Distribution of implementation stages", "监管实施阶段分布")}>
                {stageSummary.map((stage) => (
                  <span key={stage.stage} style={{ width: `${stage.share}%`, backgroundColor: stage.color }} title={`${language === "zh" ? stage.labelZh : stage.stage}: ${stage.count}`} />
                ))}
              </div>
              <div className="mt-4 grid gap-x-5 gap-y-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {stageSummary.map((stage) => (
                  <div key={stage.stage} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-foreground/80"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />{language === "zh" ? stage.labelZh : stage.stage}</span>
                    <strong>{stage.count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-9 grid gap-8 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold uppercase text-[#1f7a5b]"><ShieldCheck className="h-4 w-4" />{t("Common direction", "共同趋势")}</div>
                <div className="mt-3 divide-y divide-border border-t border-border">
                  {COMMON_DIRECTIONS.map((item, index) => <p key={item.en} className="py-3 text-[15px] leading-6 text-foreground/85"><span className="mr-2 font-semibold text-[#1f7a5b]">0{index + 1}</span>{language === "zh" ? item.zh : item.en}</p>)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold uppercase text-[#9b3d4a]"><Scale className="h-4 w-4" />{t("Key divergence", "关键分歧")}</div>
                <div className="mt-3 divide-y divide-border border-t border-border">
                  {KEY_DIVERGENCES.map((item, index) => <p key={item.en} className="py-3 text-[15px] leading-6 text-foreground/85"><span className="mr-2 font-semibold text-[#9b3d4a]">0{index + 1}</span>{language === "zh" ? item.zh : item.en}</p>)}
                </div>
              </div>
            </div>

            <div className="mt-9 border-t-2 border-primary pt-5">
              <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" /><h4 className="font-semibold text-foreground">{t("Recent changes", "近期变化")}</h4></div>
              <div className="mt-2 divide-y divide-border">
                {RECENT_UPDATES.map((update) => (
                  <a key={update.href} href={update.href} target="_blank" rel="noreferrer" className="group grid grid-cols-[5.5rem_1fr_auto] gap-3 py-3 text-sm leading-6">
                    <span className="font-mono text-xs text-muted-foreground">{update.date}</span>
                    <span className="text-foreground/85 group-hover:text-primary">{language === "zh" ? update.zh : update.en}</span>
                    <ExternalLink className="mt-1 h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                  </a>
                ))}
              </div>
            </div>

            <Link href="/about-stablecoins/regulatory-evolution" className="mt-7 inline-flex items-center gap-2 border-b-2 border-primary pb-1 font-semibold text-primary hover:text-foreground">
              {t("See how these regimes evolved", "查看这些制度如何演进")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>

      <section id="regulatory-baselines" className="editorial-section scroll-mt-24">
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-primary" />
          <h3 className="font-serif text-2xl font-bold text-primary">{t("International Regulatory Baselines", "国际监管基准")}</h3>
        </div>
        <p className="mt-2 max-w-4xl editorial-note">
          {t(
            "These standards coordinate regulatory outcomes across borders. They are not jurisdictions and do not replace domestic law.",
            "这些标准用于协调跨境监管结果；它们不是司法辖区，也不能替代各辖区国内法。",
          )}
        </p>
        <div className="mt-6 grid border-y border-border md:grid-cols-3 md:divide-x md:divide-border">
          {INTERNATIONAL_BASELINES.map((baseline) => (
            <a key={baseline.organisation} href={baseline.href} target="_blank" rel="noreferrer" className="group border-b border-border py-6 last:border-b-0 md:border-b-0 md:px-6 md:first:pl-0 md:last:pr-0">
              <div className="flex items-center justify-between gap-4">
                <span className="text-lg font-bold text-foreground group-hover:text-primary">{baseline.organisation}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">{baseline.year}<ExternalLink className="h-3.5 w-3.5" /></span>
              </div>
              <p className="mt-3 text-[15px] leading-7 text-foreground/80">{language === "zh" ? baseline.zh : baseline.en}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
