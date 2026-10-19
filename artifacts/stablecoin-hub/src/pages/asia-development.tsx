import React, { useMemo } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CircleAlert,
  CircleCheckBig,
  CircleDashed,
  ExternalLink,
  FileText,
  Landmark,
  MapPinned,
  Route,
  Scale,
  Telescope,
  WalletCards,
} from "lucide-react";
import { ContentEdgeNav } from "@/components/content-edge-nav";
import { SectionTopNav } from "@/components/section-top-nav";
import { useLanguage } from "@/lib/language-context";
import {
  ASIA_DEVELOPMENTS,
  REGION_ORDER,
  type AsiaRegion,
  type DevelopmentItem,
  type DevelopmentStatus,
  type LocalizedText,
  type OfficialSource,
  type RegionId,
} from "@/data/friday-asia-developments";

const STATUS_STYLE: Record<DevelopmentStatus, string> = {
  official: "border-primary/25 bg-primary/[0.07] text-primary",
  operating: "border-emerald-700/25 bg-emerald-700/[0.08] text-emerald-800 dark:text-emerald-300",
  preparing: "border-amber-700/25 bg-amber-700/[0.08] text-amber-800 dark:text-amber-300",
  related: "border-sky-700/25 bg-sky-700/[0.08] text-sky-800 dark:text-sky-300",
  watch: "border-foreground/15 bg-muted/50 text-foreground/68",
};

function local(text: LocalizedText, zh: boolean) {
  return zh ? text.zh : text.en;
}

function statusLabel(status: DevelopmentStatus, zh: boolean) {
  const labels: Record<DevelopmentStatus, LocalizedText> = {
    official: { en: "Official position", zh: "官方事实" },
    operating: { en: "In operation", zh: "已经运行" },
    preparing: { en: "Preparing / pilot", zh: "准备或试点" },
    related: { en: "Adjacent infrastructure", zh: "相关基础设施" },
    watch: { en: "Watch item", zh: "待观察" },
  };
  return local(labels[status], zh);
}

function StatusBadge({ status, zh }: { status: DevelopmentStatus; zh: boolean }) {
  return (
    <span className={`inline-flex items-center border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}>
      {statusLabel(status, zh)}
    </span>
  );
}

const STAGE_TONE: Record<string, string> = {
  confirmed: "bg-emerald-600",
  limited: "bg-amber-500",
  closed: "bg-rose-600",
  unverified: "bg-foreground/28",
  separate: "bg-sky-600",
};

function DevelopmentStagePath({
  stages,
  zh,
}: {
  stages: Array<{ state: string; label: LocalizedText; detail: LocalizedText }>;
  zh: boolean;
}) {
  return (
    <div className="grid gap-0 overflow-hidden border border-border sm:grid-cols-2 lg:grid-cols-6">
      {stages.map((stage, index) => (
        <div key={stage.label.en} className="relative min-h-28 border-b border-border p-4 last:border-b-0 sm:border-r lg:border-b-0">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STAGE_TONE[stage.state] ?? STAGE_TONE.unverified}`} />
            <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
          </div>
          <p className="mt-4 text-sm font-semibold">{local(stage.label, zh)}</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{local(stage.detail, zh)}</p>
        </div>
      ))}
    </div>
  );
}

function SourceLink({ source, zh, compact = false }: { source: OfficialSource; zh: boolean; compact?: boolean }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className={`group inline-flex items-start gap-2 text-primary hover:underline ${compact ? "text-xs leading-5" : "text-sm leading-6"}`}
    >
      <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0" />
      <span>
        {local(source.label, zh)}
        <span className="ml-1 text-muted-foreground">· {source.authority} · {source.date}</span>
      </span>
    </a>
  );
}

function DevelopmentCard({ item, zh }: { item: DevelopmentItem; zh: boolean }) {
  return (
    <article className="flex h-full flex-col border-t-2 border-border bg-card px-5 py-5 transition-colors hover:border-primary/50">
      <div><StatusBadge status={item.status} zh={zh} /></div>
      <h3 className="mt-4 text-lg font-semibold leading-6 text-foreground">{local(item.title, zh)}</h3>
      <p className="mt-3 flex-1 text-[15px] leading-7 text-foreground/76">{local(item.summary, zh)}</p>
      {item.evidence && (
        <div className="mt-4 border-l-2 border-primary bg-primary/[0.045] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{local(item.evidence.label, zh)}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-primary">{local(item.evidence.value, zh)}</p>
          <p className="mt-1 text-xs leading-5 text-foreground/62">{local(item.evidence.note, zh)}</p>
        </div>
      )}
      {item.source && <div className="mt-3"><SourceLink source={item.source} zh={zh} compact /></div>}
    </article>
  );
}

