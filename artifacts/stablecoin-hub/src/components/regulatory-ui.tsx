import type { ReactNode } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
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
import {
  regulatoryPackage as pack,
  SOURCE_DATES,
  INSTRUMENTS,
  FIELDS,
  HK_LICENSEES,
  type Copy,
} from "@/data/regulatory";
export function RegulatoryText({ copy }: { copy: Copy }) {
  const { t } = useLanguage();
  return <>{t(...copy)}</>;
}
export function RegulatorySection({
  id,
  title,
  children,
}: {
  id: string;
  title: Copy;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="min-w-0 scroll-mt-24 border-t border-border py-8 sm:py-10"
    >
      <h2 className="mb-5 font-serif text-2xl font-bold leading-snug text-primary sm:text-3xl">
        <RegulatoryText copy={title} />
      </h2>
      {children}
    </section>
  );
}
export function RegulatoryHint({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex max-w-full">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="hidden min-h-10 text-left text-sm font-medium text-primary underline decoration-dotted underline-offset-4 lg:inline-flex"
          >
            {label}
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-80 border border-border bg-popover p-4 text-sm leading-6 text-popover-foreground">
          {children}
        </TooltipContent>
      </Tooltip>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="min-h-11 text-left text-sm font-medium text-primary underline decoration-dotted underline-offset-4 lg:hidden"
          >
            {label}
          </button>
        </PopoverTrigger>
        <PopoverContent className="max-w-[90vw] text-sm leading-6">
          {children}
        </PopoverContent>
      </Popover>
    </span>
  );
}
export function RegulatorySourceBody({ id }: { id: string }) {
  const { t } = useLanguage();
  const source = pack.sources.find((s) => s.source_id === id);
  if (!source) return null;
  const dates = SOURCE_DATES[id] || {};
  const fields: [string, string, ReactNode][] = [
    ["Authority", "主管机构", source.organization],
    ["Document", "文件", source.title],
    ["Instrument type", "文件类型", t(...INSTRUMENTS[source.instrument_type])],
    [
      "Publication date",
      "公布日期",
      dates.publication ? (
        <RegulatoryText copy={dates.publication} />
      ) : (
        t("Not specified in the cited record", "引用记录未注明")
      ),
    ],
  ];
  if (dates.enactment)
    fields.push([
      "Enactment / making date",
      "成法 / 制定日期",
      <RegulatoryText copy={dates.enactment} />,
    ]);
  fields.push([
    "Effective / commencement date",
    "生效 / 全面实施日期",
    dates.effective ? (
      <RegulatoryText copy={dates.effective} />
    ) : (
      t(
        "Not specified here; document publication is not commencement.",
        "此处未注明；公布文件不等于制度生效。",
      )
    ),
  ]);
  if (source.instrument_type === "REGISTER" || dates.licence)
    fields.push([
      "Licence effective date",
      "牌照生效日期",
      dates.licence ? (
        <RegulatoryText copy={dates.licence} />
      ) : (
        t("Not specified in the cited record", "引用记录未注明")
      ),
    ]);
  if (source.instrument_type.includes("CONSULTATION") || dates.consultation)
    fields.push([
      "Consultation closing date",
      "咨询截止日期",
      dates.consultation ? (
        <RegulatoryText copy={dates.consultation} />
      ) : (
        t("Not specified in the cited record", "引用记录未注明")
      ),
    ]);
  fields.push(["Last verified", "最后核验", source.last_verified]);
  return (
    <div data-reg-source={id} className="min-w-0 space-y-3 text-sm leading-6">
      <dl className="space-y-2">
        {fields.map(([en, zh, v]) => (
          <div key={en}>
            <dt className="font-semibold text-foreground">{t(en, zh)}</dt>
            <dd className="break-words text-muted-foreground">{v}</dd>
          </div>
        ))}
      </dl>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center text-primary underline"
      >
        {t("Open official source", "打开官方来源")}
        <span className="sr-only">: {source.title}</span>
      </a>
    </div>
  );
}
export function RegulatorySource({
  id,
  label,
}: {
  id: string;
  label?: string;
}) {
  const { t } = useLanguage();
  const source = pack.sources.find((s) => s.source_id === id);
  if (!source) return null;
  const text = label || source.organization;
  const aria = t("Source: ", "来源：") + source.title;
  return (
    <span className="inline-flex max-w-full">
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={source.url}
            aria-label={aria}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-9 items-center text-left text-xs text-primary underline underline-offset-4 lg:inline-flex"
          >
            {text}
          </a>
        </TooltipTrigger>
        <TooltipContent
          collisionPadding={16}
          style={{
            maxHeight:
              "min(75vh, var(--radix-tooltip-content-available-height))",
          }}
          className="max-h-[75vh] w-96 max-w-[90vw] overflow-y-auto border border-border bg-popover p-4 text-popover-foreground"
        >
          <RegulatorySourceBody id={id} />
        </TooltipContent>
      </Tooltip>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={aria}
            className="min-h-11 text-left text-sm text-primary underline underline-offset-4 lg:hidden"
          >
            {text}
          </button>
        </PopoverTrigger>
        <PopoverContent
          collisionPadding={16}
          style={{
            maxHeight:
              "min(75vh, var(--radix-popover-content-available-height))",
          }}
          className="max-h-[75vh] w-96 max-w-[90vw] overflow-y-auto p-4"
        >
          <RegulatorySourceBody id={id} />
        </PopoverContent>
      </Popover>
    </span>
  );
}
type Jurisdiction = (typeof import("@/data/regulatory").JURISDICTIONS)[number];
export function JurisdictionSources({ row }: { row: Jurisdiction }) {
  const { t } = useLanguage();
  return (
    <div data-field="official-source" className="space-y-2">
      <p className="text-xs font-semibold">
        {t("Official sources", "官方来源")}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {row.sourceIds.map((id, i) => (
          <RegulatorySource key={id} id={id} label={`[${i + 1}]`} />
        ))}
      </div>
    </div>
  );
}
export function RegionalLink({ row }: { row: Jurisdiction }) {
  const { t } = useLanguage();
  return (
    <div data-field="regional-deep-link">
      {row.deepLink ? (
        <Link
          href={row.deepLink}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline"
        >
          {t("Regional detail →", "地区详情 →")}
        </Link>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("Regional detail: not included", "地区详情：未收录")}
        </p>
      )}
    </div>
  );
}
export function LicenceRegister() {
  const { t } = useLanguage();
  return (
    <div
      data-licence-register
      className="mt-4 space-y-3 border-l-2 border-primary/30 pl-3"
    >
      <p className="font-medium">
        {t(
          "HKMA register · checked 16 October 2026",
          "HKMA 登记册 · 核验于 2026 年 10 月 16 日",
        )}
      </p>
      <ul className="space-y-3">
        {HK_LICENSEES.map((l) => (
          <li key={l.number}>
            <p>{l.name}</p>
            <p className="text-xs text-muted-foreground">
              {l.number} · {t("Licence effective: ", "牌照生效：")}
              <time dateTime={l.effective}>
                {t("10 April 2026", "2026 年 4 月 10 日")}
              </time>
            </p>
          </li>
        ))}
      </ul>
      <RegulatorySource
        id="HK-02"
        label={t("Register and licence dates", "登记册与牌照日期")}
      />
    </div>
  );
}
export function JurisdictionCard({ row }: { row: Jurisdiction }) {
  const { t } = useLanguage();
  return (
    <article
      data-mobile-jurisdiction={row.id}
      className="min-w-0 border-b border-border py-5"
    >
      <details>
        <summary className="cursor-pointer rounded-sm marker:text-primary">
          <h3 className="ml-1 inline font-serif text-xl font-bold text-primary">
            <RegulatoryText copy={row.name} />
          </h3>
          <span
            data-field="status"
            className="mt-3 block text-base font-semibold leading-7"
          >
            <RegulatoryText copy={row.status} />
          </span>
          <span
            data-field="stage-date"
            className="mt-2 block text-sm leading-7 text-muted-foreground"
          >
            <span className="font-medium text-foreground">
              {t("Stage / key dates: ", "阶段 / 关键日期：")}
            </span>
            <RegulatoryText copy={row.stage} />
          </span>
          <span className="mt-3 block text-xs font-medium text-primary underline">
            {t("Compare requirements and sources", "查看要求与来源")}
          </span>
        </summary>
        <dl className="mt-5 space-y-5 border-l-2 border-primary/20 pl-4 text-sm leading-7">
          {FIELDS.map(([key, en, zh]) => (
            <div key={key} data-field={key}>
              <dt className="mb-1 font-semibold">{t(en, zh)}</dt>
              <dd>
                <RegulatoryText copy={row.fields[key]} />
                {key === "issuer_permission" && row.id === "hk" && (
                  <LicenceRegister />
                )}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 space-y-3">
          <JurisdictionSources row={row} />
          <RegionalLink row={row} />
        </div>
      </details>
    </article>
  );
}
