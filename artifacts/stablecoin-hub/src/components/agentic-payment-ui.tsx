import React, { useEffect, useId, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ExternalLink, Info, Maximize2 } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { SectionTopNav } from "@/components/section-top-nav";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AGENT_PROTOCOLS,
  PACKAGE,
  PAYMENT_SOURCES,
  REVIEWED_AT,
  getSource,
  valueTranslations,
} from "@/data/agentic-payments";
import { cn } from "@/lib/utils";

export function usePaymentText() {
  const { t, language } = useLanguage();
  return {
    t,
    language,
    value: (text: string) => t(text, valueTranslations[text] ?? text),
  };
}

export function PaymentCitation({ ids }: { ids: string[] }) {
  const { t } = usePaymentText();
  return (
    <>
      {[...new Set(ids)].map((id) => {
        const s = getSource(id);
        if (!s) return null;
        const number = PAYMENT_SOURCES.indexOf(s) + 1;
        const text = (
          <>
            <p className="font-semibold leading-5">{t(s.title, s.title)}</p>
            <p className="mt-1 text-xs leading-5">
              {t(s.organization, s.organization)} ·{" "}
              {t("Source publication", "来源发布")} {t(s.date, s.date)}
            </p>
            <p className="mt-1 text-xs">
              {t("Last verified", "最近核查")} {s.last_verified} ·{" "}
              {t(s.status, s.status)}
            </p>
          </>
        );
        return (
          <sup
            key={id}
            className="ml-1 inline-flex align-super text-[11px] text-primary"
          >
            <Tooltip delayDuration={180}>
              <TooltipTrigger asChild>
                <a
                  className="hidden min-h-6 min-w-6 items-center justify-center rounded-sm hover:bg-primary/10 focus-visible:outline sm:inline-flex"
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${s.title} · ${t("open official source", "打开官方来源")}`}
                >
                  [{number}]
                </a>
              </TooltipTrigger>
              <TooltipContent className="max-w-80 bg-popover p-3 text-popover-foreground border">
                {text}
              </TooltipContent>
            </Tooltip>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="inline-flex min-h-8 min-w-8 items-center justify-center sm:hidden"
                  aria-label={`${t("Source details", "来源详情")} ${number}`}
                >
                  [{number}]
                </button>
              </PopoverTrigger>
              <PopoverContent className="max-w-[90vw] text-sm">
                {text}
                <a
                  className="mt-3 inline-flex items-center gap-2 text-primary underline"
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("Open official source", "打开官方来源")}
                  <ExternalLink size={12} />
                </a>
              </PopoverContent>
            </Popover>
          </sup>
        );
      })}
    </>
  );
}

export function PaymentSection({
  id,
  title,
  kicker,
  children,
}: {
  id?: string;
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 border-t border-border py-9 sm:py-12"
    >
      {kicker && (
        <p className="mb-3 text-xs font-semibold tracking-widest text-primary">
          {kicker}
        </p>
      )}
      <h2 className="mb-5 max-w-4xl font-serif text-2xl font-semibold leading-snug sm:text-3xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Small renderer for approved copy only; no raw HTML, imports or external Markdown. */
export function PaymentCopy({
  en,
  zh,
  className,
}: {
  en: string;
  zh: string;
  className?: string;
}) {
  const { t } = usePaymentText();
  const inline = (line: string) =>
    line.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((part, i) =>
      part.startsWith("**") ? (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      ) : part.startsWith("`") ? (
        <code key={i} className="text-[0.92em]">
          {part.slice(1, -1)}
        </code>
      ) : (
        part
      ),
    );
  return (
    <div
      className={cn(
        "space-y-3 text-sm leading-7 text-muted-foreground sm:text-base",
        className,
      )}
    >
      {t(en, zh)
        .replace(/^---\s*$/gm, "")
        .trim()
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((block, i) => {
          if (block.startsWith("### "))
            return (
              <div key={i}>
                <h3 className="mb-2 font-semibold text-foreground">
                  {inline(block.split("\n")[0].slice(4))}
                </h3>
                {block
                  .split("\n")
                  .slice(1)
                  .map((s, j) => (
                    <p key={j}>{inline(s)}</p>
                  ))}
              </div>
            );
          const lines = block.split("\n");
          if (lines.every((x) => /^[-\d]/.test(x)))
            return (
              <ul key={i} className="list-disc space-y-1 pl-5">
                {lines.map((s, j) => (
                  <li key={j}>{inline(s.replace(/^(?:- |\d+\. )/, ""))}</li>
                ))}
              </ul>
            );
          return <p key={i}>{inline(block)}</p>;
        })}
    </div>
  );
}

const palette: Record<string, string> = {
  "#F7F9FC": "hsl(var(--background))",
  "#FFFFFF": "hsl(var(--background))",
  "#FBFCFE": "hsl(var(--background))",
  "#1F2937": "hsl(var(--foreground))",
  "#667085": "hsl(var(--muted-foreground))",
  "#C8D2E1": "hsl(var(--border))",
  "#EEF2F7": "hsl(var(--muted))",
  "#EEF3F9": "hsl(var(--muted))",
  "#FFF2EA": "hsl(var(--muted))",
  "#315B9A": "hsl(var(--primary))",
  "#5F7DB5": "hsl(var(--primary))",
  "#6B65A8": "hsl(var(--primary))",
  "#3A7D78": "hsl(var(--secondary))",
  "#517A63": "hsl(var(--secondary))",
  "#C97B63": "hsl(var(--muted-foreground))",
};
export function PaymentVisual({ id, label }: { id: string; label: string }) {
  const { t } = usePaymentText();
  const instance = useId().replace(/:/g, "");
  const [open, setOpen] = useState(false);
  const svg = (PACKAGE.svg as Record<string, string>)[id] ?? "";
  const html = useMemo(
    () =>
      svg
        .replace(/#[0-9a-f]{6}/gi, (c) => palette[c.toUpperCase()] ?? c)
        .replace(/id="([^"]+)"/g, `id="${instance}-$1"`)
        .replace(/url\(#([^)]+)\)/g, `url(#${instance}-$1)`)
        .replace(
          /class="([^"]+)"/g,
          (_, names: string) =>
            `class="${names
              .split(" ")
              .map((n) => `${instance}-${n}`)
              .join(" ")}"`,
        )
        .replace(
          /\.(t|muted|small|body|label|title|sub|box|arrow|dash)\b/g,
          `.${instance}-$1`,
        )
        .replace(
          'width="1600" height="900"',
          'width="100%" height="900" style="height:auto" role="img"',
        ),
    [svg, instance],
  );
  if (!svg) return null;
  return (
    <figure className="mt-6 overflow-hidden rounded-md border border-border bg-primary/[0.025]">
      <div
        className="hidden sm:block"
        dangerouslySetInnerHTML={{ __html: html }}
        aria-label={label}
      />
      <div className="px-4 py-5 sm:hidden">
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          {t(
            "The explanation is above. Open the original English diagram for the complete mechanism.",
            "上方文字解释核心机制；可打开英文原图查看完整结构。",
          )}
        </p>
      </div>
      <figcaption className="flex items-center justify-between gap-3 border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <span>
          {t("Original mechanism diagram · EN", "原创机制图 · 英文")} · {id}
        </span>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex min-h-9 items-center gap-2 text-primary"
          aria-label={`${t("Open diagram", "打开机制图")} ${label}`}
        >
          <Maximize2 size={14} />
          {t("View diagram", "查看机制图")}
        </button>
      </figcaption>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          closeLabel={t("Close", "关闭窗口")}
          className="max-h-[90dvh] w-[96vw] max-w-6xl overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>
              {t(
                "Original explanatory diagram; no real payment is executed.",
                "原创机制示意，不执行真实付款。",
              )}
            </DialogDescription>
          </DialogHeader>
          <div
            dangerouslySetInnerHTML={{
              __html: html.replaceAll(`${instance}-`, `${instance}-modal-`),
            }}
          />
          <a
            className="text-sm text-primary underline"
            href={`${import.meta.env.BASE_URL}agentic-payments/v0.2/${PACKAGE.assets.find((a) => a.asset_id === id)?.filename}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("Open original SVG", "打开原始 SVG")}
          </a>
        </DialogContent>
      </Dialog>
    </figure>
  );
}

export function PaymentProtocolNav() {
  const { t } = usePaymentText();
  const [path] = useLocation();
  return (
    <nav
      aria-label={t("Protocol details", "协议详情导航")}
      className="mb-8 flex gap-6 overflow-x-auto border-b border-border text-sm"
    >
      {AGENT_PROTOCOLS.filter((p) => p.id !== "a402").map((p) => (
        <Link
          key={p.id}
          href={p.detail_route}
          className={cn(
            "shrink-0 border-b-2 py-3",
            path === p.detail_route
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground",
          )}
        >
          {t(p.name, p.name)}
        </Link>
      ))}
    </nav>
  );
}

export function PaymentPage({
  children,
  sources = [],
}: {
  children: React.ReactNode;
  sources?: string[];
}) {
  const { t } = usePaymentText();
  const [path] = useLocation();
  const [notes, setNotes] = useState(false);
  useEffect(() => {
    // Wouter changes paths without waiting for a new target section to mount.
    const followHash = () =>
      requestAnimationFrame(() => {
        const target = window.location.hash.slice(1);
        if (target)
          document
            .getElementById(decodeURIComponent(target))
            ?.scrollIntoView({ block: "start" });
      });
    const frame = followHash();
    window.addEventListener("hashchange", followHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", followHash);
    };
  }, [path]);
  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl pb-12">
      <SectionTopNav
        eyebrow={t("Agentic Payments", "智能体支付")}
        ariaLabel={t("Agentic payments sections", "智能体支付栏目")}
        items={[
          { href: "/agentic-payments", label: t("Overview", "概览") },
          {
            href: "/agentic-payments/protocols",
            label: t("Protocols & mechanisms", "协议与机制"),
            matchPrefix: true,
          },
          {
            href: "/agentic-payments/scenarios",
            label: t("Scenarios & risks", "应用与风险"),
          },
          {
            href: "/agentic-payments/ecosystem",
            label: t("Ecosystem & progress", "生态与进展"),
          },
        ]}
      />
      {children}
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border py-5 text-xs text-muted-foreground">
        <p>
          {t("Last reviewed", "最近核查")} · {REVIEWED_AT}
        </p>
        <button
          onClick={() => setNotes(true)}
          className="inline-flex min-h-10 items-center gap-2 text-primary underline underline-offset-4"
        >
          <Info size={14} />
          {t("Sources & reading notes", "来源与阅读说明")}
        </button>
      </footer>
      <Dialog open={notes} onOpenChange={setNotes}>
        <DialogContent
          closeLabel={t("Close", "关闭窗口")}
          className="max-w-2xl overflow-hidden"
        >
          <DialogHeader>
            <DialogTitle>
              {t("Sources & reading notes", "来源与阅读说明")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Read evidence at its stated level.",
                "按证据实际能说明的范围阅读。",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[65dvh] space-y-5 overflow-y-auto overscroll-contain text-sm leading-7">
            <p>
              {t(
                "Protocols, products and payment infrastructure are different layers. A stablecoin is one possible payment rail, not the definition of agentic payment.",
                "协议、产品和支付基础设施属于不同层。稳定币是一条可能的支付轨道，不是智能体支付的定义。",
              )}
            </p>
            <p>
              {t(
                "Production-system validation is not general availability. A phase-I rollout or partnership does not establish large-scale adoption.",
                "生产系统验证不等于全面开放；第一阶段推广或合作公告，也不能证明已有大规模采用。",
              )}
            </p>
            <p>
              {t(
                "UNKNOWN means first-party evidence is insufficient. Blockchain or tokenisation alone does not prove stablecoin settlement. Review dates are not release dates.",
                "UNKNOWN 表示第一方证据不足。使用区块链或代币化技术，本身不能证明采用稳定币结算。核查日期不是发布日期。",
              )}
            </p>
            <p>
              {t(
                "Figures explain mechanisms, not live payment services. Product screenshots are not reproduced without a reviewed first-party asset and use conditions.",
                "图示用于解释机制，不提供真实支付服务。未取得已审核的官方素材与使用条件前，不展示产品截图。",
              )}
            </p>
            <SourceList ids={sources} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export function SourceList({ ids }: { ids: string[] }) {
  const { t } = usePaymentText();
  return (
    <ul className="divide-y divide-border">
      {[...new Set(ids)].map((id) => {
        const s = getSource(id);
        if (!s) return null;
        return (
          <li key={id} className="py-3">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-start gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="mt-1 shrink-0" size={14} />
              <span>
                {t(s.title, s.title)}
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t(s.organization, s.organization)} ·{" "}
                  {t("Source publication", "来源发布")} {s.date} ·{" "}
                  {t("verified", "核查")} {s.last_verified} · {s.status}
                </span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function PaymentHero({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children?: React.ReactNode;
}) {
  const { t } = usePaymentText();
  return (
    <header className="pb-9 sm:pb-12">
      <p className="mb-4 text-xs font-semibold tracking-[.14em] text-primary">
        {t("AGENTIC PAYMENTS", "智能体支付")}
      </p>
      <h1 className="max-w-5xl font-serif text-3xl font-semibold leading-tight text-primary sm:text-4xl">
        {title}
      </h1>
      {lead && (
        <p className="mt-5 max-w-4xl text-base leading-8 text-muted-foreground">
          {lead}
        </p>
      )}
      {children}
    </header>
  );
}
