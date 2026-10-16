import { useId, useState, type ReactNode } from "react";
import { ExternalLink, Info, Maximize2 } from "lucide-react";
import {
  ASIA,
  ASIA_NAV,
  HEADINGS,
  sourceIds,
  sourcesFor,
  UNKNOWN_ITEMS,
  words,
  type AsiaKey,
  type Bilingual,
} from "@/data/asia-developments";
import { useLanguage } from "@/lib/language-context";
import { SectionTopNav } from "@/components/section-top-nav";
import {
  applyAsiaEnglishSvgCopy,
  englishVerificationText,
} from "@/data/asia-english-copy-qa";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

export function Copy({ value }: { value: Bilingual }) {
  const { t } = useLanguage();
  return <>{t(...value)}</>;
}
export function Field({ value }: { value: string }) {
  return <Copy value={words(value)} />;
}

// The approved Chinese copy is unchanged; only English verification labels are added.
function EnglishVerification({ date = ASIA.baseline }: { date?: string }) {
  const { t, language } = useLanguage();
  if (language !== "en") return null;
  return (
    <span className="mt-2 block text-xs font-normal text-muted-foreground">
      {t(englishVerificationText(date), "")}
    </span>
  );
}

export function Cite({ ids }: { ids: string[] }) {
  const { t } = useLanguage();
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
      {[...new Set(ids)].map((id) => {
        const source = ASIA.sources.find((s) => s.source_id === id);
        if (!source)
          return (
            <span key={id} className="text-xs">
              {t("Source UNKNOWN", "来源 UNKNOWN")}
            </span>
          );
        const number = ASIA.sources.indexOf(source) + 1;
        const label = t(
          `Source ${number}: ${source.title}`,
          `来源 ${number}：${source.title}`,
        );
        const details = (
          <>
            <strong className="block leading-snug">{source.title}</strong>
            <span className="mt-1 block text-xs">{source.organization}</span>
            <span className="mt-2 block text-xs">
              {t("Source date / status", "来源日期 / 状态")}：
              {source.date === "current"
                ? t("Current page", "当前页面")
                : source.date}{" "}
              · {t("Verified in package", "施工包核验日期")}：
              {source.last_verified}
            </span>
          </>
        );
        return (
          <span key={id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="hidden rounded text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 sm:inline"
                >
                  [{number}]
                </a>
              </TooltipTrigger>
              <TooltipContent className="max-w-80 p-3">
                {details}
              </TooltipContent>
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
                <PopoverContent className="w-72 text-sm">
                  {details}
                  <a
                    className="mt-3 inline-flex items-center gap-2 font-medium text-primary underline"
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

export function AsiaSection({
  id,
  eyebrow,
  title,
  children,
  ids = [],
}: {
  id: string;
  eyebrow?: Bilingual;
  title: Bilingual;
  children: ReactNode;
  ids?: string[];
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 border-t border-border py-8 sm:py-11"
    >
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Copy value={eyebrow} />
        </p>
      )}
      <h2 className="mb-6 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
        <Copy value={title} />
        <Cite ids={ids} />
      </h2>
      {!["misconceptions", "user-meaning"].includes(id) && (
        <div className="empty:hidden">
          <EnglishVerification />
        </div>
      )}
      {children}
    </section>
  );
}
export function Note({
  children,
  ids = [],
}: {
  children: ReactNode;
  ids?: string[];
}) {
  return (
    <p className="my-4 border-l-2 border-primary bg-primary/5 px-4 py-3 text-sm leading-7 text-foreground">
      {children}
      <Cite ids={ids} />
    </p>
  );
}

export function FrozenDiagram({
  id,
  title,
  fallback,
}: {
  id: string;
  title: Bilingual;
  fallback: ReactNode;
}) {
  const { t } = useLanguage();
  const scope = useId().replace(/:/g, "");
  const raw = ASIA.svg[id as keyof typeof ASIA.svg];
  // Only the authorised English label, theme colours, accessibility and instance IDs change.
  const themed = applyAsiaEnglishSvgCopy(raw, id)
    .replace(/id="a"/g, `id="${scope}-a"`)
    .replace(/url\(#a\)/g, `url(#${scope}-a)`)
    .replace(
      /#(?:F7F9FC|FFFFFF|FBFCFE|FFF9F4|F1F4F8)/gi,
      "hsl(var(--background))",
    )
    .replace(/#1F2937/gi, "hsl(var(--foreground))")
    .replace(/#667085/gi, "hsl(var(--muted-foreground))")
    .replace(/#(?:C8D2E1|94A3B8)/gi, "hsl(var(--border))")
    .replace(/#(?:EEF3F9|EEF4FA|F3F4F6)/gi, "hsl(var(--secondary))")
    .replace(/<svg /, '<svg role="img" ');
  return (
    <figure className="my-6 min-w-0">
      <div
        className="hidden overflow-hidden rounded-xl border border-border bg-background [&_svg]:h-auto [&_svg]:w-full lg:block"
        dangerouslySetInnerHTML={{ __html: themed }}
      />
      <div className="space-y-3 lg:hidden" aria-label={t(...title)}>
        {fallback}
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          <Copy value={title} /> · {id}
        </span>
        <Dialog>
          <DialogTrigger asChild>
            <button className="inline-flex min-h-9 items-center gap-1.5 text-primary underline underline-offset-4">
              <Maximize2 size={13} />
              {t("Expand frozen diagram", "查看完整机制图")}
            </button>
          </DialogTrigger>
          <DialogContent
            closeLabel={t("Close diagram", "关闭机制图")}
            className="max-h-[90dvh] w-[95vw] max-w-6xl overflow-auto"
          >
            <DialogHeader>
              <DialogTitle>
                <Copy value={title} />
              </DialogTitle>
              <DialogDescription>
                {t(
                  "Scroll horizontally on a small screen. The text summary remains available on the page.",
                  "小屏可横向滚动查看；页面同时提供文字图解。",
                )}
              </DialogDescription>
            </DialogHeader>
            <div
              className="min-w-[900px] [&_svg]:h-auto [&_svg]:w-full"
              dangerouslySetInnerHTML={{
                __html: themed.replaceAll(`${scope}-a`, `${scope}-modal-a`),
              }}
            />
          </DialogContent>
        </Dialog>
      </figcaption>
    </figure>
  );
}

const columnLabel: Record<string, Bilingual> = {
  jurisdiction: ["Jurisdiction", "辖区"],
  framework: ["Framework / regime", "框架 / 制度"],
  issuer_status: ["Issuer permission", "发行主体许可"],
  token_market_status: ["Token / market status", "产品 / 市场状态"],
  retail_access: ["Current access", "当前准入"],
  critical_distinction: ["Key boundary", "关键边界"],
  regulatory_basis: ["Licence / regulatory basis", "牌照 / 监管依据"],
  status: ["Product / service status", "产品 / 服务状态"],
  current_access: ["Who can access", "谁能获得"],
  channel_or_chain: ["Channel / chain", "渠道 / 链"],
  critical_note: ["Reading boundary", "判断边界"],
  reference_currency: ["Reference currency", "参考货币"],
  issuer_or_provider: ["Issuer / provider", "发行人 / 服务商"],
};
export function RegulatoryMatrix({
  rows = ASIA.regulatory,
}: {
  rows?: typeof ASIA.regulatory;
}) {
  const { t } = useLanguage();
  const columns = [
    "framework",
    "issuer_status",
    "token_market_status",
    "retail_access",
    "critical_distinction",
  ] as const;
  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <caption className="sr-only">
            {t(
              "Regulatory comparison across seven perimeters",
              "七个监管边界的制度比较",
            )}
          </caption>
          <thead className="bg-secondary/60">
            <tr>
              <th scope="col" className="p-4">
                <Copy value={columnLabel.jurisdiction} />
              </th>
              {columns.map((c) => (
                <th scope="col" className="p-4 font-medium" key={c}>
                  <Copy value={columnLabel[c]} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.jurisdiction}
                className="border-t border-border align-top hover:bg-primary/3"
              >
                <th scope="row" className="p-4 font-semibold">
                  <Field value={row.jurisdiction} />
                  <span className="mt-2 block text-xs font-normal text-muted-foreground">
                    <Field value={row.regulator} />
                  </span>
                  <Cite ids={sourceIds(row.source_ids)} />
                  <EnglishVerification date={row.last_verified} />
                </th>
                {columns.map((c) => (
                  <td className="min-w-36 p-4 leading-6" key={c}>
                    <Field value={row[c]} />
                    {c === "framework" && (
                      <span className="mt-2 block text-xs text-primary">
                        <Field value={row.regime_status} />
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-border border-y border-border md:hidden">
        {rows.map((row) => (
          <details key={row.jurisdiction} className="py-4">
            <summary className="cursor-pointer font-semibold">
              <Field value={row.jurisdiction} />
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                <Field value={row.regime_status} />
              </span>
              <EnglishVerification date={row.last_verified} />
            </summary>
            <dl className="mt-4 space-y-4">
              {columns.map((c) => (
                <div key={c}>
                  <dt className="text-xs text-muted-foreground">
                    <Copy value={columnLabel[c]} />
                  </dt>
                  <dd className="mt-1 text-sm leading-6">
                    <Field value={row[c]} />
                  </dd>
                </div>
              ))}
            </dl>
            <Cite ids={sourceIds(row.source_ids)} />
          </details>
        ))}
      </div>
    </>
  );
}

const selectClass =
  "min-h-10 max-w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
export function ProductMatrix({
  rows = ASIA.products,
  filters = true,
}: {
  rows?: typeof ASIA.products;
  filters?: boolean;
}) {
  const { t } = useLanguage();
  const [region, setRegion] = useState("all");
  const [status, setStatus] = useState("all");
  const shown = rows.filter(
    (p) =>
      (region === "all" || p.jurisdiction === region) &&
      (status === "all" || p.status === status),
  );
  const columns = [
    "regulatory_basis",
    "status",
    "current_access",
    "channel_or_chain",
    "critical_note",
  ] as const;
  return (
    <div data-testid="asia-product-matrix">
      {filters && (
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {t("Jurisdiction", "辖区")}
            <select
              className={selectClass}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              aria-label={t(
                "Filter products by jurisdiction",
                "按辖区筛选产品",
              )}
            >
              <option value="all">{t("All jurisdictions", "全部辖区")}</option>
              {[...new Set(rows.map((p) => p.jurisdiction))].map((r) => (
                <option key={r} value={r}>
                  {t(...words(r))}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {t("Status", "状态")}
            <select
              className={selectClass}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label={t("Filter products by status", "按状态筛选产品")}
            >
              <option value="all">{t("All statuses", "全部状态")}</option>
              {[...new Set(rows.map((p) => p.status))].map((s) => (
                <option key={s} value={s}>
                  {t(...words(s))}
                </option>
              ))}
            </select>
          </label>
          <p className="py-2 text-xs text-muted-foreground" aria-live="polite">
            {t(
              `${shown.length} ${shown.length === 1 ? "record" : "records"}`,
              `${shown.length} 条记录`,
            )}
          </p>
        </div>
      )}
      {shown.length === 0 ? (
        <p role="status" className="py-4 text-sm">
          {t(
            "No records match both filters.",
            "没有同时符合两个筛选条件的记录。",
          )}
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <caption className="sr-only">
                {t(
                  "Products, services and conceptual boundaries — not a list of live stablecoins",
                  "产品、服务与概念边界记录，不代表全部为已上线稳定币",
                )}
              </caption>
              <thead className="bg-secondary/60">
                <tr>
                  <th scope="col" className="p-4">
                    {t("Product / record", "产品 / 记录")}
                  </th>
                  {columns.map((c) => (
                    <th scope="col" className="p-4 font-medium" key={c}>
                      <Copy value={columnLabel[c]} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr
                    key={`${p.jurisdiction}-${p.product}`}
                    className="border-t border-border align-top hover:bg-primary/3"
                  >
                    <th scope="row" className="min-w-48 p-4 font-semibold">
                      <Field value={p.product} />
                      <span className="mt-2 block text-xs font-normal text-muted-foreground">
                        <Field value={p.issuer_or_provider} /> ·{" "}
                        <Field value={p.reference_currency} />
                      </span>
                      <span className="mt-1 block text-xs font-normal text-muted-foreground">
                        <Field value={p.jurisdiction} />
                      </span>
                      <Cite ids={sourceIds(p.source_ids)} />
                      <EnglishVerification date={p.last_verified} />
                    </th>
                    {columns.map((c) => (
                      <td key={c} className="min-w-36 p-4 leading-6">
                        <Field value={p[c]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-border border-y border-border md:hidden">
            {shown.map((p) => (
              <details key={`${p.jurisdiction}-${p.product}`} className="py-4">
                <summary className="cursor-pointer font-semibold">
                  <Field value={p.product} />
                  <span className="mt-1 block text-xs font-normal text-primary">
                    <Field value={p.status} />
                  </span>
                  <EnglishVerification date={p.last_verified} />
                </summary>
                <dl className="mt-4 space-y-4">
                  {(
                    [
                      "jurisdiction",
                      "issuer_or_provider",
                      "reference_currency",
                      ...columns,
                    ] as const
                  ).map((c) => (
                    <div key={c}>
                      <dt className="text-xs text-muted-foreground">
                        <Copy value={columnLabel[c]} />
                      </dt>
                      <dd className="mt-1 text-sm leading-6">
                        <Field value={p[c]} />
                      </dd>
                    </div>
                  ))}
                </dl>
                <Cite ids={sourceIds(p.source_ids)} />
              </details>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const TIMELINE_ZH = [
  "稳定币发行人发牌制度生效",
  "FSRA 更新后的 FRT 框架生效",
  "DFSA 更新后的加密代币框架生效",
  "多部门发布 2026 年虚拟货币 / 稳定币通知",
  "HKMA 发出首批两张稳定币发行人牌照",
  "HKDAP Beta Access 开始",
  "渣打成为 HKDAP 首家银行分销商",
  "MAS 开始就 PS Act 修法咨询",
  "HSBC 命名 RedCoin，并明确尚未发行稳定币",
  "MAS 稳定币制度实施咨询截止",
];
export function AsiaTimeline() {
  const { t } = useLanguage();
  const [type, setType] = useState("all");
  const [region, setRegion] = useState("all");
  const shown = ASIA.timeline
    .map((e, i) => ({ ...e, zh: TIMELINE_ZH[i] }))
    .filter(
      (e) =>
        (type === "all" || e.type === type) &&
        (region === "all" || e.jurisdiction === region),
    );
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t("Event type", "事件类型")}
          <select
            className={selectClass}
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label={t(
              "Filter timeline by event type",
              "按事件类型筛选时间线",
            )}
          >
            <option value="all">{t("All event types", "全部事件类型")}</option>
            {[...new Set(ASIA.timeline.map((e) => e.type))].map((v) => (
              <option key={v} value={v}>
                {t(...words(v))}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t("Jurisdiction", "辖区")}
          <select
            className={selectClass}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            aria-label={t(
              "Filter timeline by jurisdiction",
              "按辖区筛选时间线",
            )}
          >
            <option value="all">{t("All jurisdictions", "全部辖区")}</option>
            {[...new Set(ASIA.timeline.map((e) => e.jurisdiction))].map((v) => (
              <option key={v} value={v}>
                {t(...words(v))}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ol className="border-l border-border pl-5" aria-live="polite">
        {shown.map((e) => (
          <li key={`${e.date}-${e.title}`} className="relative pb-7 last:pb-0">
            <span className="absolute -left-[25px] top-2 h-2 w-2 rounded-full bg-primary" />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <time className="font-mono" dateTime={e.date}>
                {e.date}
              </time>
              <Field value={e.jurisdiction} />
              <span className="border-l border-border pl-3 text-primary">
                <Field value={e.type} />
              </span>
            </div>
            <p className="mt-2 text-base font-medium leading-7">
              {t(e.title, e.zh)}
              <Cite ids={e.source_ids} />
            </p>
          </li>
        ))}
      </ol>
      {shown.length === 0 && (
        <p role="status" className="text-sm">
          {t(
            "No events match both filters.",
            "没有同时符合两个筛选条件的事件。",
          )}
        </p>
      )}
    </div>
  );
}

export function AsiaSources({ page }: { page: AsiaKey }) {
  const { t } = useLanguage();
  const prefixes = {
    overview: "SRC-",
    mainland: "SRC-CN-",
    "hong-kong": "SRC-HK-",
    singapore: "SRC-SG-",
    uae: "SRC-UAE-",
  };
  const sources = sourcesFor(prefixes[page]);
  const unknown = UNKNOWN_ITEMS.filter(
    (item) => page === "overview" || item.key === page,
  );
  return (
    <footer id="sources" className="border-t border-border py-7 text-sm">
      <p className="leading-7 text-muted-foreground">
        {t(
          "Last verified: 16 Oct 2026. Licences, launches, access and measured adoption are separate questions.",
          "研究状态截至 2026 年 10 月 16 日。牌照、产品上线、用户准入与可量化采用是不同的问题。",
        )}
      </p>
      <Dialog>
        <DialogTrigger asChild>
          <button className="mt-3 inline-flex min-h-10 items-center gap-2 text-primary underline underline-offset-4">
            <Info size={15} />
            {t("Sources & reading notes", "来源与阅读说明")}
          </button>
        </DialogTrigger>
        <DialogContent
          closeLabel={t("Close sources", "关闭来源说明")}
          className="max-h-[85dvh] max-w-3xl overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {t("Sources & reading notes", "来源与阅读说明")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Last verified: 16 Oct 2026. This is not a real-time product directory.",
                "冻结基线：2026-10-16。本专题不是实时产品名录。",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3 text-sm leading-7">
            <p>
              {t(
                "A regime may permit issuance before a licence is granted; a licensed issuer may not yet have launched a token. A live beta may be limited to institutions, and retail access alone does not prove mass adoption.",
                "制度允许发行，不等于发行人已取得牌照；发行人持牌，不等于 token 已上线。已开放的 Beta 可能只面向机构，即便零售可用，也不能据此推定大规模采用。",
              )}
            </p>
            <p>
              {t(
                "Reserve and circulation figures require an as-of date. This package does not provide comparable adoption or live reserve totals; none are inferred. e-CNY and tokenised deposits are not classified as stablecoins.",
                "储备和流通量数字必须注明时点。施工包未提供可比采用量或实时储备总量，本专题不作推算。e-CNY 与代币化存款不归类为稳定币。",
              )}
            </p>
            <p>
              {t(
                "Citations distinguish regulators, registers, an authoritative government repost, and issuer/distributor/provider statements. Verification dates reflect the supplied research package, not a new live check.",
                "引用区分监管机构、登记册、政府权威转载，以及发行人／分销商／服务商披露。核验日期来自提供的研究施工包，不代表本次重新实时核验。",
              )}
            </p>
          </div>
          {unknown.length > 0 && (
            <section className="border-t border-border pt-4">
              <h3 className="font-semibold">
                {t("Still UNKNOWN", "仍保留 UNKNOWN")}
              </h3>
              {unknown.map((item) => (
                <p key={item.copy[0]} className="mt-3 text-sm leading-7">
                  <Copy value={item.copy} />
                  <Cite ids={item.ids} />
                </p>
              ))}
            </section>
          )}
          <section className="mt-4 border-t border-border pt-4">
            <h3 className="font-semibold">
              {t("Primary sources", "一手与权威来源")}
            </h3>
            <ol className="mt-3 space-y-4">
              {sources.map((s) => (
                <li key={s.source_id} className="text-sm">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    [{ASIA.sources.indexOf(s) + 1}] {s.title}
                    <ExternalLink className="ml-1 inline" size={12} />
                  </a>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {s.organization} · <Field value={s.source_type} /> ·{" "}
                    {t("Source date / status", "来源日期 / 状态")}{" "}
                    {s.date === "current"
                      ? t("Current page", "当前页面")
                      : s.date}{" "}
                    · {t("Package verification", "包内核验")} {s.last_verified}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </DialogContent>
      </Dialog>
    </footer>
  );
}

export function AsiaShell({
  page,
  children,
  heroIds = [],
}: {
  page: AsiaKey;
  children: ReactNode;
  heroIds?: string[];
}) {
  const { t, language } = useLanguage();
  return (
    <div
      className="mx-auto w-full min-w-0 max-w-[1440px] px-4 pb-8 sm:px-7 lg:px-10"
      data-asia-page={page}
    >
      <SectionTopNav
        eyebrow={t("Asia development", "亚洲稳定币发展")}
        ariaLabel={t(
          "Asia stablecoin development pages",
          "亚洲稳定币发展页面导航",
        )}
        items={ASIA_NAV.map((n) => ({ href: n.href, label: t(...n.label) }))}
      />
      <header className="pb-9 pt-1 sm:pb-12">
        <p className="mb-4 text-xs font-medium tracking-wide text-muted-foreground">
          {language === "en" ? (
            t(englishVerificationText(), "")
          ) : (
            <>
              {t("RESEARCH SNAPSHOT", "研究快照")} · {ASIA.baseline}
            </>
          )}
        </p>
        <h1 className="max-w-5xl text-3xl font-semibold leading-tight tracking-tight text-primary sm:text-4xl xl:text-5xl">
          <Copy value={HEADINGS[page].title} />
        </h1>
        <p className="mt-5 max-w-5xl text-base leading-8 text-muted-foreground sm:text-lg">
          <Copy value={HEADINGS[page].lead} />
          <Cite ids={heroIds} />
        </p>
      </header>
      {children}
      <AsiaSources page={page} />
    </div>
  );
}
