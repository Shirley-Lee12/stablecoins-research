import React, { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, ExternalLink, PlayCircle, ShieldAlert } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useLanguage } from "@/lib/language-context";
import { ContentEdgeNav } from "@/components/content-edge-nav";
import { getMechanism, MECHANISM_COLORS } from "@/lib/stablecoin-mechanisms";

type MarketProject = {
  id: string;
  name: string;
  symbol: string;
  mechanism: string;
  currentMarketCapUsd: number;
  historicalPeakUsd: number | null;
  status: "active" | "historical";
  officialUrl: string | null;
  sourceUrl: string;
};

type MarketSnapshot = { projects: MarketProject[] };

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "");
}

function compactUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export default function StablecoinMechanismPage() {
  const [, params] = useRoute("/about-stablecoins/types/:mechanism");
  const { t, language } = useLanguage();
  const zh = language === "zh";
  const mechanism = getMechanism(params?.mechanism);
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${apiBase()}/api/stablecoin-market`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (!cancelled) setSnapshot(data); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const chartData = useMemo(() => (snapshot?.projects ?? [])
    .filter((project) => project.mechanism === mechanism?.id)
    .map((project) => ({
      name: project.symbol || project.name,
      value: project.status === "historical" ? project.historicalPeakUsd ?? 0 : project.currentMarketCapUsd,
      status: project.status,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10), [mechanism?.id, snapshot]);

  if (!mechanism) {
    return <div className="mx-auto max-w-4xl py-16"><p className="text-sm text-muted-foreground">{t("This mechanism is not available.", "未找到该机制。")}</p><Link href="/about-stablecoins/types" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">{t("Back to Stablecoin Types", "返回稳定币类别")}</Link></div>;
  }

  const color = MECHANISM_COLORS[mechanism.id] ?? "#3558c9";
  const flow = zh ? mechanism.flowZh : mechanism.flowEn;
  const strengths = zh ? mechanism.strengths.zh : mechanism.strengths.en;
  const failureModes = zh ? mechanism.failureModes.zh : mechanism.failureModes.en;

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <ContentEdgeNav label={t("On this page", "本页目录")} items={[
        { id: "mechanism-flow", label: t("How it works", "运行方式") },
        { id: "mechanism-risk", label: t("Design and risk", "设计与风险") },
        { id: "mechanism-market", label: t("Market structure", "市场结构") },
        { id: "mechanism-reading", label: t("Reading and video", "资料与视频") },
      ]} />
      <header className="border-b border-border pb-7">
        <Link href="/about-stablecoins/types" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />{t("Stablecoin Types", "稳定币类别")}</Link>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div><span className="mb-4 block h-1 w-14 rounded-sm" style={{ backgroundColor: color }} /><p className="text-xs font-semibold uppercase text-muted-foreground">{t("Mechanism Guide", "机制详解")}</p><h1 className="mt-2 font-serif text-4xl font-semibold text-foreground">{zh ? mechanism.zh : mechanism.en}</h1><p className="mt-4 max-w-3xl editorial-copy">{zh ? mechanism.summaryZh : mechanism.summaryEn}</p></div>
          <div className="border-l-2 pl-4" style={{ borderColor: color }}><p className="text-xs font-semibold uppercase text-muted-foreground">{t("Representative projects", "代表项目")}</p><p className="mt-2 text-sm leading-6 text-foreground">{zh ? mechanism.examplesZh : mechanism.examplesEn}</p></div>
        </div>
      </header>

      <section id="mechanism-flow" aria-labelledby="mechanism-flow-heading" className="scroll-mt-24">
        <div className="mb-6 flex items-end justify-between gap-4"><div><h2 id="mechanism-flow-heading" className="text-2xl font-serif font-bold text-primary">{t("How the mechanism works", "机制如何运行")}</h2><p className="mt-1 editorial-note">{t("A simplified operating sequence; project implementation can differ.", "以下为简化运行路径，具体项目的实现可能存在差异。")}</p></div></div>
        <div className="relative grid gap-8 md:grid-cols-5">
          <div className="absolute left-0 right-0 top-4 hidden h-px md:block" style={{ backgroundColor: `${color}66` }} aria-hidden="true" />
          {flow.map((step, index) => <React.Fragment key={step}><div className="relative pt-12"><span className="absolute left-0 top-0 z-10 flex h-8 w-8 items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: color }}>{String(index + 1).padStart(2, "0")}</span><p className="text-base font-semibold leading-6">{step}</p></div></React.Fragment>)}
        </div>
      </section>

      <section id="mechanism-risk" className="editorial-section grid gap-10 lg:grid-cols-3">
        <div className="border-t-2 pt-5" style={{ borderColor: color }}><p className="text-xs font-semibold uppercase text-muted-foreground">{t("Stabilisation principle", "稳定原理")}</p><p className="mt-3 text-base leading-8 text-foreground/80">{zh ? mechanism.principleZh : mechanism.principleEn}</p></div>
        <div className="border-t-2 pt-5" style={{ borderColor: color }}><p className="text-xs font-semibold uppercase text-muted-foreground">{t("Redemption path", "赎回路径")}</p><p className="mt-3 text-base leading-8 text-foreground/80">{zh ? mechanism.redemptionZh : mechanism.redemptionEn}</p></div>
        <div className="border-t-2 pt-5" style={{ borderColor: color }}><p className="text-xs font-semibold uppercase text-muted-foreground">{t("Risk transmission", "风险传导")}</p><p className="mt-3 text-base leading-8 text-foreground/80">{zh ? mechanism.riskZh : mechanism.riskEn}</p></div>
      </section>

      <section id="mechanism-market" className="editorial-section grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,.65fr)]">
        <div><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{t("Market structure", "市场结构")}</h2><span className="text-xs text-muted-foreground">{t("Current cap; historical projects use peak", "运行项目为当前市值；历史项目为峰值")}</span></div>
          <div className="mt-4 h-[330px] border-y border-border py-5">
            {chartData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} layout="vertical" margin={{ left: 2, right: 30 }}><CartesianGrid stroke="hsl(var(--border))" horizontal={false} /><XAxis type="number" tickFormatter={compactUsd} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={64} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value: number) => compactUsd(value)} contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: 4, boxShadow: "none" }} /><Bar dataKey="value" fill={color} radius={[0, 3, 3, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{t("Market data is loading.", "市场数据正在加载。")}</div>}
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1"><div className="border-t-4 border-emerald-600 pt-5"><p className="text-xs font-semibold uppercase text-emerald-700">{t("Potential strengths", "潜在优势")}</p><ul className="mt-4 space-y-3">{strengths.map((item) => <li key={item} className="flex gap-3 text-[15px] leading-7"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />{item}</li>)}</ul></div><div className="border-t-4 border-amber-600 pt-5"><p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-amber-700"><ShieldAlert className="h-4 w-4" />{t("Failure modes", "失效路径")}</p><ul className="mt-4 space-y-3">{failureModes.map((item) => <li key={item} className="flex gap-3 text-[15px] leading-7"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />{item}</li>)}</ul></div></div>
      </section>

      <section id="mechanism-reading" className={`editorial-section grid gap-10 ${mechanism.video ? "lg:grid-cols-2" : ""}`}>
        <div><h2 className="text-xl font-semibold">{t("Primary and authoritative reading", "一手与权威资料")}</h2><div className="mt-4 divide-y divide-border border-y border-border">{mechanism.references.map((reference) => <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer" className="group flex items-start justify-between gap-5 py-4"><div><p className="text-sm font-semibold group-hover:text-primary group-hover:underline">{reference.title}</p><p className="mt-1 text-xs text-muted-foreground">{reference.publisher}, {reference.year}</p></div><ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" /></a>)}</div></div>
        {mechanism.video && <div><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-xl font-semibold"><PlayCircle className="h-5 w-5 text-primary" />{t("Selected video", "精选视频")}</h2><a href={mechanism.video.watchUrl} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary">{mechanism.video.publisher}<ExternalLink className="ml-1 inline h-3.5 w-3.5" /></a></div><div className="mt-4 aspect-video overflow-hidden bg-black"><iframe className="h-full w-full" src={mechanism.video.embedUrl} title={zh ? mechanism.video.titleZh : mechanism.video.titleEn} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div><p className="mt-3 text-base font-medium">{zh ? mechanism.video.titleZh : mechanism.video.titleEn}</p></div>}
      </section>

      <p className="border-t border-border pt-5 text-xs leading-5 text-muted-foreground">{t("Mechanism labels summarize economic design. They do not imply regulatory status, reserve quality, or investment safety. Follow the primary documents for project-specific terms.", "机制标签仅概括经济设计，并不代表监管属性、储备质量或投资安全性。具体项目应以一手文件为准。")}</p>
    </div>
  );
}
