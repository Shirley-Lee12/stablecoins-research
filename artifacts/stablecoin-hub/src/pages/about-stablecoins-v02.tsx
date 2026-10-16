import { useRoute } from "wouter";
import {
  ABOUT,
  ABOUT_PAGES,
  HISTORY_CHANGE_EN,
  APPLICATION_ZH,
  TYPE_AXES_ZH,
  REGULATORY_FOCUS_ZH,
  REGULATORY_SOURCES,
  type AboutCopy,
  type AboutModule,
} from "@/data/about-stablecoins";
import {
  AboutFrame,
  AboutText,
  AboutCite,
  AboutFigure,
  AboutNote,
  AboutLink,
} from "@/components/about-stablecoins-ui";
import { useLanguage } from "@/lib/language-context";

const EVENT_TYPES: Record<string, AboutCopy> = {
  PRODUCT: ["Product", "产品"],
  MECHANISM: ["Mechanism", "机制"],
  MARKET_STRUCTURE: ["Market structure", "市场结构"],
  FAILURE: ["Historical failure", "历史失败"],
  REGULATION: ["Regulation", "监管"],
  SYSTEMIC_OVERSIGHT: ["Systemic oversight", "系统性监督"],
};

export function AboutHistoryTimeline() {
  const { t } = useLanguage();
  return (
    <ol data-about-timeline className="space-y-0">
      {ABOUT.history.map((event, i) => (
        <li
          key={event.date}
          data-history-event={event.date}
          className="relative grid gap-3 border-l border-primary/25 pb-7 pl-5 last:pb-0 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-6 sm:pl-6"
        >
          <span className="absolute -left-[4px] top-1.5 h-2 w-2 rounded-full bg-primary" />
          <div>
            <time className="font-mono text-sm font-semibold text-primary">
              {event.date}
            </time>
            <p className="mt-2 text-xs text-muted-foreground">
              <AboutText copy={EVENT_TYPES[event.type]} />
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold leading-7">
              {t(event.title_en, event.title_zh)}
              <AboutCite ids={event.source_ids} />
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              <span className="font-medium text-foreground">
                {t("What changed: ", "改变了什么：")}
              </span>
              {t(HISTORY_CHANGE_EN[i], event.what_changed_zh)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function AboutApplicationMatrix() {
  const { t } = useLanguage();
  const columns: AboutCopy[] = [
    ["Task", "任务"],
    ["Why a stablecoin may help", "稳定币可能提供的作用"],
    ["Evidence state", "证据状态"],
    ["Key constraint", "关键约束"],
  ];
  return (
    <div data-about-applications>
      <div className="hidden lg:block">
        <table className="w-full table-fixed text-left text-sm">
          <caption className="sr-only">
            {t(
              "Application is not adoption: tasks, benefits, evidence and constraints",
              "应用不等于采用：任务、作用、证据与约束",
            )}
          </caption>
          <thead>
            <tr className="border-y border-border bg-muted/35">
              {columns.map((c) => (
                <th key={c[0]} scope="col" className="px-3 py-3 font-medium">
                  <AboutText copy={c} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ABOUT.applications.map((row, i) => {
              const zh = APPLICATION_ZH[i];
              return (
                <tr
                  key={row.application}
                  data-application-row={i}
                  className="align-top border-b border-border"
                >
                  <th scope="row" className="px-3 py-4 font-normal">
                    <strong className="font-semibold">
                      {t(row.application, zh[0])}
                    </strong>
                    <p className="mt-2 leading-6 text-muted-foreground">
                      {t(row.task, zh[1])}
                    </p>
                    <ApplicationSources value={row.source_ids_or_link} />
                  </th>
                  {[
                    row.why_stablecoin_may_help,
                    row.evidence_state,
                    row.constraint,
                  ].map((value, col) => (
                    <td
                      key={col}
                      className="break-words px-3 py-4 leading-7 text-muted-foreground"
                    >
                      {t(value, zh[col + 2])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-border lg:hidden">
        {ABOUT.applications.map((row, i) => {
          const zh = APPLICATION_ZH[i];
          const values = [
            row.task,
            row.why_stablecoin_may_help,
            row.evidence_state,
            row.constraint,
          ];
          return (
            <article key={row.application} className="py-5 first:pt-0">
              <h3 className="text-lg font-semibold">
                {t(row.application, zh[0])}
                <ApplicationSources value={row.source_ids_or_link} />
              </h3>
              <dl className="mt-3 space-y-3">
                {values.map((value, col) => (
                  <div key={col}>
                    <dt className="text-xs font-semibold text-primary">
                      <AboutText copy={columns[col]} />
                    </dt>
                    <dd className="mt-1 text-sm leading-7 text-muted-foreground">
                      {t(value, zh[col + 1])}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          );
        })}
      </div>
      <AboutNote
        copy={[
          "Stablecoins are one possible rail for agentic payments, not a prerequisite. Authorisation and liability remain separate questions.",
          "稳定币是智能体支付的可选轨道之一，不是必要条件；授权与责任仍需另外解决。",
        ]}
      />
    </div>
  );
}
function ApplicationSources({ value }: { value: string }) {
  return value.startsWith("Internal link:") ? (
    <span className="block">
      <AboutLink
        href="/agentic-payments"
        label={["Explore agentic payments", "查看智能体支付"]}
      />
    </span>
  ) : (
    <AboutCite ids={value.split(";")} />
  );
}

function AboutTaxonomyMatrix() {
  const { t } = useLanguage();
  const fields = [
    ["economic_support", "Economic support", "价值支撑"],
    ["exit_or_redemption", "Exit / redemption", "退出 / 赎回"],
    ["stabilisation_mechanism", "Stabilisation", "稳定机制"],
  ] as const;
  return (
    <div data-about-taxonomy>
      <div className="hidden lg:block">
        <table className="w-full table-fixed text-left text-sm">
          <caption className="sr-only">
            {t(
              "Mechanism-first comparison through three axes",
              "按三条机制轴比较稳定币",
            )}
          </caption>
          <thead>
            <tr className="border-y border-border bg-muted/35">
              <th scope="col" className="px-3 py-3 font-medium">
                {t("Teaching group", "教学分类")}
              </th>
              {fields.map((f) => (
                <th key={f[0]} scope="col" className="px-3 py-3 font-medium">
                  {t(f[1], f[2])}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ABOUT.types.map((row, i) => (
              <tr
                key={row.teaching_group}
                className="border-b border-border align-top"
              >
                <th scope="row" className="px-3 py-4 font-normal">
                  <AboutLink
                    href={ABOUT.nav.type_nav[i].route}
                    label={[row.teaching_group, ABOUT.nav.type_nav[i].label_zh]}
                  />
                  <AboutCite ids={row.source_ids.split(";")} />
                </th>
                {fields.map((f, col) => (
                  <td
                    key={f[0]}
                    className="px-3 py-4 leading-7 text-muted-foreground"
                  >
                    {t(row[f[0]], TYPE_AXES_ZH[i][col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-border lg:hidden">
        {ABOUT.types.map((row, i) => (
          <article key={row.teaching_group} className="py-4 first:pt-0">
            <h3>
              <AboutLink
                href={ABOUT.nav.type_nav[i].route}
                label={[row.teaching_group, ABOUT.nav.type_nav[i].label_zh]}
              />
            </h3>
            <dl className="mt-2 space-y-2">
              {fields.map((f, col) => (
                <div key={f[0]}>
                  <dt className="text-xs font-semibold text-primary">
                    {t(f[1], f[2])}
                  </dt>
                  <dd className="mt-1 text-sm leading-7 text-muted-foreground">
                    {t(row[f[0]], TYPE_AXES_ZH[i][col])}
                  </dd>
                </div>
              ))}
            </dl>
            <AboutCite ids={row.source_ids.split(";")} />
          </article>
        ))}
      </div>
    </div>
  );
}

function AboutRegulatoryStages() {
  const { t } = useLanguage();
  return (
    <ol data-about-regulatory-stages className="space-y-5">
      {ABOUT.regulatory.map((stage, i) => (
        <li
          key={stage.stage}
          className="grid gap-2 border-l-2 border-primary/25 pl-4 sm:grid-cols-[14rem_minmax(0,1fr)]"
        >
          <h3 className="font-semibold leading-7">
            <span className="mr-3 font-mono text-xs text-primary">
              0{stage.stage}
            </span>
            {t(stage.label_en, stage.label_zh)}
            <AboutCite ids={REGULATORY_SOURCES[i]} />
          </h3>
          <p className="text-sm leading-7 text-muted-foreground">
            {stage.focus
              .map((focus, j) => t(focus, REGULATORY_FOCUS_ZH[i][j]))
              .join(t(" · ", " · "))}
            {stage.stage === 2 && (
              <span className="mt-1 block">
                {t(
                  "Also includes AML/CFT and recovery / wind-down arrangements.",
                  "还包括反洗钱 / 反恐融资，以及恢复与有序退出安排。",
                )}
              </span>
            )}
          </p>
        </li>
      ))}
    </ol>
  );
}

const MILESTONES: { date: string; copy: AboutCopy; sources: string[] }[] = [
  {
    date: "2023-07-17",
    copy: [
      "FSB finalises its global stablecoin recommendations.",
      "FSB 全球稳定币建议定稿。",
    ],
    sources: ["SRC-STB-04"],
  },
  {
    date: "2024-06-30",
    copy: [
      "EU MiCA ART/EMT provisions begin applying.",
      "欧盟 MiCA ART / EMT 条款开始适用。",
    ],
    sources: ["SRC-STB-23"],
  },
  {
    date: "2025-07-18",
    copy: [
      "The US GENIUS Act is signed into law.",
      "美国 GENIUS Act 签署成法。",
    ],
    sources: ["SRC-STB-24"],
  },
  {
    date: "2025-08-01",
    copy: [
      "Hong Kong's stablecoin issuer regime enters into force.",
      "香港稳定币发行人制度生效。",
    ],
    sources: ["SRC-STB-25"],
  },
  {
    date: "2025",
    copy: [
      "FSB's review finds implementation remains uneven.",
      "FSB review 指出各地实施仍不一致。",
    ],
    sources: ["SRC-STB-05"],
  },
  {
    date: "2026",
    copy: [
      "UK framework development and FSB cross-border vulnerability/data-monitoring work continue.",
      "英国推进稳定币框架，FSB 继续研究跨境脆弱性与数据监测。",
    ],
    sources: ["SRC-STB-26", "SRC-STB-06"],
  },
];
function RegulatoryMilestones() {
  return (
    <ul className="divide-y divide-border">
      {MILESTONES.map((m, i) => (
        <li
          key={i}
          className="grid gap-2 py-3 text-sm leading-7 sm:grid-cols-[8rem_minmax(0,1fr)]"
        >
          <time className="font-mono text-primary">{m.date}</time>
          <p>
            <AboutText copy={m.copy} />
            <AboutCite ids={m.sources} />
          </p>
        </li>
      ))}
    </ul>
  );
}

function AboutModuleView({
  module,
  index,
}: {
  module: AboutModule;
  index: number;
}) {
  return (
    <section
      id={module.id}
      data-about-module={module.id}
      className="min-w-0 scroll-mt-6 border-t border-border py-7 sm:py-9"
    >
      <h2 className="mb-5 flex items-baseline gap-3 text-xl font-semibold leading-8 sm:text-2xl">
        <span className="font-mono text-xs text-primary">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span>
          <AboutText copy={module.title} />
          <AboutCite ids={module.sources} />
        </span>
      </h2>
      {module.paragraphs?.map((p, i) => (
        <p
          key={i}
          className="mb-3 max-w-4xl text-sm leading-8 text-muted-foreground sm:text-base"
        >
          <AboutText copy={p} />
        </p>
      ))}
      {module.rows && (
        <div
          className={`grid gap-x-8 gap-y-5 ${module.id === "four-questions" || module.id === "money-boundaries" ? "sm:grid-cols-2" : ""}`}
        >
          {module.rows.map((row, i) => (
            <article
              key={i}
              className="min-w-0 border-l border-primary/25 pl-4"
            >
              <h3 className="text-base font-semibold leading-7">
                <AboutText copy={row.title} />
                <AboutCite ids={row.sources} />
              </h3>
              <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground">
                <AboutText copy={row.text} />
              </p>
            </article>
          ))}
        </div>
      )}
      {module.bullets && (
        <ul className="max-w-4xl space-y-3 pl-5 text-sm leading-7 text-muted-foreground marker:text-primary list-disc">
          {module.bullets.map((b, i) => (
            <li key={i}>
              <AboutText copy={b} />
            </li>
          ))}
        </ul>
      )}
      {module.kind === "timeline" && <AboutHistoryTimeline />}
      {module.kind === "applications" && <AboutApplicationMatrix />}
      {module.kind === "taxonomy" && <AboutTaxonomyMatrix />}
      {module.kind === "regulatory" && <AboutRegulatoryStages />}
      {module.kind === "milestones" && <RegulatoryMilestones />}
      {module.note && <AboutNote copy={module.note} />}
      {module.figure && <AboutFigure {...module.figure} />}
      {module.links && (
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          {module.links.map((link) => (
            <AboutLink key={link.href} {...link} />
          ))}
        </div>
      )}
    </section>
  );
}

function AboutTopicPage({ pageKey }: { pageKey: string }) {
  const page = ABOUT_PAGES[pageKey];
  return (
    <AboutFrame
      title={page.title}
      lead={page.lead}
      types={
        pageKey === "types" ||
        ABOUT.nav.type_nav.some((n) => n.route.endsWith(`/${pageKey}`))
      }
    >
      {page.modules.map((module, index) => (
        <AboutModuleView key={module.id} module={module} index={index} />
      ))}
    </AboutFrame>
  );
}
export function AboutOverviewPage() {
  return <AboutTopicPage pageKey="overview" />;
}
export function AboutHistoryPage() {
  return <AboutTopicPage pageKey="history" />;
}
export function AboutTypesPage() {
  return <AboutTopicPage pageKey="types" />;
}
export function AboutApplicationsPage() {
  return <AboutTopicPage pageKey="applications" />;
}
export function AboutRegulatoryEvolutionPage() {
  return <AboutTopicPage pageKey="regulatory-evolution" />;
}
export function AboutMechanismPage() {
  const [, params] = useRoute("/about-stablecoins/types/:mechanism");
  const key = params?.mechanism;
  if (
    !key ||
    !ABOUT.nav.type_nav.some(
      (n) => n.route === `/about-stablecoins/types/${key}`,
    )
  )
    return (
      <AboutFrame title={["Mechanism not found", "未找到该机制"]}>
        <AboutLink
          href="/about-stablecoins/types"
          label={["Back to Types", "返回类别"]}
        />
      </AboutFrame>
    );
  return <AboutTopicPage pageKey={key} />;
}
