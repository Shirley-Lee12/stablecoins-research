import React from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { Construction, ChevronRight } from "lucide-react";

interface Props {
  titleEn: string;
  titleZh: string;
  parentHref: string;
  parentLabelEn: string;
  parentLabelZh: string;
  descEn?: string;
  descZh?: string;
}

export function PlaceholderPage({
  titleEn, titleZh, parentHref, parentLabelEn, parentLabelZh,
  descEn = "This section is under construction and will be available soon.",
  descZh = "此页面正在建设中，即将上线。",
}: Props) {
  const { language } = useLanguage();
  const zh = language === "zh";

  return (
    <div className="max-w-screen-md mx-auto">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-widest mb-4">
        <Link href={parentHref}>
          <span className="hover:text-primary cursor-pointer transition-colors">{zh ? parentLabelZh : parentLabelEn}</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span>{zh ? titleZh : titleEn}</span>
      </div>
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Construction className="h-8 w-8 text-primary/60" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-serif font-bold text-primary">{zh ? titleZh : titleEn}</h1>
          <p className="text-sm text-muted-foreground max-w-xs">{zh ? descZh : descEn}</p>
        </div>
        <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground/60">
          <div className="h-px w-16 bg-border" />
          <span>{zh ? "敬请期待" : "Coming Soon"}</span>
        </div>
      </div>
    </div>
  );
}

// ── Pre-built sub-page exports ─────────────────────────────────────────────────
export function AboutHistory() {
  return <PlaceholderPage titleEn="History" titleZh="历程" parentHref="/about-stablecoins" parentLabelEn="About Stablecoins" parentLabelZh="关于稳定币" descEn="A timeline of stablecoin development from early experiments to today's trillion-dollar ecosystem." descZh="稳定币发展历程，从早期实验到如今的万亿生态全面回顾。" />;
}
export function AboutTypes() {
  return <PlaceholderPage titleEn="Types" titleZh="种类" parentHref="/about-stablecoins" parentLabelEn="About Stablecoins" parentLabelZh="关于稳定币" descEn="Explore different stablecoin architectures: fiat-backed, crypto-collateralized, algorithmic, and more." descZh="探索各类稳定币架构：法币抵押、加密资产抵押、算法稳定币等。" />;
}
export function AboutApplications() {
  return <PlaceholderPage titleEn="Applications" titleZh="应用" parentHref="/about-stablecoins" parentLabelEn="About Stablecoins" parentLabelZh="关于稳定币" descEn="How stablecoins power DeFi, cross-border payments, and institutional finance." descZh="稳定币如何赋能 DeFi、跨境支付及机构金融。" />;
}
export function AboutRegulatoryEvolution() {
  return <PlaceholderPage titleEn="Regulatory Evolution" titleZh="监管演变" parentHref="/about-stablecoins" parentLabelEn="About Stablecoins" parentLabelZh="关于稳定币" descEn="Track how global regulation of stablecoins has evolved from MiCA to US legislation." descZh="追踪全球稳定币监管从 MiCA 到美国立法的演变历程。" />;
}
export function QuantDimensionA() {
  return <PlaceholderPage titleEn="Dimension A" titleZh="维度 A" parentHref="/quantitative" parentLabelEn="Quantitative Indicators" parentLabelZh="量化指标" descEn="Quantitative dimension A — detailed metrics and analysis to be published." descZh="量化指标维度 A — 详细指标与分析即将发布。" />;
}
export function QuantDimensionB() {
  return <PlaceholderPage titleEn="Dimension B" titleZh="维度 B" parentHref="/quantitative" parentLabelEn="Quantitative Indicators" parentLabelZh="量化指标" descEn="Quantitative dimension B — detailed metrics and analysis to be published." descZh="量化指标维度 B — 详细指标与分析即将发布。" />;
}
export function MarketPriceTracking() {
  return <PlaceholderPage titleEn="Price Tracking" titleZh="价格追踪" parentHref="/market-data" parentLabelEn="Market Data" parentLabelZh="市场数据" descEn="Real-time and historical price data for major stablecoins." descZh="主流稳定币的实时与历史价格数据。" />;
}
export function MarketTradingVolume() {
  return <PlaceholderPage titleEn="Trading Volume" titleZh="交易量" parentHref="/market-data" parentLabelEn="Market Data" parentLabelZh="市场数据" descEn="Exchange-level and on-chain trading volume analytics for the stablecoin market." descZh="交易所级别与链上稳定币交易量分析。" />;
}
export function ProfilePage() {
  return <PlaceholderPage titleEn="My Profile" titleZh="个人资料" parentHref="/" parentLabelEn="Home" parentLabelZh="首页" descEn="View and edit your profile information." descZh="查看和编辑您的个人资料。" />;
}
export function ChangePasswordPage() {
  return <PlaceholderPage titleEn="Change Password" titleZh="修改密码" parentHref="/" parentLabelEn="Home" parentLabelZh="首页" descEn="Update your account password securely." descZh="安全地更新您的账号密码。" />;
}
export function MyContributionsPage() {
  return <PlaceholderPage titleEn="My Contributions" titleZh="我的贡献" parentHref="/academic-resources" parentLabelEn="Resources" parentLabelZh="资源库" descEn="View all resources you have submitted to the platform." descZh="查看您提交到平台的所有文献资源。" />;
}
