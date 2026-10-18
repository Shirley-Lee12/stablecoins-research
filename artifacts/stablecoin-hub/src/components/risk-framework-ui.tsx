import type { ReactNode } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import {
  CONFERENCE,
  CURRENT,
  FUTURE,
  DISTINCTIONS,
  OUTCOMES,
  type FrameworkCopy,
  representativeRisks,
} from "@/data/conference-risk-framework";
export function FrameworkText({ copy }: { copy: FrameworkCopy }) {
  const { t } = useLanguage();
  return <>{t(...copy)}</>;
}
export function FrameworkNav({ route }: { route: string }) {
  const { t } = useLanguage();
  return (
    <nav
      aria-label={t("Risk framework navigation", "风险框架导航")}
      className="mb-8 flex flex-wrap gap-2 border-b border-border pb-4"
    >
      {CONFERENCE.nav.map((n) => (
        <Link
          key={n.route}
          href={n.route}
          aria-current={route === n.route ? "page" : undefined}
          className={`inline-flex min-h-11 max-w-full items-center rounded-sm px-3 py-2 text-sm leading-6 ${route === n.route ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          {t(n.en, n.zh)}
        </Link>
      ))}
    </nav>
  );
}
export function FrameworkSection({
  id,
  title,
  children,
}: {
  id: string;
  title: FrameworkCopy;
  children: ReactNode;
}) {
  return (
    <section id={id} className="min-w-0 border-t border-border py-8 sm:py-10">
      <h2 className="mb-5 font-serif text-2xl font-bold text-primary sm:text-3xl">
        <FrameworkText copy={title} />
      </h2>
      {children}
    </section>
  );
}
export function FrameworkBoundary({ children }: { children: ReactNode }) {
  return (
    <div className="my-5 border-l-2 border-primary bg-primary/5 px-4 py-4 text-sm leading-7">
      {children}
    </div>
  );
}
export function StudySource() {
  const { t } = useLanguage();
  return (
    <details className="mt-5 text-sm leading-7 text-muted-foreground">
      <summary className="min-h-11 cursor-pointer font-medium text-primary">
        {t(CONFERENCE.study.programme_label_en, CONFERENCE.study.programme_label_zh)}{" "}
        {t(CONFERENCE.study.programme_display_en, CONFERENCE.study.programme_display_zh)}
      </summary>
      <p className="mt-2 max-w-4xl">
        {t(CONFERENCE.study.title, CONFERENCE.study.title)}
      </p>
      <p>{t("Xueli Li · Zhejiang University", "Xueli Li · 浙江大学")}</p>
      <p>{t("Conference dates: 29 September–2 October 2026", "会议日期：2026年9月29日至10月2日")}</p>
      <p>{t("Conference paper accepted. The preliminary programme does not confirm completion of the presentation or publication.", "会议论文已接收。初步节目表不能证明报告已经完成或论文已经出版。")}</p>
    </details>
  );
}
export function RepresentativeRisks({
  risks,
}: {
  risks: ReturnType<typeof representativeRisks>;
}) {
  return (
    <ul className="mt-3 space-y-2 text-sm leading-7">
      {risks.map((r) => (
        <li key={r.id} data-representative-risk={r.id}>
          <span className="mr-2 font-mono text-xs font-semibold text-primary">
            {r.id}
          </span>
          <FrameworkText copy={r.name} />
        </li>
      ))}
    </ul>
  );
}
export function CurrentFuture({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  return (
    <section
      id="current-future"
      data-current-future
      className="min-w-0 border-t border-border py-8 sm:py-10"
    >
      <h2 className="mb-6 font-serif text-2xl font-bold text-primary">
        {t("Current study & future research", "当前研究与未来研究")}
      </h2>
      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <div
          data-study-state="CURRENT_STUDY"
          className="min-w-0 border-l-2 border-primary pl-5"
        >
          <h3 className="text-lg font-semibold text-primary">
            {t("Current study", "当前研究")}
          </h3>
          <p className="mt-2 text-sm leading-7">
            {t(
              "Conceptual risk decomposition and two-dimensional mapping.",
              "概念风险拆解与二维映射。",
            )}
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-7">
            {CURRENT.map((c) => (
              <li key={c[0]}>
                <FrameworkText copy={c} />
              </li>
            ))}
          </ul>
        </div>
        <div
          data-study-state="FUTURE_RESEARCH"
          className="min-w-0 border-l-2 border-dashed border-border pl-5"
        >
          <h3 className="text-lg font-semibold">
            {t("Future research", "未来研究")}
          </h3>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {t(
              "Planned research directions beyond the current conceptual study.",
              "超出当前概念研究阶段的后续研究方向。",
            )}
          </p>
          <ul className="mt-3 space-y-3 text-sm leading-7">
            {FUTURE.map((f) => (
              <li key={f.id} data-future-research={f.id}>
                <span className="font-medium">
                  <FrameworkText copy={f.title} />
                </span>
                {!compact && (
                  <p className="text-muted-foreground">
                    <FrameworkText copy={f.description} />
                  </p>
                )}
              </li>
            ))}
          </ul>
          {compact && (
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t(
                "Including stress detection and tiered early warning.",
                "包括压力识别与分层早期预警。",
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
export function DimensionDistinctions() {
  const { t } = useLanguage();
  return (
    <dl data-dimension-distinctions className="grid gap-x-8 sm:grid-cols-2">
      {DISTINCTIONS.map((d) => (
        <div key={d.id} className="border-t border-border py-5">
          <dt className="font-mono text-lg font-semibold text-primary">
            {d.id}
          </dt>
          <dd className="mt-2 text-sm leading-7">
            <FrameworkText copy={d.left} />
            <span className="mx-2 text-muted-foreground">
              {t("versus", "与")}
            </span>
            <FrameworkText copy={d.right} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
type Stage = {
  level: string;
  title: FrameworkCopy;
  description: FrameworkCopy;
  risks: ReturnType<typeof representativeRisks>;
};
export function MappingBand({
  stages,
  kind,
}: {
  stages: Stage[];
  kind: "lifecycle" | "amplification";
}) {
  const { t } = useLanguage();
  return (
    <ol
      data-mapping-band={kind}
      className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-4"
    >
      {stages.map((s, i) => (
        <li
          key={s.level}
          data-mapping-stage={s.level}
          className="relative min-w-0 border-t-2 border-primary bg-muted/20 px-4 py-5"
        >
          <span className="font-mono text-2xl font-semibold text-primary">
            {s.level}
          </span>
          <h3 className="mt-3 text-lg font-semibold leading-7">
            <FrameworkText copy={s.title} />
          </h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            <FrameworkText copy={s.description} />
          </p>
          {s.risks.length > 0 ? (
            <>
              <p className="mt-5 text-xs font-semibold">
                {t("Representative risks", "代表性风险")}
              </p>
              <RepresentativeRisks risks={s.risks} />
            </>
          ) : (
            <ul
              data-cross-system-outcomes
              className="mt-4 space-y-2 text-sm leading-7"
            >
              {OUTCOMES.map((o) => (
                <li key={o[0]}>
                  <FrameworkText copy={o} />
                </li>
              ))}
            </ul>
          )}
          {i < stages.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute -bottom-5 left-1/2 z-10 bg-background px-1 text-primary lg:-right-4 lg:bottom-auto lg:left-auto lg:top-6"
            >
              <span className="lg:hidden">↓</span>
              <span className="hidden lg:inline">→</span>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
