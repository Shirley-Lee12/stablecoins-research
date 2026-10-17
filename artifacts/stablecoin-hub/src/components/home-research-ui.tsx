import { useId, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowUpRight, ExternalLink, Maximize2 } from "lucide-react";
import {
  HOME_RESEARCH,
  RECORD_LINKS,
  RESEARCH_RECORDS,
  RESEARCH_BOUNDARY,
  FUTURE,
  type HubCopy,
  type ResearchStatus,
} from "@/data/home-research";
import { useLanguage } from "@/lib/language-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
export function HubText({ text }: { text: HubCopy }) {
  const { t } = useLanguage();
  return <>{t(...text)}</>;
}
export function ResearchState({ status }: { status: ResearchStatus }) {
  const { t } = useLanguage();
  const label = HOME_RESEARCH.labels[status];
  return (
    <span
      data-research-status={status}
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium leading-5 ${status === "FUTURE_RESEARCH" ? "border-dashed border-border text-muted-foreground" : "border-primary/35 bg-primary/5 text-primary"}`}
    >
      {t(label.label_en, label.label_zh)}
    </span>
  );
}
export function HubSection({
  id,
  number,
  title,
  intro,
  children,
}: {
  id: string;
  number: string;
  title: HubCopy;
  intro?: HubCopy;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-5 border-t border-border py-9 sm:py-12"
    >
      <div className="mb-6 flex items-start gap-4">
        <span className="mt-1 font-mono text-xs text-primary">{number}</span>
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            <HubText text={title} />
          </h2>
          {intro && (
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground sm:text-base">
              <HubText text={intro} />
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
export function HubBoundary({ text }: { text: HubCopy }) {
  return (
    <p className="my-5 border-l-2 border-primary bg-primary/5 px-4 py-3 text-sm leading-7">
      <HubText text={text} />
    </p>
  );
}
export function HubLink({ href, text }: { href: string; text: HubCopy }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 max-w-full items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2"
    >
      <span className="min-w-0">
        <HubText text={text} />
      </span>
      <ArrowUpRight size={15} className="shrink-0" />
    </Link>
  );
}
// Only public external sources are exposed. Internal baselines have no URL/download UI.
export function HubCite({ ids }: { ids: string[] }) {
  const { t } = useLanguage();
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
      {ids.map((id) => {
        const source = HOME_RESEARCH.sources.find(
          (s) => s.source_id === id && /^https:\/\//.test(s.url),
        );
        if (!source) return null;
        const number = source.source_id.slice(-2).replace(/^0/, "");
        const label = t(
          `Source ${number}: ${source.title}`,
          `来源 ${number}：${source.title}`,
        );
        const body = (
          <>
            <strong className="block text-sm leading-6">{source.title}</strong>
            <span className="mt-1 block text-xs leading-5">
              {source.organization}
            </span>
            <span className="mt-2 block text-xs leading-5">
              {t("Source date", "来源日期")}：
              {source.date === "current"
                ? t("Current page", "当前页面")
                : source.date}
              <br />
              {t("Last verified", "最后核验")}：{source.last_verified}
            </span>
          </>
        );
        return (
          <span key={id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  aria-label={label}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden rounded text-xs font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 sm:inline"
                >
                  [{number}]
                </a>
              </TooltipTrigger>
              <TooltipContent className="max-w-80 p-3">{body}</TooltipContent>
            </Tooltip>
            <span className="sm:hidden">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    aria-label={label}
                    className="min-h-8 min-w-8 rounded text-xs font-semibold text-primary focus-visible:outline focus-visible:outline-2"
                  >
                    [{number}]
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  {body}
                  <a
                    className="mt-3 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-primary underline"
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("Open source", "打开来源")}
                    <ExternalLink size={13} />
                  </a>
                </PopoverContent>
              </Popover>
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function PublicSourceLink({ id, text }: { id: string; text: HubCopy }) {
  const { t } = useLanguage();
  const source = HOME_RESEARCH.sources.find(
    (s) => s.source_id === id && /^https:\/\//.test(s.url),
  );
  if (!source) return null;
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4"
    >
      {t(...text)}
      <ExternalLink size={14} />
    </a>
  );
}

export function ResearchRecord({
  id,
  link = true,
  compact = false,
}: {
  id: string;
  link?: boolean;
  compact?: boolean;
}) {
  const item = RESEARCH_RECORDS.find((r) => r.id === id);
  if (!item) return null;
  return (
    <article
      data-research-record={id}
      className="min-w-0 border-l-2 border-primary/35 pl-4"
    >
      <ResearchState status={item.status} />
      <h3 className="mt-3 text-lg font-semibold leading-7">
        <HubText text={item.title} />
      </h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        <HubText text={item.summary} />
        {id === "conference-paper" && <HubCite ids={["SRC-HR-04"]} />}
      </p>
      {!compact && (
        <p className="mt-3 text-sm leading-7">
          <HubText text={item.boundary} />
        </p>
      )}
      {link && RECORD_LINKS[id] && (
        <div className="mt-3">
          <HubLink
            href={RECORD_LINKS[id]}
            text={["Explore the study", "查看会议研究"]}
          />
        </div>
      )}
    </article>
  );
}
export function FutureResearch({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  return (
    <div
      data-home-future-research
      className="min-w-0 border-l-2 border-dashed border-border pl-4"
    >
      <ResearchState status="FUTURE_RESEARCH" />
      <p className="mt-4 text-sm leading-7">
        <HubText text={RESEARCH_BOUNDARY} />
      </p>
      <ul
        className={`mt-5 gap-x-8 gap-y-4 ${compact ? "grid sm:grid-cols-2" : "grid md:grid-cols-2"}`}
      >
        {FUTURE.map((f) => (
          <li
            key={f.id}
            data-future-direction={f.id}
            className="min-w-0 text-sm leading-7"
          >
            <span className="font-semibold">
              <HubText text={f.title} />
            </span>
            {!compact && (
              <p className="text-muted-foreground">
                <HubText text={f.description} />
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-6 text-muted-foreground">
        {t(
          "These directions extend the conference framework; they are not additional completed studies.",
          "这些方向是会议框架的未来延展，不是新增的已完成研究。",
        )}
      </p>
    </div>
  );
}
export function ConferencePaperLink() {
  const { t } = useLanguage();
  return (
    <a
      data-conference-paper-link
      href={`${import.meta.env.BASE_URL}${HOME_RESEARCH.paper.url.replace(/^\//, "")}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4"
    >
      {t("Read the conference paper (PDF)", "阅读会议论文（PDF）")}
      <ExternalLink size={14} />
    </a>
  );
}
export function ResearchSourceNote() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-border py-6 text-xs leading-6 text-muted-foreground">
      <p>
        {t(
          "Current research scope: the AI-DEFIT 2026 conference study and its conceptual framework. Sources identify the institution and conference programme.",
          "当前研究范围：AI-DEFIT 2026 会议研究及其概念框架。来源用于核验机构与会议议程。",
        )}
      </p>
      <HubCite ids={["SRC-HR-02", "SRC-HR-03", "SRC-HR-04"]} />
    </footer>
  );
}
export function NavigationFigure() {
  const { t } = useLanguage();
  const scope = useId().replace(/:/g, "");
  const themed = HOME_RESEARCH.navigation_svg
    .replace(/id="a"/g, `id="${scope}-a"`)
    .replace(/url\(#a\)/g, `url(#${scope}-a)`)
    .replace(
      /#(?:F7F9FC|FFFFFF|FBFCFE|FFF9F4|F3F7FC)/gi,
      "hsl(var(--background))",
    )
    .replace(/#1F2937/gi, "hsl(var(--foreground))")
    .replace(/#667085/gi, "hsl(var(--muted-foreground))")
    .replace(/#(?:C8D2E1|94A3B8)/gi, "hsl(var(--border))")
    .replace(/#(?:F1F4F8|EEF3F9|EEF6F5|EEF2F7)/gi, "hsl(var(--secondary))")
    .replace("<svg ", '<svg role="img" ');
  return (
    <figure data-hub-navigation-figure className="my-7 min-w-0">
      <div
        className="hidden overflow-hidden rounded-lg border border-border [&_svg]:h-auto [&_svg]:w-full lg:block"
        dangerouslySetInnerHTML={{ __html: themed }}
      />
      <p className="border-l-2 border-primary/35 pl-4 text-sm leading-7 text-muted-foreground lg:hidden">
        {t(
          "The five questions above connect mechanisms, regional evidence, payments, market data and research.",
          "上方五个问题分别通向机制、区域证据、支付、市场数据与研究。",
        )}
      </p>
      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{t("Research Hub navigation map", "研究平台导航图")}</span>
        <Dialog>
          <DialogTrigger asChild>
            <button className="inline-flex min-h-10 items-center gap-1.5 text-primary underline underline-offset-4">
              <Maximize2 size={13} />
              {t("Explore navigation map", "展开导航图")}
            </button>
          </DialogTrigger>
          <DialogContent
            closeLabel={t("Close navigation map", "关闭导航图")}
            className="max-h-[90dvh] w-[95vw] min-w-0 max-w-6xl overflow-hidden"
          >
            <DialogHeader>
              <DialogTitle>
                {t("Research Hub navigation map", "研究平台导航图")}
              </DialogTitle>
              <DialogDescription>
                {t(
                  "Use the five question links to choose a starting point.",
                  "通过五个问题入口选择起点。",
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 min-w-0 overflow-auto">
              <div
                className="min-w-[800px] [&_svg]:h-auto [&_svg]:w-full"
                dangerouslySetInnerHTML={{
                  __html: themed.replaceAll(`${scope}-a`, `${scope}-modal-a`),
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </figcaption>
    </figure>
  );
}
