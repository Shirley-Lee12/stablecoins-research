import React from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { ContentEdgeNav } from "@/components/content-edge-nav";
import {
  ArrowRight,
  Building2,
  CircleDollarSign,
  Coins,
  CreditCard,
  ExternalLink,
  FileText,
  Globe2,
  Landmark,
  Play,
  RefreshCcw,
  Send,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";

const LEARNING_PATHS = [
  { href: "/about-stablecoins/history", en: "History", zh: "发展历程", icon: Globe2, descriptionEn: "From private money and e-money to blockchain-based settlement.", descriptionZh: "从私人货币、电子货币到区块链结算工具。" },
  { href: "/about-stablecoins/types", en: "Stablecoin Types", zh: "稳定币类别", icon: CircleDollarSign, descriptionEn: "Compare mechanisms, active projects, and representative historical cases.", descriptionZh: "比较稳定机制、运行项目及有代表性的历史案例。" },
  { href: "/about-stablecoins/applications", en: "Applications", zh: "应用场景", icon: WalletCards, descriptionEn: "Payments, settlement, trading, treasury, and on-chain finance.", descriptionZh: "支付、结算、交易、资金管理与链上金融。" },
  { href: "/about-stablecoins/regulatory-evolution", en: "Regulatory Evolution", zh: "监管演变", icon: Landmark, descriptionEn: "How policy moved from warnings to issuer and payment-system rules.", descriptionZh: "监管如何从风险提示走向发行人与支付体系规则。" },
  { href: "/regulatory", en: "Regulatory Status", zh: "监管现状", icon: ShieldCheck, descriptionEn: "Compare current frameworks and read primary official documents.", descriptionZh: "横向比较现行框架并查阅官方原始文件。" },
];

const READING_RESOURCES = [
  {
    categoryEn: "Official explainer", categoryZh: "官方科普",
    title: "What Are Stablecoins and How Do They Work?",
    org: "Bank of England, 2026",
    descriptionEn: "A plain-language introduction to backing, issuance, wallets, redemption, payments, and the difference from Bitcoin and CBDCs.",
    descriptionZh: "以通俗方式介绍储备、发行、钱包、赎回与支付，并说明稳定币与比特币、央行数字货币的区别。",
    href: "https://www.bankofengland.co.uk/explainers/what-are-stablecoins-and-how-do-they-work",
  },
  {
    categoryEn: "Research overview", categoryZh: "综合报告",
    title: "Understanding Stablecoins",
    org: "International Monetary Fund, 2025",
    descriptionEn: "A stablecoin-specific overview of market development, use cases, risks, and the international regulatory landscape.",
    descriptionZh: "系统梳理稳定币市场发展、应用、风险及国际监管格局。",
    href: "https://www.imf.org/en/publications/departmental-papers/issues/2025/12/02/understanding-stablecoins-570602",
  },
  {
    categoryEn: "Introductory article", categoryZh: "入门文章",
    title: "Stablecoins: Risks, Potential and Regulation",
    org: "International Monetary Fund, 2022",
    descriptionEn: "A concise introduction to why stablecoins can lose their peg and what reserve and governance arrangements matter.",
    descriptionZh: "简要解释稳定币为何可能脱锚，以及储备与治理安排为何重要。",
    href: "https://www.imf.org/en/Publications/fandd/issues/2022/09/Crypto-Stablecoins-are-not-so-stable-Gola",
  },
  {
    categoryEn: "International standard", categoryZh: "国际标准",
    title: "High-level Recommendations for Global Stablecoin Arrangements",
    org: "Financial Stability Board, 2023",
    descriptionEn: "The international baseline for understanding governance, risk management, data, recovery, and redemption expectations.",
    descriptionZh: "理解治理、风险管理、数据、恢复安排与赎回要求的国际基准。",
    href: "https://www.fsb.org/2023/07/high-level-recommendations-for-the-regulation-supervision-and-oversight-of-crypto-asset-activities-and-markets-final-report/",
  },
];

const VIDEO_RESOURCES = [
  {
    title: "What Are Stablecoins? | Back to Basics",
    org: "International Monetary Fund, 2022",
    duration: "3:50",
    descriptionEn: "A short visual primer on how stablecoins work and the risks they can pose.",
    descriptionZh: "用短视频快速了解稳定币的运行方式及其主要风险。",
    href: "https://www.imf.org/en/videos/view/6311646672112",
    thumbnail: "/media/imf-what-are-stablecoins.jpg",
  },
  {
    title: "Stablecoins and the Future of Payments: Evidence from Financial Markets",
    org: "International Monetary Fund, 2026",
    duration: "Seminar",
    descriptionEn: "A research seminar connecting stablecoin adoption with payment markets and financial-system effects.",
    descriptionZh: "从研究证据讨论稳定币采用、支付市场与金融体系影响。",
    href: "https://www.youtube.com/watch?v=kcGlgF3QH0I",
    thumbnail: "/media/imf-stablecoin-payments-seminar.jpg",
  },
];

export default function About() {
  const { t, language } = useLanguage();
  const zh = language === "zh";

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <ContentEdgeNav label={t("On this page", "本页目录")} items={[
        { id: "learn-what", label: t("What it is", "稳定币是什么") },
        { id: "learn-why", label: t("Why it emerged", "为什么兴起") },
        { id: "learn-uses", label: t("Main uses", "主要用途") },
        { id: "learn-questions", label: t("Four questions", "四个问题") },
        { id: "learn-resources", label: t("Learning resources", "科普资料") },
        { id: "learn-topics", label: t("Explore topics", "主题导航") },
      ]} />
      <section className="border-b border-border pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("About Stablecoins", "关于稳定币")}</p>
        <h1 className="mt-3 text-3xl font-serif font-bold text-primary">{t("Learn Stablecoins", "了解稳定币")}</h1>
        <p className="mt-3 max-w-4xl editorial-copy">
          {t("Stablecoins bring familiar monetary promises onto programmable networks. Start with the basic design, the conditions behind their rise, and the questions that distinguish one arrangement from another.", "稳定币把熟悉的货币价值承诺带入可编程网络。可以先了解其基本结构、兴起条件，以及区分不同稳定币安排的关键问题。")}
        </p>
      </section>

      <section id="learn-what" className="scroll-mt-24 py-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(18rem,.72fr)_minmax(0,1.28fr)] lg:items-center">
          <div><p className="editorial-kicker">{t("What is a stablecoin?", "稳定币是什么")}</p><h2 className="mt-3 font-serif text-3xl font-bold text-primary">{t("A transferable token designed to track a reference value", "一种旨在追踪参考价值的可转移代币")}</h2><p className="mt-4 editorial-copy">{t("Most stablecoins target a currency such as the US dollar. What makes them stable is not the token itself, but the surrounding arrangement for assets, issuance, price correction and redemption.", "多数稳定币以美元等货币为锚定对象。真正维持稳定的并不是代币本身，而是围绕储备资产、发行、价格纠偏与赎回建立的整套安排。")}</p></div>
          <div className="relative grid gap-5 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
            {[
              { icon: Landmark, en: "Reference value", zh: "参考价值", bodyEn: "Usually a fiat currency", bodyZh: "通常是一种法定货币", color: "#3558c9" },
              { icon: ShieldCheck, en: "Stability arrangement", zh: "稳定安排", bodyEn: "Assets, rules or incentives", bodyZh: "资产、规则或激励机制", color: "#138a7e" },
              { icon: Coins, en: "Transferable token", zh: "可转移代币", bodyEn: "Moves across digital networks", bodyZh: "在数字网络中流通", color: "#d45f50" },
            ].map((item, index) => <React.Fragment key={item.en}>{index > 0 && <span className="hidden text-2xl text-primary sm:block">+</span>}<div className="border-t-4 pt-5" style={{ borderColor: item.color }}><item.icon className="h-8 w-8" style={{ color: item.color }} /><p className="mt-4 text-lg font-semibold">{zh ? item.zh : item.en}</p><p className="mt-1 text-sm leading-6 text-foreground/75">{zh ? item.bodyZh : item.bodyEn}</p></div></React.Fragment>)}
          </div>
        </div>
      </section>

      <section id="learn-why" className="editorial-section scroll-mt-24">
        <div className="max-w-3xl"><p className="editorial-kicker">{t("Why did stablecoins emerge?", "为什么会兴起")}</p><h2 className="mt-3 font-serif text-3xl font-bold text-primary">{t("Digital markets needed money that could move with them", "数字市场需要一种能够同步流动的货币工具")}</h2></div>
        <div className="relative mt-10 grid gap-10 md:grid-cols-3"><div className="absolute left-[15%] right-[15%] top-8 hidden h-1 bg-gradient-to-r from-[#3558c9] via-[#138a7e] to-[#d45f50] md:block" />{[
          { icon: TrendingUp, en: "Crypto markets", zh: "加密市场", bodyEn: "Traders needed a stable unit for pricing, collateral and settlement.", bodyZh: "交易者需要稳定的报价、抵押与结算单位。", color: "#3558c9" },
          { icon: Send, en: "Always-on settlement", zh: "全天候结算", bodyEn: "Public blockchains made programmable transfers possible at any time.", bodyZh: "公共区块链使资金能够随时进行可编程转移。", color: "#138a7e" },
          { icon: Globe2, en: "Dollar access", zh: "美元获取", bodyEn: "Users and firms sought another route to dollar liquidity across borders.", bodyZh: "个人与企业需要跨境获取美元流动性的补充渠道。", color: "#d45f50" },
        ].map((item) => <div key={item.en} className="relative"><span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-background text-white" style={{ backgroundColor: item.color }}><item.icon className="h-7 w-7" /></span><h3 className="mt-4 text-lg font-semibold">{zh ? item.zh : item.en}</h3><p className="mt-2 text-[15px] leading-7 text-foreground/80">{zh ? item.bodyZh : item.bodyEn}</p></div>)}</div>
      </section>

      <section id="learn-uses" className="editorial-section scroll-mt-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(18rem,.7fr)_minmax(0,1.3fr)]"><div><p className="editorial-kicker">{t("Main uses", "主要用途")}</p><h2 className="mt-3 font-serif text-3xl font-bold text-primary">{t("From market infrastructure to everyday money movement", "从市场基础设施走向日常资金流动")}</h2><Link href="/about-stablecoins/applications" className="mt-5 inline-flex items-center gap-2 font-semibold text-primary hover:underline">{t("Explore application data", "查看应用数据")}<ArrowRight className="h-4 w-4" /></Link></div><div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">{[
          { icon: TrendingUp, en: "Trading and collateral", zh: "交易与抵押", bodyEn: "Quote currency, margin and on-chain liquidity", bodyZh: "报价货币、保证金与链上流动性" },
          { icon: Send, en: "Cross-border transfers", zh: "跨境转移", bodyEn: "Remittances, trade and treasury movement", bodyZh: "汇款、贸易与企业资金调拨" },
          { icon: CreditCard, en: "Payments and settlement", zh: "支付与结算", bodyEn: "Merchant settlement and programmable distribution", bodyZh: "商户结算与可编程分配" },
          { icon: WalletCards, en: "Dollar balances", zh: "美元计价余额", bodyEn: "Working capital and value preservation", bodyZh: "营运资金与价值保存" },
        ].map((item, index) => <div key={item.en} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-border pb-5"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><item.icon className="h-5 w-5" /></span><div><span className="text-xs font-semibold tabular-nums text-primary">0{index + 1}</span><h3 className="mt-1 font-semibold">{zh ? item.zh : item.en}</h3><p className="mt-1 text-sm leading-6 text-foreground/75">{zh ? item.bodyZh : item.bodyEn}</p></div></div>)}</div></div>
      </section>

      <section id="learn-questions" className="editorial-section scroll-mt-24">
        <div className="text-center"><p className="editorial-kicker">{t("Compare different arrangements", "理解不同稳定币")}</p><h2 className="mt-3 font-serif text-3xl font-bold text-primary">{t("Read every stablecoin through four questions", "用四个问题理解每一种稳定币")}</h2></div>
        <div className="relative mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2 lg:min-h-[430px] lg:grid-cols-[1fr_15rem_1fr] lg:items-center">
          <div className="absolute left-1/2 top-1/2 hidden h-[70%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-primary/20 lg:block" />
          {[
            { icon: Building2, en: "Reference", zh: "锚定对象", bodyEn: "What value does it target?", bodyZh: "目标保持什么价值？" },
            { icon: ShieldCheck, en: "Backing", zh: "价值支撑", bodyEn: "What funds redemptions and absorbs losses?", bodyZh: "什么支持赎回并承担损失？" },
            { icon: RefreshCcw, en: "Stabilisation", zh: "稳定方式", bodyEn: "How is the peg restored after a deviation?", bodyZh: "价格偏离后，如何恢复锚定？" },
            { icon: WalletCards, en: "Access", zh: "使用与赎回", bodyEn: "Who may hold, transfer and redeem it?", bodyZh: "谁可以持有、转移和赎回？" },
          ].map((item, index) => <React.Fragment key={item.en}>{index === 2 && <div className="relative z-10 hidden h-44 w-44 items-center justify-center rounded-full bg-primary text-center text-primary-foreground shadow-lg lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:flex"><div><CircleDollarSign className="mx-auto h-8 w-8" /><p className="mt-3 font-serif text-xl font-bold">{t("Stablecoin arrangement", "稳定币安排")}</p></div></div>}<div className={`relative z-10 flex items-start gap-4 bg-background py-4 ${index % 2 ? "lg:col-start-3" : "lg:col-start-1"}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><item.icon className="h-5 w-5" /></span><div><p className="font-semibold">{zh ? item.zh : item.en}</p><p className="mt-1 text-[15px] leading-7 text-foreground/80">{zh ? item.bodyZh : item.bodyEn}</p></div></div></React.Fragment>)}
        </div>
      </section>

      <section id="learn-resources" className="editorial-section">
        <div className="mb-5">
          <h2 className="text-2xl font-serif font-bold text-primary">{t("Selected Learning Resources", "精选科普资料")}</h2>
          <p className="mt-1 editorial-note">{t("Read a direct explainer or report, or choose a video introduction.", "可直接阅读科普文章与报告，或选择视频入门。")}</p>
        </div>
        <div className="grid gap-10 lg:grid-cols-[1.25fr_.75fr]">
          <div>
            <div className="flex items-center gap-2 border-b border-border pb-3"><FileText className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">{t("Articles, Reports & Official Releases", "文章、报告与权威发布")}</h3></div>
            <div className="divide-y divide-border">
              {READING_RESOURCES.map((resource) => <a key={resource.href} href={resource.href} target="_blank" rel="noreferrer" className="group grid gap-2 py-5 sm:grid-cols-[7rem_1fr_auto] sm:gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">{zh ? resource.categoryZh : resource.categoryEn}</p>
                <div><p className="text-base font-semibold leading-6 group-hover:text-primary">{resource.title}</p><p className="mt-1 text-sm text-foreground/65">{resource.org}</p><p className="mt-2 text-[15px] leading-7 text-foreground/75">{zh ? resource.descriptionZh : resource.descriptionEn}</p></div>
                <ExternalLink className="mt-1 h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </a>)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 border-b border-border pb-3"><Play className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">{t("Videos", "科普视频")}</h3></div>
            <div className="space-y-7 pt-5">
              {VIDEO_RESOURCES.map((video) => <a key={video.href} href={video.href} target="_blank" rel="noreferrer" className="group block">
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img src={video.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                  <span className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
                  <span className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-full bg-background/95 text-primary shadow-sm"><Play className="ml-0.5 h-5 w-5 fill-current" /></span>
                  <span className="absolute bottom-4 right-4 bg-background/95 px-2 py-1 text-xs font-semibold text-foreground">{video.duration}</span>
                </div>
                <div className="mt-3 flex items-start justify-between gap-3"><p className="font-medium leading-6 group-hover:text-primary">{video.title}</p><ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" /></div>
                <p className="mt-1 text-sm text-foreground/65">{video.org} · {video.duration}</p>
                <p className="mt-2 text-[15px] leading-7 text-foreground/75">{zh ? video.descriptionZh : video.descriptionEn}</p>
              </a>)}
            </div>
          </div>
        </div>
      </section>

      <section id="learn-topics" className="editorial-section">
        <div className="mb-7"><h2 className="text-2xl font-serif font-bold text-primary">{t("Explore by Topic", "按主题了解")}</h2><p className="mt-1 editorial-note">{t("Continue from the overview to a structured topic.", "从入门概览继续进入结构化主题。")}</p></div>
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {LEARNING_PATHS.map((item, index) => <Link key={item.href} href={item.href}><div className="group h-full border-t-2 border-primary/25 pt-5 transition-colors hover:border-primary"><div className="flex items-center justify-between"><item.icon className="h-5 w-5 text-primary" /><span className="text-xs tabular-nums text-muted-foreground">0{index + 1}</span></div><div className="mt-5 flex items-start justify-between gap-4"><div><h3 className="text-lg font-semibold group-hover:text-primary">{zh ? item.zh : item.en}</h3><p className="mt-2 text-[15px] leading-7 text-foreground/75">{zh ? item.descriptionZh : item.descriptionEn}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" /></div></div></Link>)}
        </div>
      </section>
    </div>
  );
}
