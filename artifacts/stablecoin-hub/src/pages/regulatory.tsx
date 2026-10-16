import { useLanguage } from "@/lib/language-context";
import { ContentEdgeNav } from "@/components/content-edge-nav";
import {
  regulatoryPackage as pack,
  JURISDICTIONS,
  FIELDS,
  STATUS_COPY,
  STATUS_ZH,
  EVENT_TYPES,
  TIMELINE,
  CONVERGENCE,
  DIVERGENCE,
  INTERNATIONAL,
} from "@/data/regulatory";
import {
  RegulatoryText as Text,
  RegulatorySection as Section,
  RegulatoryHint,
  RegulatorySource,
  JurisdictionCard,
  JurisdictionSources,
  RegionalLink,
  LicenceRegister,
} from "@/components/regulatory-ui";
export default function Regulatory() {
  const { t } = useLanguage();
  return (
    <div data-regulatory-v02 className="mx-auto w-full min-w-0 max-w-7xl pb-8">
      <ContentEdgeNav
        label={t("On this page", "本页导航")}
        items={[
          {
            id: "status-legend",
            label: t("Regulatory status legend", "监管状态图例"),
          },
          {
            id: "jurisdiction-comparison",
            label: t("Jurisdiction comparison", "法域比较"),
          },
          {
            id: "current-timeline",
            label: t("Current regulatory timeline", "当前监管变化时间线"),
          },
          {
            id: "convergence-divergence",
            label: t("Convergence and divergence", "收敛与差异"),
          },
          {
            id: "international-standards",
            label: t("International standards", "国际标准"),
          },
          { id: "official-sources", label: t("Official sources", "官方来源") },
        ]}
      />
      <header className="pb-9">
        <h1 className="max-w-5xl font-serif text-3xl font-bold leading-tight text-primary sm:text-4xl">
          {t(
            "Stablecoin regulation: compare legal status, not just policy direction",
            "稳定币监管：比较的是法律状态，不只是政策态度",
          )}
        </h1>
        <p className="mt-5 max-w-4xl text-base leading-8 text-muted-foreground">
          {t(
            "Jurisdictions increasingly discuss the same themes — reserves, redemption, governance and AML/CFT — but similar policy language does not mean that their regimes are at the same legal stage.",
            "不同法域都在讨论储备、赎回、治理和反洗钱，但相似的政策语言并不意味着制度处于同一法律阶段。",
          )}
        </p>
        <p data-last-verified className="mt-5 font-medium text-primary">
          {t(
            "Regulatory status last verified: 16 October 2026",
            "监管状态最后核验：2026年10月16日",
          )}
        </p>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "This page is for comparative research and is not legal advice. Consult the applicable official texts and current licence/register records for a specific activity.",
            "本页用于研究比较，不构成法律意见。具体业务应以适用官方文本及最新牌照 / 登记状态为准。",
          )}
        </p>
      </header>
      <Section
        id="status-legend"
        title={["Regulatory Status Legend", "监管状态图例"]}
      >
        <p className="mb-4 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "Status describes legal implementation within a stated scope. It is not a measure of investment quality. Open a label for its definition.",
            "状态描述特定范围内的法律实施阶段，不代表投资质量。点击或聚焦标签可查看定义。",
          )}
        </p>
        <div
          data-status-legend
          className="grid gap-x-7 gap-y-1 sm:grid-cols-2 xl:grid-cols-3"
        >
          {pack.taxonomy.status_order.map((code) => (
            <RegulatoryHint key={code} label={t(...STATUS_COPY[code])}>
              {t(
                pack.taxonomy.definitions[
                  code as keyof typeof pack.taxonomy.definitions
                ],
                STATUS_ZH[code],
              )}
            </RegulatoryHint>
          ))}
        </div>
        <div className="mt-5 space-y-2 border-l-2 border-primary/30 pl-4 text-sm leading-7">
          <p>{t("Law enacted ≠ regime in force", "法律通过 ≠ 制度生效")}</p>
          <p>
            {t(
              "Framework finalised ≠ binding issuer regime",
              "政策框架定稿 ≠ 具有约束力的发行人制度",
            )}
          </p>
          <p>
            {t(
              "Issuer licence ≠ token public launch",
              "发行人牌照 ≠ 代币公开上线",
            )}
          </p>
        </div>
        <p className="mt-5 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "Document types remain distinct: law, regulation, final rule, proposed rule, consultation, guidance, policy framework, notice and register. A register records licence status; it does not approve every product.",
            "文件类型另行区分为法律、法规、最终规则、规则提案、咨询、指引、政策框架、通知及登记册。登记册记录牌照状态，不是对每个产品的批准。",
          )}
        </p>
      </Section>
      <Section
        id="jurisdiction-comparison"
        title={["Eight-jurisdiction comparison", "八法域比较"]}
      >
        <p className="mb-5 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "Compare legal status, issuer access and holder protections together. Requirements below retain their enacted, final, proposed or restrictive scope; they are not interchangeable permissions.",
            "应结合比较法律状态、发行准入与持有人保护。下列要求保留已立法、最终规则、拟议内容或限制性范围，不能互换为同一种许可。",
          )}
        </p>
        <div className="hidden min-w-0 lg:block">
          <p className="mb-3 text-xs leading-6 text-muted-foreground">
            {t(
              "Scroll horizontally for all comparison fields. Jurisdiction and current status stay visible.",
              "横向滚动查看全部比较字段；法域与当前状态两列保持可见。",
            )}
          </p>
          <div
            data-desktop-comparison
            role="region"
            aria-label={t(
              "Scrollable jurisdiction comparison",
              "可滚动法域比较",
            )}
            tabIndex={0}
            className="max-w-full overflow-x-auto rounded-sm border-y border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <table className="w-full min-w-[2248px] table-fixed border-collapse text-left text-sm leading-7">
              <caption className="sr-only">
                {t(
                  "Eight jurisdictions compared as of 16 October 2026. International standards are listed separately.",
                  "截至 2026 年 10 月 16 日的八法域比较；国际标准另行列示。",
                )}
              </caption>
              <colgroup>
                <col style={{ width: 168 }} />
                <col style={{ width: 280 }} />
                {FIELDS.map(([key]) => (
                  <col key={key} style={{ width: 300 }} />
                ))}
              </colgroup>
              <thead>
                <tr className="bg-muted/40">
                  <th
                    scope="col"
                    className="sticky left-0 z-20 bg-background p-4 align-top"
                  >
                    {t("Jurisdiction", "法域")}
                  </th>
                  <th
                    scope="col"
                    className="sticky left-[168px] z-20 border-r border-border bg-background p-4 align-top"
                  >
                    {t(
                      "Current legal status / stage / date",
                      "当前法律状态 / 阶段 / 日期",
                    )}
                  </th>
                  {FIELDS.map(([key, en, zh]) => (
                    <th key={key} scope="col" className="p-4 align-top">
                      {t(en, zh)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {JURISDICTIONS.map((row) => (
                  <tr
                    key={row.id}
                    data-desktop-jurisdiction={row.id}
                    className="border-t border-border"
                  >
                    <th
                      scope="row"
                      className="sticky left-0 z-10 space-y-4 bg-background p-4 align-top font-normal"
                    >
                      <h3 className="font-serif text-lg font-bold text-primary">
                        <Text copy={row.name} />
                      </h3>
                      <JurisdictionSources row={row} />
                      <RegionalLink row={row} />
                    </th>
                    <td className="sticky left-[168px] z-10 border-r border-border bg-background p-4 align-top">
                      <p data-field="status" className="font-semibold">
                        <Text copy={row.status} />
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t(
                          "As of 16 October 2026",
                          "核验于 2026 年 10 月 16 日",
                        )}
                      </p>
                      <p data-field="stage-date" className="mt-4">
                        <Text copy={row.stage} />
                      </p>
                    </td>
                    {FIELDS.map(([key]) => (
                      <td key={key} data-field={key} className="p-4 align-top">
                        <Text copy={row.fields[key]} />
                        {key === "issuer_permission" && row.id === "hk" && (
                          <LicenceRegister />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div data-mobile-comparison className="lg:hidden">
          {JURISDICTIONS.map((row) => (
            <JurisdictionCard key={row.id} row={row} />
          ))}
        </div>
        <p className="mt-5 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "US effective-date mechanics: the earlier of 18 months after enactment or 120 days after the primary federal regulators issue final implementing regulations. Expected 18 January 2027 absent an earlier trigger.",
            "美国生效机制：成法后 18 个月与主要联邦监管机构发布最终实施规则后 120 天两者较早者；无更早触发时预计 2027 年 1 月 18 日生效。",
          )}{" "}
          <RegulatorySource id="US-01" />
        </p>
      </Section>
      <Section
        id="current-timeline"
        title={["Current regulatory timeline", "当前监管变化时间线"]}
      >
        <ol className="ml-2 max-w-5xl border-l border-primary/30 pl-6">
          {TIMELINE.map((item) => (
            <li
              data-regulatory-event
              key={item.date + item.jurisdiction}
              className="relative pb-8 before:absolute before:-left-[29px] before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-primary"
            >
              <p className="text-xs font-medium leading-6 text-muted-foreground">
                <time dateTime={item.date}>{item.date}</time>
                <span> · </span>
                <Text copy={item.jurisdictionCopy} />
              </p>
              <h3 className="mt-1 font-semibold text-primary">
                <Text copy={EVENT_TYPES[item.type]} />
              </h3>
              <p className="mt-2 text-sm leading-7">
                <Text copy={item.eventCopy} />
              </p>
              {item.jurisdiction === "Singapore" && (
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  {t(
                    "Consultation closes: 16 October 2026 · 23:59 Singapore time",
                    "咨询截止：2026 年 10 月 16 日 · 新加坡时间 23:59",
                  )}
                </p>
              )}
              <div className="mt-1 flex flex-wrap gap-x-4">
                {item.source_ids.map((id) => (
                  <RegulatorySource key={id} id={id} />
                ))}
              </div>
            </li>
          ))}
        </ol>
      </Section>
      <Section
        id="convergence-divergence"
        title={["Regulatory convergence / divergence", "监管收敛 / 差异"]}
      >
        <div className="grid gap-8 md:grid-cols-2">
          {[
            {
              title: ["Common themes", "共同主题"] as const,
              items: CONVERGENCE,
            },
            {
              title: ["Material differences", "主要差异"] as const,
              items: DIVERGENCE,
            },
          ].map((group) => (
            <div key={group.title[0]}>
              <h3 className="mb-3 text-lg font-semibold">
                <Text copy={group.title} />
              </h3>
              <ul className="space-y-3 text-sm leading-7">
                {group.items.map((copy) => (
                  <li
                    key={copy[0]}
                    className="border-l-2 border-primary/20 pl-3"
                  >
                    <Text copy={copy} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "Similar safeguards do not make legal categories, eligible issuers or implementation dates equivalent.",
            "相似的保障主题不意味着法律类别、发行人准入或实施日期相同。",
          )}
        </p>
      </Section>
      <Section
        id="international-standards"
        title={["International standards and monitoring", "国际标准与监测"]}
      >
        <div className="grid gap-7 lg:grid-cols-3">
          {INTERNATIONAL.map((item) => (
            <article key={item.name} data-international={item.name}>
              <h3 className="mb-3 font-serif text-xl font-bold text-primary">
                {item.name}
              </h3>
              <p className="text-sm leading-7">
                <Text copy={item.copy} />
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4">
                {item.sourceIds.map((id) => (
                  <RegulatorySource id={id} key={id} />
                ))}
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 border-l-2 border-primary/30 pl-4 text-sm leading-7 text-muted-foreground">
          {t(
            "These standards coordinate regulatory outcomes; they do not replace domestic law.",
            "这些标准协调监管结果，不直接取代国内法律。",
          )}
        </p>
      </Section>
      <Section
        id="official-sources"
        title={["Official source access", "官方来源入口"]}
      >
        <p className="mb-5 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "Open a citation to inspect the authority, document type and distinct dates. Last verified is a research review date, not a legal commencement date or a guarantee against later changes.",
            "打开引文可查看主管机构、文件类型及不同日期。最后核验日是研究复核日期，不是法律生效日期，也不保证其后不会发生变化。",
          )}
        </p>
        <div className="grid gap-x-8 md:grid-cols-2">
          {[
            ...JURISDICTIONS.map((r) => ({ name: r.name, ids: r.sourceIds })),
            {
              name: [
                "International standards and monitoring",
                "国际标准与监测",
              ] as const,
              ids: pack.sources
                .filter((s) => s.jurisdiction === "International")
                .map((s) => s.source_id),
            },
          ].map((group) => (
            <details
              key={group.name[0]}
              className="min-w-0 border-t border-border py-4"
            >
              <summary className="cursor-pointer text-sm font-semibold text-primary">
                <Text copy={group.name} />
              </summary>
              <ul className="mt-3 space-y-3">
                {group.ids.map((id) => (
                  <li key={id}>
                    <RegulatorySource
                      id={id}
                      label={
                        pack.sources.find((s) => s.source_id === id)!.title
                      }
                    />
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </Section>
    </div>
  );
}
