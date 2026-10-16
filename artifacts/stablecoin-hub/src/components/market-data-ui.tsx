import { type ReactNode, useId, useState } from "react";
import { Link } from "wouter";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";
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
import { useLanguage } from "@/lib/language-context";
import { MarketSectionNav } from "@/pages/market-data-shared";
import {
  STATES,
  META_ZH,
  displayValue,
  readPoints,
  type DataMetric,
  type Copy,
  type Point,
} from "@/data/market-data-model";
import pack from "@/data/market-data-v02.generated.json";
export function Text({ copy }: { copy: Copy }) {
  const { t } = useLanguage();
  return <>{t(...copy)}</>;
}
export function DataFrame({
  title,
  lead,
  dashboard = false,
  children,
}: {
  title: Copy;
  lead: Copy;
  dashboard?: boolean;
  children: ReactNode;
}) {
  return (
    <div data-market-v02 className="mx-auto w-full min-w-0 max-w-7xl pb-8">
      {!dashboard && <MarketSectionNav />}
      <header id="hero" className="pb-8">
        <h1 className="max-w-5xl font-serif text-3xl font-bold leading-tight text-primary sm:text-4xl">
          <Text copy={title} />
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-8 text-muted-foreground">
          <Text copy={lead} />
        </p>
      </header>
      {children}
    </div>
  );
}
export function Section({
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
      data-market-module={id}
      id={id}
      className="min-w-0 border-t border-border py-7 sm:py-9"
    >
      <h2 className="mb-5 text-xl font-semibold leading-8 sm:text-2xl">
        <Text copy={title} />
      </h2>
      {children}
    </section>
  );
}
export function Note({ copy }: { copy: Copy }) {
  return (
    <p className="my-4 max-w-5xl border-l-2 border-primary/40 pl-4 text-sm leading-7 text-muted-foreground">
      <Text copy={copy} />
    </p>
  );
}
export function Source({ id }: { id: string }) {
  const { t } = useLanguage();
  const s = pack.sources.find((s) => s.source_id === id);
  if (!s) return null;
  const body = (
    <>
      <strong className="block text-sm">{s.title}</strong>
      <span className="mt-2 block text-xs leading-6">
        {s.organization}
        <br />
        {t("Source date / scope", "来源日期 / 范围")}: {s.date_or_snapshot}
        <br />
        {t("Source review date", "来源核验日期")}: {s.last_verified}
      </span>
      <a
        href={s.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block min-h-9 text-sm text-primary underline"
      >
        {t("Open source", "打开来源")}
      </a>
    </>
  );
  return (
    <span className="inline-flex">
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t("Source", "来源")}: ${s.title}`}
            className="hidden min-h-7 items-center text-primary underline underline-offset-4 sm:inline-flex"
          >
            {s.organization}
          </a>
        </TooltipTrigger>
        <TooltipContent className="max-w-80 p-3">{body}</TooltipContent>
      </Tooltip>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="min-h-8 text-primary underline underline-offset-4 sm:hidden"
            aria-label={`${t("Source", "来源")}: ${s.title}`}
          >
            {s.organization}
          </button>
        </PopoverTrigger>
        <PopoverContent className="max-w-[85vw]">{body}</PopoverContent>
      </Popover>
    </span>
  );
}
function DateLabel({ date }: { date: string | null }) {
  const { t, language } = useLanguage();
  if (!date) return <>{t("Observation date unavailable", "观测日期不可用")}</>;
  return (
    <time dateTime={date}>
      {new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-GB", {
        ...(/^\d{4}-\d{2}$/.test(date)
          ? { month: "short" as const, year: "numeric" as const }
          : { dateStyle: "medium" as const }),
        ...(date.includes("T") && !date.endsWith("T00:00:00.000Z")
          ? { timeStyle: "short" as const, timeZone: "UTC" }
          : {}),
      }).format(new Date(date))}
      {date.includes("T") && !date.endsWith("T00:00:00.000Z") ? " UTC" : ""}
    </time>
  );
}
export function Metadata({ metric: m }: { metric: DataMetric }) {
  const { t } = useLanguage();
  const zh = META_ZH[m.source_id];
  const method = t(
    m.methodology_note ||
      "A valid observation is required; unavailable data are not zero.",
    (m.metric_id === "MKT_TOP2_SHARE"
      ? "以来源快照中规模最大的两个美元目标候选资产为分子，使用与总量观测日对齐的美元历史值，除以同日追踪流通美元价值；这是供应集中度，不是交易或流动性集中度。"
      : m.metric_id === "MKT_30D_NET_CHANGE"
        ? "同一来源的美元计价总量：当前观测减去可比历史观测。历史点最多可早于三十日前目标日两个自然日；缺失历史不视为零。"
        : zh?.[0]) ||
      ([
        "SRC-MD-12",
        "SRC-MD-13",
        "SRC-MD-14",
        "SRC-MD-15",
        "SRC-MD-16",
        "SRC-MD-17",
        "SRC-MD-18",
      ].includes(m.source_id)
        ? "FRED 官方逐日观测；缺失值保留为空缺。新鲜度容差为五个自然日，以兼顾非发布日。"
        : "需要有效观测；不可用数据不等于零。"),
  );
  const coverage = t(
    m.coverage_note || "Source coverage and access conditions apply.",
    zh?.[1] ||
      ([
        "SRC-MD-12",
        "SRC-MD-13",
        "SRC-MD-14",
        "SRC-MD-15",
        "SRC-MD-16",
        "SRC-MD-17",
        "SRC-MD-18",
      ].includes(m.source_id)
        ? "宏观数据只描述环境，不是发行方实际投资回报或稳定币因果结论。"
        : "来源覆盖与准入条件适用；没有有效观测时不展示数字。"),
  );
  return (
    <div
      data-data-health={m.freshness_state}
      className="mt-2 text-xs leading-6 text-muted-foreground"
    >
      <p className="flex flex-wrap items-center gap-x-2">
        <Source id={m.source_id} />
        <span>·</span>
        <DateLabel date={m.report_period_end || m.observation_time} />
        <span>·</span>
        <span className="font-medium text-foreground">
          <Text copy={STATES[m.freshness_state]} />
        </span>
      </p>
      <p>
        {t("Unit", "单位")}: {m.unit}
        {m.publication_time && (
          <>
            {" "}
            · {t("Published", "发布于")}:{" "}
            <DateLabel date={m.publication_time} />
          </>
        )}
      </p>
      {m.source_id === "SRC-MD-10" && (
        <p>
          {t(
            "Study period: Jan 2023–Aug 2025 · Published: Oct 2025 · 22 surveyed + 11 estimated firms",
            "研究期：2023 年 1 月–2025 年 8 月 · 发布：2025 年 10 月 · 22 家受访 + 11 家估算",
          )}
        </p>
      )}
      {m.freshness_state === "LAST_SUCCESSFUL_SNAPSHOT" && (
        <p>
          {t(
            "Current refresh unavailable; the original observation is retained.",
            "当前刷新不可用；保留原观测及其日期。",
          )}
        </p>
      )}
      <p className="mt-1 max-w-4xl">{coverage}</p>
      <details className="mt-1">
        <summary className="w-fit cursor-pointer py-1 text-primary underline underline-offset-4">
          {t("Definition & methodology", "定义与方法")}
        </summary>
        <p className="max-w-4xl py-2">{method}</p>
        {m.last_successful_fetch && (
          <p>
            {t(
              "Last successful retrieval (not observation time)",
              "上次成功获取（不是观测时间）",
            )}
            : <DateLabel date={m.last_successful_fetch} />
          </p>
        )}
      </details>
    </div>
  );
}
export function MetricValue({ metric: m }: { metric: DataMetric }) {
  const { t } = useLanguage();
  const value = displayValue(m);
  return value === null ? (
    <p className="mt-3 text-sm text-muted-foreground">
      {t("Data currently unavailable", "数据当前不可用")}
    </p>
  ) : (
    <p
      data-metric-value
      className={`mt-3 text-3xl font-semibold tabular-nums ${m.freshness_state === "LAST_SUCCESSFUL_SNAPSHOT" ? "text-muted-foreground" : "text-primary"}`}
    >
      {value}
      <span className="ml-2 text-sm font-normal">{m.unit}</span>
    </p>
  );
}
export function MetricCard({
  metric,
  title,
}: {
  metric: DataMetric;
  title: Copy;
}) {
  return (
    <article
      data-metric={metric.metric_id}
      className="min-w-0 border-t-2 border-primary/30 py-4"
    >
      <h3 className="font-semibold leading-7">
        <Text copy={title} />
      </h3>
      <MetricValue metric={metric} />
      <Metadata metric={metric} />
    </article>
  );
}
export function CompactHealth({
  metric,
  title,
}: {
  metric: DataMetric;
  title?: Copy;
}) {
  return (
    <article className="min-w-0 border-l-2 border-border pl-4">
      {title && (
        <h3 className="font-semibold">
          <Text copy={title} />
        </h3>
      )}
      <MetricValue metric={metric} />
      <Metadata metric={metric} />
    </article>
  );
}
export function DataLink({ href, copy }: { href: string; copy: Copy }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center text-sm font-semibold text-primary underline underline-offset-4"
    >
      <Text copy={copy} />
      <span aria-hidden="true" className="ml-2">
        →
      </span>
    </Link>
  );
}
const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--foreground))",
];
export function SeriesChart({
  series,
  normalise = false,
}: {
  series: { id: string; title: Copy; metric: DataMetric; points: Point[] }[];
  normalise?: boolean;
}) {
  const { t } = useLanguage();
  const selectId = useId();
  const [chosen, setChosen] = useState(series[0]?.id || "");
  const valid = series
    .map((s) => ({ ...s, points: readPoints(s.points) }))
    .filter(
      (s) =>
        s.metric.value !== null &&
        s.points.filter((p) => p.value !== null).length >= 2 &&
        (!normalise || s.points.some((p) => p.value !== null && p.value !== 0)),
    );
  const selected = valid.find((s) => s.id === chosen) || valid[0];
  if (!selected)
    return (
      <div className="space-y-5">
        {series.map((s) => (
          <CompactHealth key={s.id} metric={s.metric} title={s.title} />
        ))}
      </div>
    );
  const baseValue = selected.points.find(
    (p) => p.value !== null && p.value !== 0,
  )?.value;
  const points = selected.points.map((p) => ({
    ...p,
    raw: p.value,
    value:
      normalise &&
      p.value !== null &&
      baseValue !== null &&
      baseValue !== undefined
        ? (p.value / baseValue) * 100
        : p.value,
  }));
  return (
    <div className="min-w-0">
      {series.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label htmlFor={selectId} className="text-sm">
            {t("Series", "序列")}
          </label>
          <select
            id={selectId}
            className="min-h-10 max-w-full rounded border border-border bg-background px-3 text-sm"
            value={selected.id}
            onChange={(e) => setChosen(e.target.value)}
          >
            {valid.map((s) => (
              <option key={s.id} value={s.id}>
                {t(...s.title)}
              </option>
            ))}
          </select>
        </div>
      )}
      <h3 className="font-semibold">
        <Text copy={selected.title} />
      </h3>
      <Metadata metric={selected.metric} />
      <p className="mt-2 text-xs text-muted-foreground">
        {points[0]?.date.slice(0, 10)} – {points.at(-1)?.date.slice(0, 10)} ·{" "}
        {normalise
          ? t(
              "Normalised index · first valid non-zero observation = 100",
              "归一化指数 · 首个有效非零观测 = 100",
            )
          : selected.metric.unit}
      </p>
      <div data-valid-chart className="mt-4 h-[230px] min-w-0 sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 12, right: 15, bottom: 5, left: 5 }}
          >
            <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => String(v).slice(0, 10)}
              minTickGap={55}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              width={65}
              domain={["auto", "auto"]}
              tickFormatter={(v) =>
                new Intl.NumberFormat("en-GB", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(v)
              }
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <ChartTooltip
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="max-w-64 rounded border border-border bg-popover p-3 text-xs leading-6 text-popover-foreground">
                    <strong>{String(label).slice(0, 10)}</strong>
                    <p>
                      {t(...selected.title)}: {String(payload[0].value)}{" "}
                      {normalise ? t("index", "指数") : selected.metric.unit}
                    </p>
                    {normalise && (
                      <p>
                        {t("Raw quote", "原始报价")}: {payload[0].payload.raw}{" "}
                        {selected.metric.unit}
                      </p>
                    )}
                    <p>
                      {selected.metric.source} ·{" "}
                      <Text copy={STATES[selected.metric.freshness_state]} />
                    </p>
                  </div>
                ) : null
              }
            />
            <Line
              dataKey="value"
              type="linear"
              stroke={COLORS[0]}
              dot={false}
              connectNulls={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {series
        .filter((s) => !valid.some((v) => v.id === s.id))
        .map((s) => (
          <div key={s.id} className="mt-4">
            <CompactHealth metric={s.metric} title={s.title} />
          </div>
        ))}
    </div>
  );
}