function AuthorityMap({ region, zh }: { region: AsiaRegion; zh: boolean }) {
  if (!region.institutionalMap?.length) return null;
  return (
    <section id="authority-map" className="editorial-section">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,.62fr)_minmax(0,1.38fr)] lg:items-start">
        <div>
          <p className="editorial-kicker">{zh ? "先确定适用主管机构" : "Start with the applicable authority"}</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-primary">{zh ? "阿联酋不是单一监管区" : "The UAE is not one regulatory perimeter"}</h2>
          <p className="mt-4 editorial-copy">
            {zh
              ? "判断稳定币项目时，应先看参考货币、业务活动和经营地点，再确定适用的联邦、迪拜或金融自由区制度。"
              : "Assess the reference currency, activity and location first; those facts determine whether federal, Dubai or financial-free-zone rules apply."}
          </p>
        </div>
        <div className="grid gap-px bg-border sm:grid-cols-2">
          {region.institutionalMap.map((item) => (
            <article key={item.title.en} className="bg-background p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <Landmark className="h-5 w-5" style={{ color: region.accent }} />
                <StatusBadge status={item.status} zh={zh} />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{local(item.title, zh)}</h3>
              <p className="mt-2 text-[15px] leading-7 text-foreground/72">{local(item.summary, zh)}</p>
              {item.source && <div className="mt-3"><SourceLink source={item.source} zh={zh} compact /></div>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AsiaDevelopmentPage({ regionId }: { regionId: RegionId }) {
  const { language, t } = useLanguage();
  const zh = language === "zh";
  const region = ASIA_DEVELOPMENTS[regionId];
  const currentIndex = REGION_ORDER.indexOf(regionId);
  const previous = currentIndex > 0 ? ASIA_DEVELOPMENTS[REGION_ORDER[currentIndex - 1]] : null;
  const next = currentIndex < REGION_ORDER.length - 1 ? ASIA_DEVELOPMENTS[REGION_ORDER[currentIndex + 1]] : null;
  const comparison = ASIA_COMPARISON.find((item) => item.id === regionId)!;

  const edgeItems = useMemo(() => [
    { id: "regional-status", label: t("Where it stands", "发展到哪一步") },
    { id: "development-timeline", label: t("Timeline", "发展时间线") },
    { id: "applications", label: t("Applications", "应用与进展") },
    ...(region.institutionalMap ? [{ id: "authority-map", label: t("Authority map", "主管机构地图") }] : []),
    { id: "ecosystem", label: t("Ecosystem", "参与机构") },
    { id: "outlook", label: t("Outlook", "未来计划") },
    { id: "official-sources", label: t("Primary sources", "原始来源") },
  ], [region.institutionalMap, t]);

  return (
    <div className="mx-auto max-w-7xl space-y-0 pb-10">
      <ContentEdgeNav items={edgeItems} label={t("On this page", "本页目录")} />

      <SectionTopNav
        eyebrow={t("Stablecoin Developments · Asia", "稳定币发展 · 亚洲")}
        ariaLabel={t("Asian economies", "亚洲经济体")}
        items={[
          { href: "/regional-developments", label: t("Asia Overview", "亚洲比较总览") },
          ...REGION_ORDER.map((id) => ({
          href: `/regional-developments/${id}`,
          label: local(ASIA_DEVELOPMENTS[id].nav, zh),
          })),
        ]}
      />

      <header className="relative overflow-hidden border-b border-border pb-10">
        <div className="absolute right-0 top-0 hidden h-full w-[34%] opacity-[0.07] lg:block" aria-hidden="true">
          <div className="absolute right-4 top-2 h-44 w-44 border border-current" style={{ color: region.accent }} />
          <div className="absolute right-24 top-24 h-44 w-44 border border-current" style={{ color: region.accent }} />
          <div className="absolute right-44 top-10 h-44 w-44 border border-current" style={{ color: region.accent }} />
        </div>

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="editorial-kicker">{local(region.kicker, zh)}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t("Verified", "核验于")} {region.verifiedAt}</span>
              <span aria-hidden="true">·</span>
              <span>{currentIndex + 1}/{REGION_ORDER.length}</span>
            </div>
          </div>
          <h1 className="mt-5 max-w-4xl font-serif text-4xl font-bold leading-tight text-primary sm:text-5xl">{local(region.title, zh)}</h1>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-foreground/80">{local(region.thesis, zh)}</p>
        </div>
      </header>

      <section id="regional-status" className="editorial-section">
        <div className="flex items-center gap-2">
          <MapPinned className="h-5 w-5 text-primary" />
          <h2 className="font-serif text-2xl font-bold text-primary">{t("Current Development Status", "当前发展状态")}</h2>
        </div>
        <div className={`mt-6 grid gap-4 sm:grid-cols-2 ${region.facts.length >= 4 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
          {region.facts.map((fact) => (
            <article key={fact.label.en} className="border-t-2 border-border bg-background p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{local(fact.label, zh)}</p>
              <strong className="mt-4 block text-2xl font-semibold leading-7" style={{ color: region.accent }}>{local(fact.value, zh)}</strong>
              <p className="mt-3 text-sm leading-6 text-foreground/66">{local(fact.note, zh)}</p>
            </article>
          ))}
        </div>
        <div className="mt-6 grid gap-5 border-l-4 bg-muted/35 p-5 md:grid-cols-[auto_1fr_auto] md:items-center" style={{ borderLeftColor: region.accent }}>
          <Scale className="h-6 w-6" style={{ color: region.accent }} />
          <div>
            <p className="font-semibold">{t("Regulatory boundary", "监管边界")}</p>
            <p className="mt-1 text-[15px] leading-7 text-foreground/72">{local(region.boundary, zh)}</p>
          </div>
          <Link href={region.regulatoryUrl} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            {t("Open regulatory comparison", "查看监管比较")}<ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 border-t border-border pt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="editorial-kicker">{t("From rules to use", "从制度到使用")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{local(comparison.model, zh)}</h2></div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">{t("The six steps answer different questions: a licence does not prove a product is live, and a live product does not prove widespread use.", "六个阶段回答不同问题：取得牌照不等于产品已经上线，产品上线也不等于已经形成广泛使用。")}</p>
          </div>
          <div className="mt-6"><DevelopmentStagePath stages={comparison.stages} zh={zh} /></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><p className="border-l-2 pl-4 text-sm leading-6" style={{ borderLeftColor: region.accent }}><strong>{t("What is advancing", "正在推进什么")}：</strong>{local(comparison.orientation, zh)}</p><p className="border-l-2 border-border pl-4 text-sm leading-6"><strong>{t("What blocks the next step", "下一步的主要障碍")}：</strong>{local(comparison.constraint, zh)}</p></div>
        </div>
      </section>

      <section id="development-timeline" className="editorial-section">
        <div className="grid gap-8 lg:grid-cols-[minmax(240px,.55fr)_minmax(0,1.45fr)]">
          <div>
            <div className="flex items-center gap-2"><Route className="h-5 w-5 text-primary" /><p className="editorial-kicker">{t("Development path", "发展路径")}</p></div>
            <h2 className="mt-3 font-serif text-3xl font-bold text-primary">{t("From policy signal to market operation", "从政策信号到市场运行")}</h2>
            <p className="mt-4 editorial-note">{t("Milestones are classified by what had actually happened at the cited date.", "每个节点按照引文日期时已经实际发生的阶段进行分类。")}</p>
          </div>
          <ol className="relative border-l border-border pl-6 sm:pl-8">
            {region.milestones.map((milestone) => (
              <li key={`${milestone.date}-${milestone.title.en}`} className="relative pb-9 last:pb-0">
                <span className="absolute -left-[31px] top-1 h-3 w-3 border-2 border-background sm:-left-[39px]" style={{ backgroundColor: region.accent }} aria-hidden="true" />
                <div className="flex flex-wrap items-center gap-3">
                  <time className="font-mono text-sm font-semibold" style={{ color: region.accent }}>{milestone.date}</time>
                  <StatusBadge status={milestone.status} zh={zh} />
                </div>
                <h3 className="mt-3 text-xl font-semibold leading-7">{local(milestone.title, zh)}</h3>
                <p className="mt-2 max-w-3xl text-[15px] leading-7 text-foreground/74">{local(milestone.summary, zh)}</p>
                <div className="mt-3"><SourceLink source={milestone.source} zh={zh} compact /></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="applications" className="editorial-section">
        <div className="flex items-center gap-2"><WalletCards className="h-5 w-5 text-primary" /><p className="editorial-kicker">{t("Use and implementation", "应用与落地")}</p></div>
        <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="max-w-3xl font-serif text-3xl font-bold text-primary">{t("What is operating, preparing or only adjacent", "区分已经运行、准备中和相邻基础设施")}</h2>
          <p className="text-sm text-muted-foreground">{t("Evidence cut-off", "官方证据截至")} {region.evidenceCutoff}</p>
        </div>
        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          {region.applications.map((item) => <DevelopmentCard key={item.title.en} item={item} zh={zh} />)}
        </div>
        {region.watchpoints && (
          <div className="mt-12 grid gap-8 border-t border-border pt-8 lg:grid-cols-[minmax(240px,.55fr)_minmax(0,1.45fr)]">
            <div>
              <div className="flex items-center gap-2"><CircleAlert className="h-5 w-5 text-primary" /><p className="editorial-kicker">{t("Read the evidence", "如何理解已有证据")}</p></div>
              <h3 className="mt-3 font-serif text-3xl font-bold text-primary">{t("What the available numbers prove—and what they do not", "现有数字能说明什么、不能说明什么")}</h3>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {region.watchpoints.map((item, index) => (
                <article key={item.title.en} className="grid gap-3 py-5 sm:grid-cols-[3rem_1fr]">
                  <span className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h4 className="font-semibold">{local(item.title, zh)}</h4>
                    <p className="mt-2 text-[15px] leading-7 text-foreground/72">{local(item.summary, zh)}</p>
                    {item.source && <div className="mt-3"><SourceLink source={item.source} zh={zh} compact /></div>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <AuthorityMap region={region} zh={zh} />

      <section id="ecosystem" className="editorial-section">
        <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /><p className="editorial-kicker">{t("Institutions and infrastructure", "参与机构与基础设施")}</p></div>
        <h2 className="mt-3 font-serif text-3xl font-bold text-primary">{t("Who does what", "不同主体分别承担什么角色")}</h2>
        <div className="mt-7 divide-y divide-border border-y border-border">
          {region.participants.map((item, index) => (
            <article key={item.title.en} className="grid gap-4 py-6 md:grid-cols-[3rem_minmax(180px,.55fr)_minmax(0,1.45fr)] md:items-start">
              <span className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="font-semibold leading-6">{local(item.title, zh)}</h3>
                <div className="mt-2"><StatusBadge status={item.status} zh={zh} /></div>
              </div>
              <div>
                <p className="text-[15px] leading-7 text-foreground/74">{local(item.summary, zh)}</p>
                {item.website && (
                  <a href={item.website.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" />{local(item.website.label, zh)}
                  </a>
                )}
                {item.source && <div className="mt-3"><SourceLink source={item.source} zh={zh} compact /></div>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="outlook" className="editorial-section">
        <div className="grid gap-8 lg:grid-cols-[minmax(240px,.58fr)_minmax(0,1.42fr)]">
          <div>
            <div className="flex items-center gap-2"><Telescope className="h-5 w-5 text-primary" /><p className="editorial-kicker">{t("Next stage", "下一阶段")}</p></div>
            <h2 className="mt-3 font-serif text-3xl font-bold text-primary">{t("Plans, prerequisites and open questions", "计划、前置条件与待观察事项")}</h2>
            <p className="mt-4 editorial-note">{t("A published intention is shown as a plan—not as a completed outcome.", "已经公布的意向仍按计划展示，不写成已经实现的结果。")}</p>
          </div>
          <div className="grid gap-4">
            {region.outlook.map((item) => (
              <article key={item.title.en} className="grid gap-4 border-l-2 border-border py-3 pl-5 sm:grid-cols-[auto_1fr] sm:items-start" style={{ borderLeftColor: region.accent }}>
                <div className="mt-0.5">
                  {item.status === "official" || item.status === "operating" ? <CircleCheckBig className="h-5 w-5" style={{ color: region.accent }} /> : item.status === "watch" ? <CircleAlert className="h-5 w-5 text-muted-foreground" /> : <CircleDashed className="h-5 w-5 text-amber-700 dark:text-amber-300" />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3"><h3 className="font-semibold">{local(item.title, zh)}</h3><StatusBadge status={item.status} zh={zh} /></div>
                  <p className="mt-2 text-[15px] leading-7 text-foreground/74">{local(item.summary, zh)}</p>
                  {item.source && <div className="mt-3"><SourceLink source={item.source} zh={zh} compact /></div>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="official-sources" className="editorial-section">
        <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /><p className="editorial-kicker">{t("Primary evidence", "原始证据")}</p></div>
        <h2 className="mt-3 font-serif text-3xl font-bold text-primary">{t("Official and Primary Sources", "官方与原始来源")}</h2>
        <p className="mt-3 max-w-3xl editorial-note">{t("Open the original law, regulator publication, register, programme document or issuer disclosure behind each statement.", "可直接打开支撑页面事实的法律、监管公告、登记册、项目文件或发行方原始披露。")}</p>
        <div className="mt-6 divide-y divide-border border-y border-border">
          {region.sources.map((item, index) => (
            <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="group grid gap-3 py-5 sm:grid-cols-[3rem_1fr_auto] sm:items-center">
              <span className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
              <span>
                <span className="block font-semibold leading-6 group-hover:text-primary group-hover:underline">{local(item.label, zh)}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{item.authority} · {item.date}</span>
              </span>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </a>
          ))}
        </div>
      </section>

      <nav aria-label={t("Adjacent Asian jurisdictions", "相邻亚洲辖区页面")} className="mt-12 grid gap-4 border-t border-border pt-7 sm:grid-cols-2">
        {previous ? (
          <Link href={`/regional-developments/${previous.id}`} className="group flex items-center gap-3 text-left text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span><span className="block text-xs font-normal text-muted-foreground">{t("Previous jurisdiction", "上一个辖区")}</span>{local(previous.nav, zh)}</span>
          </Link>
        ) : <span />}
        {next && (
          <Link href={`/regional-developments/${next.id}`} className="group flex items-center justify-end gap-3 text-right text-sm font-semibold text-primary hover:underline">
            <span><span className="block text-xs font-normal text-muted-foreground">{t("Next jurisdiction", "下一个辖区")}</span>{local(next.nav, zh)}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </nav>
    </div>
  );
}

const ASIA_COMPARISON = [
  {
    id: "mainland-china" as const,
    model: { en: "No domestic private-stablecoin issuance route", zh: "境内未开放私人稳定币发行与支付" },
    orientation: { en: "Risk control and e-CNY infrastructure", zh: "风险治理与数字人民币基础设施" },
    currency: { en: "No authorised private reference asset; e-CNY is separate", zh: "无获准私人锚定资产；数字人民币单独统计" },
    distribution: { en: "No domestic private-stablecoin distribution route", zh: "无境内私人稳定币分发路径" },
    constraint: { en: "Domestic virtual-currency policy boundary", zh: "境内虚拟货币政策边界" },
    framework: { en: "Restrictive policy perimeter", zh: "限制性政策边界" },
    licensing: { en: "No domestic private-issuer route", zh: "无境内私人发行许可路径" },
    product: { en: "No licensed private product", zh: "无持牌私人稳定币产品" },
    adoption: { en: "No in-scope domestic adoption measure", zh: "无境内合规采用量指标" },
    stages: [
      { state: "confirmed", label: { en: "Policy", zh: "政策定位" }, detail: { en: "Clearly defined", zh: "边界明确" } },
      { state: "confirmed", label: { en: "Rules", zh: "制度规则" }, detail: { en: "Restrictive perimeter", zh: "限制性规则" } },
      { state: "closed", label: { en: "Licence", zh: "发行牌照" }, detail: { en: "No domestic route", zh: "无境内路径" } },
      { state: "closed", label: { en: "Product", zh: "稳定币产品" }, detail: { en: "No licensed product", zh: "无持牌产品" } },
      { state: "closed", label: { en: "Channel", zh: "分发渠道" }, detail: { en: "No permitted route", zh: "无获准渠道" } },
      { state: "separate", label: { en: "Use", zh: "实际使用" }, detail: { en: "Out of domestic scope", zh: "不属于境内合规市场" } },
    ],
  },
  {
    id: "hong-kong" as const,
    model: { en: "Two licensed issuers; HKDAP in limited beta", zh: "2 家持牌发行人；HKDAP 有限测试开放" },
    orientation: { en: "Regulated products, bank distribution and settlement", zh: "受监管产品、银行分发与结算" },
    currency: { en: "HKD-focused first products", zh: "首批产品以港元为重点" },
    distribution: { en: "Corporate and professional access live; retail channels planned", zh: "企业及专业投资者已有限开放；零售渠道仍在计划中" },
    constraint: { en: "Move from licences to broad, measurable use", zh: "从取得牌照走向广泛且可量化的使用" },
    framework: { en: "Issuer regime in force", zh: "发行人制度已生效" },
    licensing: { en: "2 licensed issuers", zh: "2 家持牌发行人" },
    product: { en: "HKDAP beta; HSBC launch planned", zh: "HKDAP 测试开放；汇丰计划上线" },
    adoption: { en: "Limited access; no public volume disclosed", zh: "有限开放；未公开使用量" },
    stages: [
      { state: "confirmed", label: { en: "Policy", zh: "政策定位" }, detail: { en: "Development policy", zh: "发展方向明确" } },
      { state: "confirmed", label: { en: "Rules", zh: "制度规则" }, detail: { en: "Regime in force", zh: "制度已生效" } },
      { state: "confirmed", label: { en: "Licence", zh: "发行牌照" }, detail: { en: "2 issuers", zh: "2 家发行人" } },
      { state: "limited", label: { en: "Product", zh: "稳定币产品" }, detail: { en: "HKDAP beta", zh: "HKDAP 测试开放" } },
      { state: "limited", label: { en: "Channel", zh: "分发渠道" }, detail: { en: "Limited now; retail planned", zh: "当前有限；零售待上线" } },
      { state: "unverified", label: { en: "Use", zh: "实际使用" }, detail: { en: "No public volume", zh: "未公开使用量" } },
    ],
  },
  {
    id: "singapore" as const,
    model: { en: "XSGD, XUSD and USDG are already operating", zh: "XSGD、XUSD、USDG 已经运行" },
    orientation: { en: "SGD and USD products coexist with a licensed DPT distribution network", zh: "新元与美元产品并存，并接入持牌 DPT 分发网络" },
    currency: { en: "XSGD references SGD; XUSD and USDG reference USD", zh: "XSGD 锚定新元；XUSD 与 USDG 锚定美元" },
    distribution: { en: "Issuer mint/redemption plus exchanges, wallets and platform partners", zh: "发行方铸造与赎回，并通过交易平台、钱包和平台伙伴分发" },
    constraint: { en: "Product-level supply, payments and active-user data remain incomplete", zh: "仍缺少按产品拆分的供应量、支付额与活跃用户数据" },
    framework: { en: "SCS framework finalised", zh: "SCS 框架已定稿" },
    licensing: { en: "Paxos is licensed to issue stablecoins; StraitsX entities hold relevant payment licences", zh: "Paxos 获准发行稳定币；StraitsX 相关实体持有支付牌照" },
    product: { en: "Three named live products", zh: "3 个具名运行产品" },
    adoption: { en: ">S$18B combined StraitsX GTV; no payment split", zh: "StraitsX 累计交易总值超 180 亿新元；未拆分支付用途" },
    stages: [
      { state: "confirmed", label: { en: "Policy", zh: "政策定位" }, detail: { en: "SCS scope defined", zh: "SCS 范围明确" } },
      { state: "confirmed", label: { en: "Rules", zh: "制度规则" }, detail: { en: "Framework finalised", zh: "框架已定稿" } },
      { state: "confirmed", label: { en: "Licence", zh: "发行许可" }, detail: { en: "Issuer permissions verified", zh: "已核验发行主体许可" } },
      { state: "confirmed", label: { en: "Product", zh: "稳定币产品" }, detail: { en: "XSGD · XUSD · USDG", zh: "XSGD · XUSD · USDG" } },
      { state: "confirmed", label: { en: "Channel", zh: "分发渠道" }, detail: { en: "Issuer + partner channels", zh: "发行方及伙伴渠道" } },
      { state: "limited", label: { en: "Use", zh: "实际使用" }, detail: { en: "GTV disclosed; mix unknown", zh: "有 GTV；用途未拆分" } },
    ],
  },
  {
    id: "uae" as const,
    model: { en: "AE Coin and Zand AED are live; three issuer entries", zh: "AE Coin、Zand AED 已上线；3 家发行主体获牌" },
    orientation: { en: "AED payment products operate alongside distinct federal and free-zone perimeters", zh: "AED 支付产品已经运行，联邦与金融自由区制度并行" },
    currency: { en: "AED under CBUAE; other references depend on location and activity", zh: "AED 归 CBUAE；其他锚定货币取决于地点与业务" },
    distribution: { en: "AEC Wallet supports conversion, transfer, merchant payment and redemption; Zand AED is multi-chain", zh: "AEC Wallet 支持兑换、转账、商户支付与赎回；Zand AED 已多链发行" },
    constraint: { en: "No unified series for supply, merchant count or payment value", zh: "缺少统一的产品供应量、商户数和支付额" },
    framework: { en: "Federal and free-zone regimes", zh: "联邦与金融自由区多层制度" },
    licensing: { en: "3 dirham issuer entries", zh: "3 家迪拉姆发行牌照记录" },
    product: { en: "AE Coin and Zand AED verified live", zh: "已核验 AE Coin 与 Zand AED 上线" },
    adoption: { en: "Named wallet and merchants; aggregate usage undisclosed", zh: "有具名钱包与商户；未披露总体使用量" },
    stages: [
      { state: "confirmed", label: { en: "Policy", zh: "政策定位" }, detail: { en: "Payment-token path", zh: "支付代币路径" } },
      { state: "confirmed", label: { en: "Rules", zh: "制度规则" }, detail: { en: "Federal rules in force", zh: "联邦规则已生效" } },
      { state: "confirmed", label: { en: "Licence", zh: "发行牌照" }, detail: { en: "3 issuer entries", zh: "3 家发行记录" } },
      { state: "confirmed", label: { en: "Product", zh: "稳定币产品" }, detail: { en: "AE Coin · Zand AED", zh: "AE Coin · Zand AED" } },
      { state: "confirmed", label: { en: "Channel", zh: "分发渠道" }, detail: { en: "Wallet, merchants, chains", zh: "钱包、商户与公链" } },
      { state: "limited", label: { en: "Use", zh: "实际使用" }, detail: { en: "Acceptance observed; totals absent", zh: "已观察受理；总量缺失" } },
    ],
  },
];

const ASIA_PRODUCT_LEDGER = [
  {
    economy: "hong-kong" as const,
    product: "HKDAP",
    issuer: { en: "Anchorpoint Financial", zh: "碇点金融科技" },
    peg: { en: "HKD", zh: "港元" },
    status: "operating" as const,
    access: { en: "Limited beta for corporates and professional investors", zh: "面向企业与专业投资者的有限测试开放" },
    measure: { en: "Access confirmed; supply and transaction value not disclosed", zh: "已确认开放范围；未披露供应量与交易额" },
    source: "https://anchorpoint.hk/hkdap-whitepaper/",
  },
  {
    economy: "hong-kong" as const,
    product: "HSBC HKD stablecoin",
    issuer: { en: "HSBC Hong Kong", zh: "香港上海汇丰银行" },
    peg: { en: "HKD", zh: "港元" },
    status: "preparing" as const,
    access: { en: "PayMe and HSBC HK App planned for H2 2026", zh: "计划于 2026 年下半年接入 PayMe 与汇丰香港应用" },
    measure: { en: "Issuer plan only; not yet circulation evidence", zh: "仅为发行方计划；尚非流通证据" },
    source: "https://www.about.hsbc.com.hk/-/media/hong-kong/en/news-and-media/260410-hsbc-welcomes-hkmas-grant-of-a-hong-kong-stablecoin-issuer-licence-en.pdf",
  },
  {
    economy: "singapore" as const,
    product: "XSGD",
    issuer: { en: "StraitsX", zh: "StraitsX" },
    peg: { en: "SGD", zh: "新元" },
    status: "operating" as const,
    access: { en: "Issuer mint/redemption and multiple public networks", zh: "发行方铸造与赎回，并部署于多条公共区块链" },
    measure: { en: "Included in >S$18B combined StraitsX GTV; no token split", zh: "计入 StraitsX 超 180 亿新元累计交易总值；未按产品拆分" },
    source: "https://www.straitsx.com/xsgd",
  },
  {
    economy: "singapore" as const,
    product: "XUSD",
    issuer: { en: "StraitsX", zh: "StraitsX" },
    peg: { en: "USD", zh: "美元" },
    status: "operating" as const,
    access: { en: "Issuer and partner channels", zh: "发行方与合作伙伴渠道" },
    measure: { en: "Included in >S$18B combined StraitsX GTV; no payment split", zh: "计入 StraitsX 超 180 亿新元累计交易总值；未拆分支付用途" },
    source: "https://www.straitsx.com/blog-post/straitsx-2025-wrapped",
  },
  {
    economy: "singapore" as const,
    product: "USDG",
    issuer: { en: "Paxos Digital Singapore", zh: "Paxos Digital Singapore" },
    peg: { en: "USD", zh: "美元" },
    status: "operating" as const,
    access: { en: "Exchanges, wallets and platform partners", zh: "交易平台、钱包与平台伙伴" },
    measure: { en: "Launch and distribution confirmed; usage volume not disclosed", zh: "已确认上线与分发；未披露使用量" },
    source: "https://www.paxos.com/newsroom/paxos-introduces-global-dollar-usdg",
  },
  {
    economy: "uae" as const,
    product: "AE Coin",
    issuer: { en: "AED Stablecoin LLC", zh: "AED Stablecoin LLC" },
    peg: { en: "AED", zh: "迪拉姆" },
    status: "operating" as const,
    access: { en: "AEC Wallet: convert, transfer, pay merchants and redeem", zh: "AEC Wallet：兑换、转账、商户支付与赎回" },
    measure: { en: "Named merchants confirmed; total merchants and payment value not disclosed", zh: "已确认具名受理商户；未披露商户总数与支付额" },
    source: "https://www.mbank.ae/aec-wallet/aec-wallet-merchants/",
  },
  {
    economy: "uae" as const,
    product: "Zand AED",
    issuer: { en: "Zand Trust", zh: "Zand Trust" },
    peg: { en: "AED", zh: "迪拉姆" },
    status: "operating" as const,
    access: { en: "Public blockchains and institutional integration", zh: "公共区块链与机构接入" },
    measure: { en: "Launch confirmed; supply and settlement volume not disclosed", zh: "已确认上线；未披露供应量与结算额" },
    source: "https://www.zand.ae/en/news/zand-launches-uaes-first-aed-backed-stablecoin-on-public-blockchain",
  },
];

export function AsiaDevelopmentOverviewPage() {
  const { language, t } = useLanguage();
  const zh = language === "zh";
  return (
    <div className="mx-auto min-w-0 max-w-7xl overflow-x-clip pb-10">
      <SectionTopNav
        eyebrow={t("Stablecoin Developments · Asia", "稳定币发展 · 亚洲")}
        ariaLabel={t("Asian economies", "亚洲经济体")}
        items={[
          { href: "/regional-developments", label: t("Asia Overview", "亚洲比较总览") },
          ...REGION_ORDER.map((id) => ({ href: `/regional-developments/${id}`, label: local(ASIA_DEVELOPMENTS[id].nav, zh) })),
        ]}
      />

      <header className="border-b border-border pb-9">
        <p className="editorial-kicker">{t("Asia comparison", "亚洲比较")}</p>
        <h1 className="mt-4 max-w-5xl font-serif text-4xl font-bold text-primary sm:text-5xl">{t("Which Asian stablecoins are already operating?", "亚洲稳定币市场：哪些产品已经在运行？")}</h1>
        <p className="mt-5 max-w-4xl text-lg leading-8 text-foreground/78">{t("Singapore and the UAE already have named live products. Hong Kong has licensed issuers and a limited-beta product, while mainland China has no authorised domestic route for private stablecoin issuance or payment.", "新加坡与阿联酋已有具名产品运行；香港已有持牌发行人与有限测试产品；中国内地尚未开放私人稳定币的境内发行与支付路径。")}</p>
      </header>

      <section className="editorial-section">
        <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /><p className="editorial-kicker">{t("Current picture", "当前格局")}</p></div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {ASIA_COMPARISON.map((item, index) => { const region = ASIA_DEVELOPMENTS[item.id]; return <Link key={item.id} href={`/regional-developments/${item.id}`} className="group relative overflow-hidden border border-border bg-card p-6 transition-transform hover:-translate-y-0.5 hover:border-primary/40"><span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: region.accent }} /><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold" style={{ color: region.accent }}>{String(index + 1).padStart(2, "0")} · {local(region.nav, zh)}</p><h2 className="mt-3 text-2xl font-semibold leading-8">{local(item.model, zh)}</h2></div><ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" /></div><dl className="mt-5 grid gap-3 text-sm leading-6"><div><dt className="font-semibold text-foreground">{t("Access", "如何获得")}</dt><dd className="text-foreground/70">{local(item.distribution, zh)}</dd></div><div><dt className="font-semibold text-foreground">{t("Measured activity", "已披露活动")}</dt><dd className="text-foreground/70">{local(item.adoption, zh)}</dd></div><div className="border-t border-border pt-3"><dt className="font-semibold text-foreground">{t("Still missing", "仍缺少")}</dt><dd className="text-foreground/70">{local(item.constraint, zh)}</dd></div></dl></Link>; })}
        </div>
      </section>

      <section className="editorial-section">
        <div><p className="editorial-kicker">{t("Product ledger", "产品清单")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("Products, access channels and observed activity", "产品、获得渠道与已观察活动")}</h2><p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">{t("A live product is listed as live even if it does not carry a special regulatory label. The final column states the strongest usage evidence currently disclosed.", "只要有产品运行证据，就按已运行记录，不再因为缺少某个专门监管标签而写成“没有产品”。最后一列只写目前能够核验的最强使用证据。")}</p></div>
        <div className="mt-7 overflow-x-auto border-y border-border"><table className="w-full min-w-[1120px] border-collapse text-left"><thead className="border-b border-border bg-muted/35 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3 font-medium">{t("Economy", "经济体")}</th><th className="px-4 py-3 font-medium">{t("Product / issuer", "产品 / 发行方")}</th><th className="px-4 py-3 font-medium">{t("Peg", "锚定")}</th><th className="px-4 py-3 font-medium">{t("Status", "状态")}</th><th className="px-4 py-3 font-medium">{t("How it is accessed", "获得与使用渠道")}</th><th className="px-4 py-3 font-medium">{t("What is actually measured", "实际量化到什么")}</th><th className="px-4 py-3 font-medium">{t("Source", "来源")}</th></tr></thead><tbody>{ASIA_PRODUCT_LEDGER.map((row) => { const region = ASIA_DEVELOPMENTS[row.economy]; return <tr key={`${row.economy}-${row.product}`} className="border-b border-border last:border-0 align-top"><td className="px-4 py-5 font-semibold" style={{ color: region.accent }}>{local(region.nav, zh)}</td><td className="px-4 py-5"><strong className="block">{row.product}</strong><span className="mt-1 block text-xs text-muted-foreground">{local(row.issuer, zh)}</span></td><td className="px-4 py-5 text-sm">{local(row.peg, zh)}</td><td className="px-4 py-5"><StatusBadge status={row.status} zh={zh} /></td><td className="max-w-xs px-4 py-5 text-sm leading-6">{local(row.access, zh)}</td><td className="max-w-sm px-4 py-5 text-sm leading-6">{local(row.measure, zh)}</td><td className="px-4 py-5"><a href={row.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">{t("Open", "查看")}<ExternalLink className="h-3.5 w-3.5" /></a></td></tr>; })}</tbody></table></div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{t("Mainland China is not included in the product ledger because no authorised domestic private-stablecoin product is evidenced. The e-CNY is public digital money and is tracked separately.", "中国内地未列入产品清单，因为尚无获准的境内私人稳定币产品；数字人民币属于公共数字货币，单独统计。")}</p>
      </section>

    </div>
  );
}

export function MainlandChinaDevelopmentPage() {
  return <AsiaDevelopmentPage regionId="mainland-china" />;
}

export function HongKongDevelopmentPage() {
  return <AsiaDevelopmentPage regionId="hong-kong" />;
}

export function SingaporeDevelopmentPage() {
  return <AsiaDevelopmentPage regionId="singapore" />;
}

export function UaeDevelopmentPage() {
  return <AsiaDevelopmentPage regionId="uae" />;
}
