import { useId, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, ExternalLink, Maximize2 } from "lucide-react";
import {
  ABOUT,
  type AboutCopy,
  type AboutFigureId,
} from "@/data/about-stablecoins";
import { useLanguage } from "@/lib/language-context";
import { AboutSectionNav } from "@/components/about-section-nav";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

export function AboutText({ copy }: { copy: AboutCopy }) {
  const { t } = useLanguage();
  return <>{t(...copy)}</>;
}

export function AboutCite({ ids = [] }: { ids?: readonly string[] }) {
  const { t } = useLanguage();
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
      {[...new Set(ids)].map((id) => {
        const source = ABOUT.sources.find(
          (s) => s.source_id === id && /^https:\/\//.test(s.url),
        );
        if (!source)
          return (
            <span key={id} className="text-xs">
              {t("Source UNKNOWN", "来源 UNKNOWN")}
            </span>
          );
        const number = Number(id.slice(-2));
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
              {t("Source date / status", "来源日期 / 状态")}：{source.date}
              <br />
              {t("Source review date", "施工包核验日期")}：
              {source.last_verified}
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
                  className="hidden rounded text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 sm:inline"
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
                    type="button"
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

export function TypeNav() {
  const { t } = useLanguage();
  const [location] = useLocation();
  return (
    <nav
      data-about-type-nav
      aria-label={t("Stablecoin mechanism types", "稳定币机制类型导航")}
      className="-mt-4 mb-8 min-w-0 overflow-x-auto border-b border-border"
    >
      <div className="flex min-w-max gap-5 px-1">
        {ABOUT.nav.type_nav.map((item) => (
          <Link
            key={item.route}
            href={item.route}
            aria-current={location === item.route ? "page" : undefined}
            className={`inline-flex min-h-11 items-center whitespace-nowrap border-b-2 py-2 text-xs font-medium focus-visible:outline focus-visible:outline-2 ${location === item.route ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
          >
            {t(item.label_en, item.label_zh)}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function AboutFrame({
  title,
  lead,
  types = false,
  children,
}: {
  title: AboutCopy;
  lead?: AboutCopy;
  types?: boolean;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div
      data-about-v02
      className="mx-auto w-full min-w-0 max-w-7xl pb-6"
    >
      <AboutSectionNav />
      {types && <TypeNav />}
      <header id="hero" className="pb-8">
        <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground">
          {t(
            "About Stablecoins · Mechanisms and essentials",
            "关于稳定币 · 机制与基础",
          )}
        </p>
        <h1 className="max-w-4xl font-serif text-3xl font-bold leading-tight text-primary sm:text-4xl">
          <AboutText copy={title} />
        </h1>
        {lead && (
          <p className="mt-4 max-w-4xl text-base leading-8 text-muted-foreground">
            <AboutText copy={lead} />
          </p>
        )}
      </header>
      {children}
      <footer className="border-t border-border py-5 text-xs leading-6 text-muted-foreground">
        {t(
          "As of 16 Oct 2026. Examples explain mechanisms and are not rankings or recommendations. Source dates and review details are available beside individual claims.",
          "内容基线：2026-10-16。案例用于解释机制，不构成排名或推荐；具体来源日期与核验记录可在相应引用中查看。",
        )}
      </footer>
    </div>
  );
}

export function AboutLink({ href, label }: { href: string; label: AboutCopy }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2"
    >
      <AboutText copy={label} />
      <ArrowRight size={14} />
    </Link>
  );
}
export function AboutNote({ copy }: { copy: AboutCopy }) {
  return (
    <p className="my-4 border-l-2 border-primary bg-primary/5 px-4 py-3 text-sm leading-7">
      <AboutText copy={copy} />
    </p>
  );
}

// Display-only copy, label wrapping, theme and instance adaptation.
// Frozen files, node geometry and relationships stay unchanged.
export function themeAboutFigure(raw: string, scope: string) {
  return raw
    .replace(/International baseline/g, "International standards")
    .replace(
      ">Synthetic dollar exposure</text>",
      '><tspan x="1195" dy="0">Synthetic dollar </tspan><tspan x="1195" dy="30">exposure</tspan></text>',
    )
    .replace(/id="a"/g, `id="${scope}-a"`)
    .replace(/url\(#a\)/g, `url(#${scope}-a)`)
    .replace(
      /#(?:F7F9FC|FFFFFF|FBFCFE|FFF9F4|F8FAFC|F5FAF7|F8F7FC|FFF5F5|F3F7FC)/gi,
      "hsl(var(--background))",
    )
    .replace(/#1F2937/gi, "hsl(var(--foreground))")
    .replace(/#667085/gi, "hsl(var(--muted-foreground))")
    .replace(/#(?:C8D2E1|94A3B8)/gi, "hsl(var(--muted-foreground))")
    .replace(/#EEF3F9/gi, "hsl(var(--muted))")
    .replace(/<svg /, '<svg role="img" ');
}
export function AboutFigure({
  id,
  summary,
}: {
  id: AboutFigureId;
  summary: AboutCopy;
}) {
  const { t } = useLanguage();
  const scope = useId().replace(/:/g, "");
  const asset = ABOUT.assets.find((a) => a.asset_id === id)!;
  const themed = themeAboutFigure(ABOUT.svg[id], scope);
  return (
    <figure data-about-figure={id} className="my-6 min-w-0">
      <div
        className="hidden overflow-hidden rounded-lg border border-border [&_svg]:h-auto [&_svg]:w-full lg:block"
        dangerouslySetInnerHTML={{ __html: themed }}
      />
      <p className="border-l-2 border-primary/35 pl-4 text-sm leading-7 text-muted-foreground lg:hidden">
        <AboutText copy={summary} />
      </p>
      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{t(asset.title, FIGURE_TITLES_ZH[id])}</span>
        <Dialog>
          <DialogTrigger asChild>
            <button className="inline-flex min-h-10 items-center gap-1.5 text-primary underline underline-offset-4">
              <Maximize2 size={13} />
              {t("Explore diagram", "展开机制图")}
            </button>
          </DialogTrigger>
          <DialogContent
            closeLabel={t("Close diagram", "关闭机制图")}
            className="max-h-[90dvh] w-[95vw] max-w-6xl overflow-auto"
          >
            <DialogHeader className="min-w-0 pr-6">
              <DialogTitle>{t(asset.title, FIGURE_TITLES_ZH[id])}</DialogTitle>
              <DialogDescription>
                <AboutText copy={summary} />
              </DialogDescription>
            </DialogHeader>
            <div
              role="region"
              aria-label={t("Scrollable mechanism diagram", "可滚动机制图")}
              tabIndex={0}
              className="min-w-0 max-h-[60dvh] overflow-auto focus-visible:outline focus-visible:outline-2 lg:max-h-none"
            >
              <div
                className="min-w-[1200px] lg:min-w-[900px] [&_svg]:h-auto [&_svg]:w-full"
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
const FIGURE_TITLES_ZH: Record<AboutFigureId, string> = {
  "STB-D01": "稳定币生命周期",
  "STB-D02": "稳定币与相邻数字货币的边界",
  "STB-D03": "以机制为先的稳定币分类",
  "STB-D04": "稳定币监管演进",
  "STB-D05": "法币储备型机制",
  "STB-D06": "加密资产抵押型机制",
  "STB-D07": "合成 / 对冲型机制",
  "STB-D08": "算法型的反身性失败",
  "STB-D09": "混合与边界案例",
};
