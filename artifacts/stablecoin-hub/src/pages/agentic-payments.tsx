import React, { useState } from "react";
import { Link, Redirect, useParams } from "wouter";
import { ArrowRight, ChevronDown } from "lucide-react";
import {
  PaymentCitation,
  PaymentCopy,
  PaymentHero,
  PaymentPage,
  PaymentProtocolNav,
  PaymentSection,
  PaymentVisual,
  SourceList,
  usePaymentText,
} from "@/components/agentic-payment-ui";
import {
  AGENT_PROTOCOLS,
  ECOSYSTEM_ENTRIES,
  PACKAGE,
  between,
  detailCopy,
  detailEnglish,
  ecosystemSources,
  field,
  getProtocol,
  overviewModules,
  protocolFlow,
  scenarioModules,
  sourceIds,
  zhPage,
  enPage,
  type AgentProtocol,
} from "@/data/agentic-payments";
import { cn } from "@/lib/utils";

const BASE = "/agentic-payments";
const overviewTitles = [
  "From a sentence to a transaction",
  "How much autonomy does the agent have?",
  "Does the agent get my card?",
  "Which rail moves the money?",
  "Protocol is not product",
  "Why stablecoins still matter",
  "More autonomy, more ways to fail",
];
const overviewIds = [
  "stack",
  "autonomy",
  "fund-control",
  "rails",
  "protocol-vs-product",
  "stablecoin",
  "risks",
];
const overviewSources = [
  ["SRC-AP2-01", "SRC-AP2-02"],
  ["SRC-ACP-01", "SRC-META-01", "SRC-XAI-01", "SRC-AMP-01"],
  ["SRC-AP2-02", "SRC-ACP-03", "SRC-META-01", "SRC-XAI-01", "SRC-XMONEY-01"],
  ["SRC-X402-01", "SRC-MPP-01"],
  ["SRC-ACP-01", "SRC-A402-02"],
  ["SRC-X402-01", "SRC-MPP-01"],
  [],
];
const allSources = PACKAGE.sources.map((s) => s.source_id);
const supportedProtocols = AGENT_PROTOCOLS.filter((p) => p.id !== "a402");

export function AgenticPaymentsOverview() {
  const { t } = usePaymentText();
  const zh = zhPage("A", "B"),
    en = enPage("A", "B");
  return (
    <PaymentPage sources={allSources}>
      <PaymentHero
        title={t(field(en, "H1"), field(zh, "H1"))}
        lead={t(field(en, "Lead"), field(zh, "Lead"))}
      >
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={`${BASE}/protocols`}
            className="inline-flex min-h-11 items-center gap-3 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground"
          >
            {t("Understand the protocols", field(zh, "Primary CTA"))}
            <ArrowRight size={15} />
          </Link>
          <a
            href="#stablecoin"
            className="inline-flex min-h-11 items-center rounded-md border border-primary/40 px-5 text-sm font-semibold text-primary"
          >
            {t("Where do stablecoins fit?", field(zh, "Secondary CTA"))}
          </a>
        </div>
        <nav
          aria-label={t("On this page", "本页内容")}
          className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"
        >
          {overviewIds.map((id, i) => (
            <a key={id} href={`#${id}`} className="hover:text-primary">
              {t(
                overviewTitles[i],
                [
                  "交易链",
                  "自主程度",
                  "资金控制",
                  "支付轨道",
                  "分类",
                  "稳定币价值",
                  "风险",
                ][i],
              )}
            </a>
          ))}
        </nav>
      </PaymentHero>
      {overviewModules.map((module, i) => {
        const enBody = between(en, `## O${i + 1}｜`)
          .split(/\n## O\d/)[0]
          .split("\n")
          .slice(1)
          .join("\n");
        const zhBody =
          i === 0
            ? field(module, "Copy")
            : i === 4
              ? [
                  "Commerce protocols",
                  "Trust / authorization",
                  "Machine payment",
                  "Products",
                  "Rails",
                ]
                  .map(
                    (key, j) =>
                      `### ${["商业交互协议", "信任 / 授权", "机器支付", "产品", "支付轨道"][j]}\n${field(module, key)}`,
                  )
                  .join("\n\n")
              : i === 5
                ? `${field(module, "Four reasons")}\n\n${field(module, "Caveat")}`
                : i === 6
                  ? between(module, "**Title**")
                      .split("\n")
                      .slice(2)
                      .join("\n")
                      .split("**CTA**")[0]
                      .trim()
                  : between(module, "### ")
                      .split("**Visual**")[0]
                      .split("**Key line**")
                      .join("");
        return (
          <PaymentSection
            key={i}
            id={overviewIds[i]}
            kicker={`0${i + 1}`}
            title={t(overviewTitles[i], field(module, "Title"))}
          >
            <PaymentCopy
              en={enBody}
              zh={i > 0 && i < 4 ? `### ${zhBody}` : zhBody}
              className={cn(
                "max-w-4xl",
                i === 5 && "border-l-2 border-secondary pl-5",
              )}
            />
            <PaymentCitation ids={overviewSources[i]} />
            {i !== 5 && (
              <PaymentVisual
                id={`AGT-D0${i === 6 ? 6 : i + 1}`}
                label={t(overviewTitles[i], field(module, "Title"))}
              />
            )}
            {i === 0 && (
              <details className="mt-4 border-l-2 border-primary/30 pl-4">
                <summary className="cursor-pointer py-2 text-sm font-semibold text-primary">
                  {t("Expand the nine-layer research view", "展开九层研究视图")}
                </summary>
                <ol className="grid gap-x-8 gap-y-2 py-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    "User / Enterprise Intent",
                    "Product Surface / Agent",
                    "Service & Commerce Interaction",
                    "Agent Identity & Trust",
                    "Delegated Authorization",
                    "Payment Execution / Machine Payment",
                    "Payment Rail",
                    "Settlement",
                    "Receipt / Audit / Dispute",
                  ].map((s, j) => (
                    <li key={s}>
                      <span className="mr-2 font-mono text-primary">
                        {j + 1}
                      </span>
                      {t(
                        s,
                        [
                          "用户 / 企业意图",
                          "产品入口 / Agent",
                          "服务与商业交互",
                          "Agent 身份与信任",
                          "委托授权",
                          "支付执行 / 机器支付",
                          "支付轨道",
                          "结算",
                          "回执 / 审计 / 争议",
                        ][j],
                      )}
                    </li>
                  ))}
                </ol>
              </details>
            )}
            {i === 4 && (
              <PageLink
                href={`${BASE}/protocols`}
                en="Explore protocols & mechanisms"
                zh="查看协议与机制"
              />
            )}
            {i === 6 && (
              <PageLink
                href={`${BASE}/scenarios`}
                en="Explore scenarios & risks"
                zh="查看应用与风险"
              />
            )}
          </PaymentSection>
        );
      })}
    </PaymentPage>
  );
}

function PageLink({ href, en, zh }: { href: string; en: string; zh: string }) {
  const { t } = usePaymentText();
  return (
    <Link
      href={href}
      className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline"
    >
      {t(en, zh)}
      <ArrowRight size={14} />
    </Link>
  );
}
const layerOf = (p: AgentProtocol) =>
  p.main_layer === "Commerce"
    ? "commerce"
    : p.main_layer === "Machine Payment"
      ? "machine"
      : "trust";

function ProtocolFacts({
  protocol: p,
  controlOnly = false,
}: {
  protocol: AgentProtocol;
  controlOnly?: boolean;
}) {
  const { t, value } = usePaymentText();
  const fields: [string, string, string][] = [
    ["Organization", "机构", p.org],
    ["Main layer", "主要层级", p.main_layer],
    ["User-confirmed purchase", "用户逐笔确认", p.human_confirmed],
    ["Delegated purchase", "委托购买", p.delegated],
    ["Machine payment", "机器支付", p.machine_payment],
    ["Agent identity", "Agent 身份", p.agent_identity],
    ["Payment rails", "支付轨道", p.rails],
    ["Stablecoin relationship", "稳定币关联", p.stablecoin],
    ["Maturity", "当前阶段", p.maturity],
  ];
  return (
    <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
      {fields
        .filter((_, i) => !controlOnly || (i >= 2 && i <= 5))
        .map(([en, zh, val]) => (
          <div key={en}>
            <dt className="mb-1 text-xs text-muted-foreground">{t(en, zh)}</dt>
            <dd className="leading-6">{value(val)}</dd>
          </div>
        ))}
    </dl>
  );
}

export function AgenticProtocolsPage() {
  const { t, value } = usePaymentText();
  const [layer, setLayer] = useState("all"),
    [matrix, setMatrix] = useState("control");
  const list = AGENT_PROTOCOLS.filter(
    (p) => layer === "all" || layerOf(p) === layer,
  );
  const zh = zhPage("B", "C"),
    en = enPage("B", "C");
  return (
    <PaymentPage sources={allSources}>
      <PaymentHero
        title={t(field(en, "H1"), field(zh, "H1"))}
        lead={t(field(en, "Lead"), field(zh, "Lead"))}
      />
      <PaymentSection
        id="layer-map"
        title={t("Read the transaction stack by layer", "按层理解交易栈")}
      >
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ["commerce", "Commerce", "商业交互"],
            ["trust", "Trust & authorization", "信任与授权"],
            ["machine", "Machine-native payment", "机器原生支付"],
          ].map(([id, en, zh], i) => (
            <div key={id} className="border-l-2 border-primary/40 pl-5">
              <p className="font-mono text-xs text-primary">0{i + 1}</p>
              <h3 className="my-3 font-semibold">{t(en, zh)}</h3>
              <div className="flex flex-wrap gap-3">
                {AGENT_PROTOCOLS.filter((p) => layerOf(p) === id).map((p) => (
                  <Link
                    key={p.id}
                    href={p.detail_route}
                    className="text-sm text-primary underline underline-offset-4"
                  >
                    {t(p.name, p.name)}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "One transaction can use multiple layers: UCP for checkout, AP2 for delegated authority, and cards or stablecoins for payment.",
            "同一笔交易可以同时使用多个层：例如 UCP 负责 checkout，AP2 提供委托授权，下层支付使用银行卡或稳定币。",
          )}
          <PaymentCitation ids={["SRC-UCP-01", "SRC-AP2-01"]} />
        </p>
        <PaymentVisual
          id="AGT-D05"
          label={t(
            "Protocol vs product vs infrastructure",
            "协议、产品与基础设施的区别",
          )}
        />
        <details className="mt-4 border-l border-primary/30 pl-4">
          <summary className="cursor-pointer py-2 text-sm font-semibold text-primary">
            {t("View the transaction stack", "查看完整交易栈")}
          </summary>
          <PaymentVisual
            id="AGT-D01"
            label={t("Agentic payment stack", "智能体支付交易栈")}
          />
        </details>
      </PaymentSection>
      <PaymentSection
        id="matrix"
        title={t(
          "Compare mechanisms, not brand rankings",
          "比较机制，而不是品牌排名",
        )}
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <label className="text-sm">
            {t("Layer", "层级")}
            <select
              value={layer}
              onChange={(e) => setLayer(e.target.value)}
              className="ml-3 rounded border border-input bg-background p-2"
            >
              <option value="all">{t("All", "全部")}</option>
              <option value="commerce">{t("Commerce", "商业交互")}</option>
              <option value="trust">
                {t("Trust & authorization", "信任与授权")}
              </option>
              <option value="machine">
                {t("Machine payment", "机器支付")}
              </option>
            </select>
          </label>
          <div
            className="hidden gap-4 text-sm md:flex"
            role="group"
            aria-label={t("Comparison dimensions", "比较维度")}
          >
            {[
              ["control", "Authority", "授权能力"],
              ["rails", "Rails & evidence", "轨道与进展"],
            ].map(([id, en, zh]) => (
              <button
                key={id}
                aria-pressed={matrix === id}
                onClick={() => setMatrix(id)}
                className={cn(
                  "border-b-2 py-2",
                  matrix === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground",
                )}
              >
                {t(en, zh)}
              </button>
            ))}
          </div>
        </div>
        <div className="hidden overflow-x-auto rounded-md border border-border md:block">
          <table className="w-full min-w-[850px] text-left text-sm">
            <caption className="sr-only">
              {t(
                "Frozen protocol comparison; implementation-dependent values are not blanket capabilities.",
                "协议比较；取决于实现的能力不代表所有产品都具备。",
              )}
            </caption>
            <thead className="bg-primary/5">
              <tr>
                {(matrix === "control"
                  ? [
                      ["Protocol / type", "协议 / 类型"],
                      ["Organization / layer", "机构 / 层级"],
                      ["User-confirmed", "逐笔确认"],
                      ["Delegated", "委托购买"],
                      ["Machine payment", "机器支付"],
                      ["Agent identity", "Agent 身份"],
                    ]
                  : [
                      ["Protocol / type", "协议 / 类型"],
                      ["Organization / layer", "机构 / 层级"],
                      ["Payment rails", "支付轨道"],
                      ["Stablecoin relation", "稳定币关联"],
                      ["Maturity", "当前阶段"],
                    ]
                ).map(([en, zh]) => (
                  <th key={en} scope="col" className="p-4 font-semibold">
                    {t(en, zh)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((p) => (
                <tr key={p.id} className="align-top">
                  <th scope="row" className="p-4 font-normal">
                    <Link
                      href={p.detail_route}
                      className="font-semibold text-primary hover:underline"
                    >
                      {t(p.name, p.name)}
                    </Link>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {value(p.artifact_type)}
                    </p>
                    <PaymentCitation ids={sourceIds(p.source_ids)} />
                  </th>
                  <td className="max-w-56 p-4">
                    {t(p.org, p.org)}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {value(p.main_layer)}
                    </p>
                  </td>
                  {(matrix === "control"
                    ? [
                        p.human_confirmed,
                        p.delegated,
                        p.machine_payment,
                        p.agent_identity,
                      ]
                    : [p.rails, p.stablecoin, p.maturity]
                  ).map((s, i) => (
                    <td key={i} className="max-w-60 p-4 leading-6">
                      {value(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 divide-y divide-border border-y border-border">
          {list.map((p) => (
            <details key={p.id} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span>
                  <span className="font-semibold text-primary">
                    {t(p.name, p.name)}
                  </span>
                  <span className="ml-3 text-xs text-muted-foreground">
                    {value(p.artifact_type)}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {t(p.one_line_en, p.one_line_zh)}
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  className="shrink-0 transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="mt-5 border-l border-primary/30 pl-4">
                <ProtocolFacts protocol={p} />
                <p className="mt-4 text-xs text-muted-foreground">
                  {t("Last verified", "最近核查")} {p.last_verified}
                  <PaymentCitation ids={sourceIds(p.source_ids)} />
                </p>
                <PageLink
                  href={p.detail_route}
                  en={
                    p.id === "a402"
                      ? "See the documented A402 flow"
                      : "Open protocol detail"
                  }
                  zh={p.id === "a402" ? "查看 A402 文档流程" : "打开协议详情"}
                />
              </div>
            </details>
          ))}
        </div>
      </PaymentSection>
      <LabelGuide />
      <PaymentSection
        title={t("Explore a specific mechanism", "深入了解具体机制")}
      >
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {supportedProtocols.map((p) => (
            <PageLink
              key={p.id}
              href={p.detail_route}
              en={p.name}
              zh={p.name}
            />
          ))}
        </div>
      </PaymentSection>
    </PaymentPage>
  );
}

function LabelGuide() {
  const { t } = usePaymentText();
  return (
    <PaymentSection title={t("Read the evidence labels", "如何理解证据标签")}>
      <dl className="grid gap-x-10 gap-y-5 text-sm sm:grid-cols-2">
        {[
          [
            "PROTOCOL",
            "Public technical specification or framework.",
            "公开技术规范或框架。",
          ],
          [
            "PRODUCT",
            "An actual user- or merchant-facing product.",
            "面向用户或商户的实际产品。",
          ],
          [
            "PRODUCTION VALIDATION",
            "Validation on a production system; not general availability.",
            "真实生产系统验证，不等于全面开放。",
          ],
          [
            "PILOT / ROLLOUT",
            "Limited institutions, selected partners or phased release.",
            "部分机构、白名单或分阶段推广。",
          ],
          [
            "PARTNERSHIP",
            "An announcement, not completed interoperability.",
            "合作公告，不等于已完成互操作。",
          ],
          [
            "UNKNOWN",
            "Insufficient first-party evidence; do not infer absence or support.",
            "官方证据不足，不能推断不存在，也不能推断已支持。",
          ],
        ].map(([name, en, zh]) => (
          <div key={name} className="border-l border-border pl-4">
            <dt className="mb-1 font-mono text-xs font-semibold text-primary">
              {t(name, name)}
            </dt>
            <dd className="leading-7 text-muted-foreground">{t(en, zh)}</dd>
          </div>
        ))}
      </dl>
    </PaymentSection>
  );
}

const scenarioTitles = [
  ["AI shopping", "AI 替人购物"],
  ["Conditional purchase", "满足条件自动购买"],
  ["Pay-per-call APIs", "AI 调 API 按次付款"],
  ["Agent-to-Agent", "Agent-to-Agent"],
];
const scenarioSources = [
  ["SRC-ACP-01", "SRC-META-01", "SRC-XAI-01"],
  ["SRC-AP2-02", "SRC-AMP-01", "SRC-ANTOM-01"],
  ["SRC-X402-01", "SRC-MPP-01", "SRC-A402-02"],
  ["SRC-AMP-01", "SRC-MPP-01"],
];
const scenarioEN = [
  [
    "“Find running shoes under $100; ask me before paying.”",
    "UCP / ACP + user confirmation + card/wallet rails.",
    "Wrong goods or prices, hidden costs, credential exposure, merchant fulfillment.",
    "ChatGPT Instant Checkout; Meta Muse + Link; Grok Bot purchase approval.",
  ],
  [
    "“Before Friday, automatically buy a flight if the total is under ¥800.”",
    "AP2 / AMP / APOP / Antom conditional purchase.",
    "Over-broad authority, duplicate execution, misunderstood price conditions, delayed revocation.",
    "",
  ],
  [
    "A research agent needs one real-time data query priced at ¥0.01 / $0.01.",
    "x402 / MPP / Alipay Machine Pay (A402).",
    "Small but repeated losses, malicious APIs, duplicate requests, irreversible payment, non-delivery.",
    "",
  ],
  [
    "A lead agent buys translation, search, inference or data from other agents.",
    "AMP discloses nano-grade A2A settlement; x402 and MPP fit machine payments. The settlement asset and degree of autonomy must be verified for the implementation.",
    "",
    "",
  ],
];
export function AgenticScenariosPage() {
  const { t } = usePaymentText();
  const en = enPage("C", "D");
  return (
    <PaymentPage sources={scenarioSources.flat()}>
      <PaymentHero
        title={t(
          "AI shopping, API payments and Agent-to-Agent raise different financial questions.",
          field(zhPage("C", "D"), "H1"),
        )}
      />
      <nav
        className="mb-8 flex flex-wrap gap-5 text-sm text-primary"
        aria-label={t("Choose a scenario", "选择应用场景")}
      >
        {scenarioTitles.map(([en, zh], i) => (
          <a
            key={en}
            href={`#${["shopping", "conditional", "api-pay", "agent-to-agent"][i]}`}
            className="underline underline-offset-4"
          >
            {t(en, zh)}
          </a>
        ))}
      </nav>
      {scenarioModules.map((s, i) => (
        <PaymentSection
          key={i}
          id={["shopping", "conditional", "api-pay", "agent-to-agent"][i]}
          kicker={`0${i + 1}`}
          title={t(...(scenarioTitles[i] as [string, string]))}
        >
          <p className="max-w-3xl border-l-2 border-primary pl-5 text-lg font-medium leading-8">
            {t(scenarioEN[i][0], field(s, "Example"))}
          </p>
          <FlowLine
            flow={t(
              between(
                en,
                `## ${["AI shopping", "Conditional purchase", "Pay-per-call API", "Agent-to-Agent"][i]}\n`,
              )
                .split("\n")[0]
                .replace(/  $/, ""),
              field(s, "Flow"),
            )}
          />
          <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_1fr]">
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                {t(
                  i === 3 ? "Evidence boundary" : "Best-fit mechanisms",
                  i === 3 ? "证据边界" : "适用机制",
                )}
              </h3>
              <PaymentCopy
                en={scenarioEN[i][1]}
                zh={field(
                  s,
                  i === 3 ? "Evidence boundary" : "Best-fit mechanisms",
                )}
              />
              <PaymentCitation ids={scenarioSources[i]} />
              {field(s, "Real examples") && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t(scenarioEN[i][3], field(s, "Real examples"))}
                </p>
              )}
            </div>
            {field(s, "Main risks") && (
              <div className="border-l border-border pl-5">
                <h3 className="mb-2 text-sm font-semibold">
                  {t("Main risks", "主要风险")}
                </h3>
                <PaymentCopy
                  en={scenarioEN[i][2]}
                  zh={field(s, "Main risks")}
                />
              </div>
            )}
          </div>
          {i === 2 && <A402Flow />}
        </PaymentSection>
      ))}
      <RiskChain />
    </PaymentPage>
  );
}
function FlowLine({ flow }: { flow: string }) {
  const { t } = usePaymentText();
  return (
    <ol
      aria-label={t("Mechanism flow", "机制流程")}
      className="my-6 grid gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap"
    >
      {flow
        .split(/\s*→\s*/)
        .filter(Boolean)
        .map((s, i) => (
          <li
            key={i}
            className="flex min-w-0 items-start gap-3 rounded border border-border bg-primary/[.025] px-4 py-3 text-sm leading-6 xl:flex-1 xl:basis-40"
          >
            <span className="font-mono text-xs text-primary">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{s}</span>
          </li>
        ))}
    </ol>
  );
}
function A402Flow() {
  const { t } = usePaymentText();
  return (
    <details className="mt-6 border-y border-border py-4">
      <summary className="cursor-pointer font-semibold text-primary">
        {t(
          "A402 / Machine Pay · documented flow",
          "A402 / Machine Pay · 已有文档的支付流程",
        )}
      </summary>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        {t(
          "Machine Pay is a PRODUCT. A402 is a PAYMENT_METHOD_SPEC / PRODUCT-EMBEDDED, not a confirmed independent vendor-neutral standard.",
          "Machine Pay 属于 PRODUCT（产品）。A402 属于 PAYMENT_METHOD_SPEC / PRODUCT-EMBEDDED（产品内支付方法规范），尚不认定为独立、中立开放标准。",
        )}
        <PaymentCitation ids={["SRC-A402-01", "SRC-A402-02"]} />
      </p>
      <FlowLine
        flow={t(
          "Agent requests resource → HTTP 402 + Payment-Needed → user authorization / Alipay payment → receive payment proof → retry with Payment-Proof → merchant verifies → resource + fulfillment receipt",
          "Agent 请求付费资源 → HTTP 402 + Payment-Needed → 用户授权 / 支付宝支付 → 获取支付凭证 → 再次请求并携带 Payment-Proof → 商户验证 → 返回资源与履约回执",
        )}
      />
      <p className="text-sm text-muted-foreground">
        {t(
          "No verified direct stablecoin link.",
          "尚无已核实的稳定币直接关联。",
        )}
      </p>
    </details>
  );
}

const riskRows = [
  ["Intent", "用户意图", "Ambiguity / hidden constraints", "歧义 / 隐藏条件"],
  [
    "Agent",
    "Agent",
    "Hallucination / prompt injection / spoofing",
    "幻觉 / 提示注入 / 身份冒充",
  ],
  [
    "Authorization",
    "授权",
    "Over-delegation / replay / stale consent",
    "过度授权 / 重放 / 失效同意",
  ],
  [
    "Credential",
    "凭证",
    "Card / token / key theft",
    "银行卡 / Token / 密钥失窃",
  ],
  [
    "Merchant / service",
    "商户 / 服务",
    "Fraud / non-delivery / fake API",
    "欺诈 / 不履约 / 虚假 API",
  ],
  ["Payment", "支付", "Duplicate charge / wrong amount", "重复扣款 / 金额错误"],
  [
    "Settlement",
    "结算",
    "Depeg / smart-contract risk / irreversibility",
    "脱锚 / 智能合约风险 / 不可逆",
  ],
  ["Dispute", "争议", "Unclear evidence / liability", "证据 / 责任不清"],
];
const riskControls = [
  ["Structured intent", "结构化意图"],
  ["KYA · secure runtime", "KYA · 安全运行环境"],
  ["Mandate · limits / revoke", "授权 · 限额 / 撤销"],
  ["Scoped token · secure vault", "受限凭证 · 安全凭证存储"],
  ["Identity · reputation", "身份 · 信誉"],
  ["Idempotency · monitoring", "幂等控制 · 监控"],
  ["Rail policy · escrow", "支付轨道策略 · 托管"],
  ["Receipt · audit trail", "回执 · 审计记录"],
];
function RiskChain() {
  const { t } = usePaymentText();
  return (
    <PaymentSection
      id="risk-chain"
      title={t("Follow the risk through the transaction", "沿交易链查看风险")}
    >
      <PaymentVisual
        id="AGT-D06"
        label={t("Agentic payment risk chain", "智能体支付风险链")}
      />
      <div className="mt-5 grid gap-x-8 md:grid-cols-2">
        {riskRows.map(([en, zh, riskEn, riskZh], i) => (
          <details key={en} className="border-b border-border py-4">
            <summary className="cursor-pointer text-sm font-semibold">
              {t(en, zh)}
              <span className="ml-3 font-normal text-muted-foreground">
                {t(riskEn, riskZh)}
              </span>
            </summary>
            <dl className="mt-4 space-y-3 pl-4 text-sm leading-7">
              <div>
                <dt className="font-semibold">
                  {t("What can go wrong", "可能出现的问题")}
                </dt>
                <dd className="text-muted-foreground">{t(riskEn, riskZh)}</dd>
              </div>
              <div>
                <dt className="font-semibold">
                  {t(
                    "Controls shown in the mechanism diagram",
                    "机制图列出的控制措施",
                  )}
                </dt>
                <dd className="text-muted-foreground">
                  {t(riskControls[i][0], riskControls[i][1])}
                  <span className="mt-1 block text-xs">
                    {t(
                      "Shown in the mechanism diagram; availability depends on the implementation.",
                      "图示控制措施；具体实现是否提供，需分别核实。",
                    )}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-semibold">
                  {t(
                    "Residual risk / quantified effectiveness",
                    "剩余风险 / 控制效果",
                  )}
                </dt>
                <dd className="text-muted-foreground">
                  {t(
                    "UNKNOWN · not quantified in the approved material.",
                    "UNKNOWN · 已批准资料未量化。",
                  )}
                </dd>
              </div>
            </dl>
          </details>
        ))}
      </div>
    </PaymentSection>
  );
}

const ecosystemZH: Record<string, [string, string, string, string]> = {
  google: [
    "标准制定者 + AI / 商业入口",
    "支付方式中立；接入现有支付方式",
    "AP2 可兼容；UCP 间接关联",
    "协议 + 生态",
  ],
  "openai-stripe": [
    "AI 入口 + 商业集成 + 支付基础设施",
    "商户支付服务商；Stripe Shared Payment Tokens；稳定币 / 银行卡支持因协议而异",
    "MPP 直接关联；ACP 间接关联",
    "生产产品 + 开放规范",
  ],
  x402: [
    "互联网原生机器支付标准",
    "HTTP 原生支付协调",
    "直接关联紧密",
    "中立开放治理",
  ],
  alipay: [
    "消费者钱包 + AI 商业 + 商户支付",
    "支付宝收单 / 风控 / 账户基础设施",
    "尚无已核实的直接关联",
    "生产产品生态",
  ],
  "ant-international": [
    "钱包 / 替代支付方式互联 + 全球商户支付基础设施",
    "Alipay+ 钱包 / 替代支付方式；WhaleRTP 批发结算",
    "AMP 结算资产 UNKNOWN；WhaleRTP 代币化存款不等于稳定币",
    "第一阶段推广 + 产品",
  ],
  unionpay: [
    "卡组织信任、身份与授权框架",
    "银联卡 / 银行网络",
    "尚无已核实的直接关联",
    "生产系统验证 + 推广",
  ],
  jd: [
    "电商 + 自有支付 + 企业智能体",
    "JD Pay：银行卡、京东余额、白条、银行 / 二维码轨道",
    "尚无已核实的直接关联",
    "生产产品",
  ],
  meta: [
    "个人 / 商户智能体 + 安全凭证集成",
    "Stripe Link 一次性卡；UPI；已宣布 Shop Pay",
    "尚无已核实的直接关联",
    "产品推广",
  ],
  "x-xai": [
    "智能体 + 平台金融账户",
    "Cross River 储值账户；Visa X Card；ACH；Stripe Link",
    "尚无已核实的直接关联",
    "特定用户 / 产品推广；智能体支付能力",
  ],
};
const timelineZH = [
  "x402 发布",
  "Antom Agentic Payment Solution",
  "Google AP2 公布",
  "ACP + ChatGPT Instant Checkout",
  "京东AI购用户协议",
  "x402 V2",
  "UCP 公布",
  "ACT 发布",
  "MPP 公布",
  "APOP 发布 + 5 笔生产系统验证交易",
  "AMP 发布",
  "支付宝 AI Wallet / AI Pay 规模披露",
  "中国网信部门智能体治理指引",
  "Meta Business Agent 扩展",
  "x402 Foundation 开始运营",
  "中国智能体支付自律公约",
  "Grok Bot 通过 Stripe Link 进行购买确认",
  "Meta Muse 发布",
  "AMP 第一阶段推广 / KYA 互操作工作",
  "Grok Bot 可使用 X Money 或 Stripe Link 付款",
];
const eventLabels: Record<string, [string, string]> = {
  protocol_release: ["Protocol release", "协议发布"],
  protocol_and_product: ["Protocol + product", "协议 + 产品"],
  protocol_evolution: ["Protocol evolution", "协议演进"],
  product_launch: ["Product launch", "产品发布"],
  product_evidence: ["Product evidence", "产品证据"],
  product_scale: ["Product disclosure", "产品披露"],
  product_capability: ["Product capability", "产品能力"],
  production_validation: ["Production validation", "生产系统验证"],
  rollout: ["Rollout", "分阶段推广"],
  governance: ["Governance", "治理"],
  regulation: ["Regulation", "监管"],
  industry_rule: ["Industry rule", "行业规则"],
};
function Timeline({ sources }: { sources?: string[] }) {
  const { t } = usePaymentText();
  const [filter, setFilter] = useState("all");
  const events = PACKAGE.timeline.filter(
    (e) =>
      (!sources || sources.includes(e.source_id)) &&
      (filter === "all" || e.type === filter),
  );
  return (
    <div>
      {!sources && (
        <label className="mb-6 block text-sm">
          {t("Event type", "事件类型")}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="ml-3 max-w-full rounded border border-input bg-background p-2"
          >
            <option value="all">{t("All events", "全部事件")}</option>
            {Object.entries(eventLabels).map(([key, labels]) => (
              <option key={key} value={key}>
                {t(...labels)}
              </option>
            ))}
          </select>
        </label>
      )}
      <ol className="ml-2 border-l border-border">
        {events.map((e) => {
          const index = PACKAGE.timeline.indexOf(e),
            labels = eventLabels[e.type];
          return (
            <li key={`${e.date}-${e.title}`} className="relative pb-6 pl-6">
              <span
                className={cn(
                  "absolute -left-[5px] top-1 h-2 w-2 rounded-full",
                  e.type.startsWith("protocol")
                    ? "bg-primary"
                    : e.type === "production_validation" ||
                        e.type === "governance"
                      ? "bg-secondary"
                      : "bg-muted-foreground",
                )}
              />
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <time dateTime={e.date}>{e.date}</time>
                <span className="text-primary">{t(...labels)}</span>
              </div>
              <p className="mt-2 text-sm font-semibold leading-6">
                {t(e.title, timelineZH[index])}
                <PaymentCitation ids={e.source_id ? [e.source_id] : []} />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(e.org, e.org)}
                {!e.source_id && (
                  <span className="ml-3">
                    {t(
                      "UNKNOWN · source link pending",
                      "UNKNOWN · 来源链接待核验",
                    )}
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function AgenticEcosystemPage() {
  const { t } = usePaymentText();
  const zh = zhPage("D", "E"),
    en = enPage("D", "E");
  return (
    <PaymentPage sources={allSources}>
      <PaymentHero
        title={t(field(en, "H1"), field(zh, "H1"))}
        lead={t(
          "One organization can define a protocol, own an AI surface, provide payments, or operate settlement infrastructure. Follow the role and evidence, not brand popularity.",
          field(zh, "Lead"),
        )}
      />
      <PaymentSection
        id="role-groups"
        title={t(
          "Different roles in the same transaction",
          "同一笔交易中的不同角色",
        )}
      >
        <div className="grid gap-6 md:grid-cols-3">
          {[
            [
              "Standards / protocols",
              "标准 / 协议",
              "Google · OpenAI/Stripe · x402 Foundation · Ant International · Alipay · China UnionPay",
            ],
            [
              "AI / commerce surfaces",
              "AI / 商业入口",
              "ChatGPT · Gemini · Muse · Grok Bot · 京东AI购 · 支付宝/千问生态",
            ],
            [
              "Payment infrastructure",
              "支付基础设施",
              "Stripe · Visa · Mastercard · UnionPay · Alipay/Alipay+ · X Money · banks · stablecoin rails",
            ],
          ].map(([en, zh, body]) => (
            <div key={en} className="border-l-2 border-primary/40 pl-5">
              <h3 className="mb-3 font-semibold">{t(en, zh)}</h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {t(body, body)}
              </p>
            </div>
          ))}
        </div>
        <details className="mt-5 border-l border-primary/30 pl-4">
          <summary className="cursor-pointer py-2 text-sm font-semibold text-primary">
            {t(
              "View protocol / product / infrastructure roles",
              "查看协议 / 产品 / 基础设施分层图",
            )}
          </summary>
          <PaymentVisual
            id="AGT-D05"
            label={t(
              "Protocol vs product vs infrastructure",
              "协议、产品与基础设施的区别",
            )}
          />
        </details>
      </PaymentSection>
      <PaymentSection
        id="ecosystem-cards"
        title={t(
          "Protocols, products and the account underneath",
          "协议、产品，以及背后的支付账户",
        )}
      >
        <div className="divide-y divide-border border-y border-border">
          {ECOSYSTEM_ENTRIES.map((e) => {
            const zh = ecosystemZH[e.id];
            return (
              <details key={e.id} id={e.id} className="group scroll-mt-6 py-5">
                <summary className="grid cursor-pointer list-none items-start gap-3 sm:grid-cols-[minmax(180px,1fr)_2fr_auto]">
                  <span className="text-lg font-semibold text-primary">
                    {t(e.name, e.name)}
                  </span>
                  <span className="text-sm leading-7 text-muted-foreground">
                    {t(e.role, zh[0])}
                    <span className="mt-1 block text-xs">
                      {t(e.status, zh[3])} · {e.last_verified}
                    </span>
                  </span>
                  <ChevronDown
                    size={18}
                    className="mt-1 transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="mt-5 border-l-2 border-primary/20 pl-5 sm:ml-4">
                  <dl className="grid gap-x-10 gap-y-5 text-sm sm:grid-cols-2">
                    {[
                      [t("Role", "角色"), t(e.role, zh[0])],
                      [
                        t("Protocols / methods", "协议 / 方法"),
                        t(
                          e.protocols,
                          e.protocols ===
                            "No independent public agent-payment protocol found"
                            ? "未找到独立公开的智能体支付协议"
                            : e.protocols,
                        ),
                      ],
                      [
                        t("Products · PRODUCT", "产品 · PRODUCT"),
                        t(e.products, e.products),
                      ],
                      [
                        t("Infrastructure / rail", "基础设施 / 支付轨道"),
                        t(e.payment_infra, zh[1]),
                      ],
                      [
                        t("Stablecoin status", "稳定币状态"),
                        t(e.stablecoin, zh[2]),
                      ],
                      [t("Evidence status", "证据状态"), t(e.status, zh[3])],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <dt className="mb-1 text-xs text-muted-foreground">
                          {label}
                        </dt>
                        <dd className="leading-7">{val}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {t("Last verified", "最近核查")} {e.last_verified}
                    <PaymentCitation ids={ecosystemSources[e.id]} />
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-5">
                    {supportedProtocols
                      .filter((p) =>
                        ecosystemSources[e.id].some((s) =>
                          sourceIds(p.source_ids).includes(s),
                        ),
                      )
                      .map((p) => (
                        <PageLink
                          key={p.id}
                          href={p.detail_route}
                          en={p.name}
                          zh={p.name}
                        />
                      ))}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
        <div className="mt-6 border-l-2 border-secondary bg-secondary/[.035] px-5 py-4">
          <p className="text-sm font-semibold">
            {t("A real example: scoped credentials", "真实产品例子：受限凭证")}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {t(
              "Muse asks for purchase approval, uses Link checkout and a one-time-use card, and cannot see payment methods or passwords. An audit trail is retained.",
              "Muse 在购买前请求确认，使用 Link checkout 和一次性卡；Muse 无法看到支付方式与密码，并保留完整审计记录。",
            )}
            <PaymentCitation ids={["SRC-META-01"]} />
          </p>
        </div>
      </PaymentSection>
      <PaymentSection
        id="timeline"
        title={t(
          "2025–2026 · releases, validation and rollout",
          "2025–2026 · 发布、验证与推广",
        )}
      >
        <Timeline />
      </PaymentSection>
      <LabelGuide />
    </PaymentPage>
  );
}

// English translations of the Chinese detail fields, without adding research facts.
const detailEN: Record<string, Record<string, string>> = {
  ap2: {
    Problem:
      "Traditional payments assume the person clicking Pay is the user. When an agent acts, merchants and payment providers must prove what the user authorized.",
    "Core mechanism": "Mandate + verifiable evidence + receipt.",
    "Human Present":
      "The user confirms the final specific transaction through a trusted deterministic interface.",
    "Human Not Present":
      "The user sets amount, time and goods/services constraints in advance; the agent can only transact within them.",
    "Important control":
      "The Trusted Surface should be non-agentic / deterministic. An LLM cannot itself assert that the user consented.",
    Stablecoin:
      "Compatible, not native. AP2 is payment-agnostic and can combine with cards, bank transfers and stablecoins.",
  },
  ucp: {
    Problem:
      "Merchants have different APIs and checkout systems. Connecting every platform to every merchant creates N×M integration costs.",
    "Key rule":
      "Without the AP2 Mandates extension, checkout requires final user completion through a trusted deterministic UI.",
    "Merchant role": "The business remains Merchant of Record.",
  },
  acp: {
    Core: "Product feed → Checkout session → Merchant authoritative cart → Delegated Payment → Merchant processes payment and fulfillment.",
    "Payment control":
      "A one-time delegated payment request sets the maximum amount and expiry; the PSP returns a payment token.",
    "Merchant of Record": "The merchant, not OpenAI.",
  },
  x402: {
    "Best use":
      "APIs, data, inference, compute, digital content and Agent-to-Agent.",
    Evolution:
      "Stablecoin-native origins; V2 expanded to multiple assets and networks and broader payment types.",
    Governance:
      "In 2026, the x402 Foundation entered neutral governance under the Linux Foundation.",
  },
  mpp: {
    "One-line":
      "An open machine payment standard co-created by Stripe and Tempo, covering microtransactions, recurring payments and pay-per-use.",
    Flow: "Agent requests resource → service returns payment request → Agent authorizes → resource delivered.",
    Rails:
      "Stablecoin + cards + BNPL via Shared Payment Tokens / Stripe infrastructure.",
    "Real use":
      "Official examples include Browserbase, PostalForm, Prospect Butcher Co. and Stripe Climate.",
  },
  act: {
    "Evidence boundary":
      "A full public field-level specification remains insufficient. Do not map ACT fields one-to-one to AP2.",
    "Related products":
      "Agent Pay, Machine Pay and AI Wallet belong to the product layer.",
  },
  amp: {
    "Core principle": "Authorise the task, not hand over the account.",
    Trust: "KYA + Agent Trust Rating.",
    Use: "Digital wallets, smartphones, wearables and in-car use; publicly disclosed A2A nano-payments.",
    Stablecoin:
      "A2A nano-payment is verified; the specific settlement asset is not publicly confirmed: UNKNOWN.",
  },
  apop: {
    "Three trust questions": "Identity trust · intent trust · process trust.",
    "Four capabilities":
      "Agent identity management · intent management · user identity management · payment authorization management.",
    Evidence:
      "Five production-system validation transactions were completed at launch in April 2026; some functions remain in whitelist / validation stages.",
    Stablecoin:
      "No verified direct link. Public examples mainly use UnionPay cards, bank accounts and existing payment networks.",
  },
};
const fieldNames: Record<string, string> = {
  Problem: "解决什么问题",
  "Core mechanism": "核心机制",
  "Human Present": "用户在场",
  "Human Not Present": "用户不在场",
  "Important control": "关键控制",
  "Key rule": "关键规则",
  "Merchant role": "商户角色",
  Core: "核心流程",
  "Payment control": "支付控制",
  "Merchant of Record": "交易商户",
  "Best use": "适用场景",
  Evolution: "演变",
  Governance: "治理",
  Flow: "流程",
  Rails: "支付轨道",
  "Real use": "实际案例",
  "Evidence boundary": "证据边界",
  "Related products": "相关产品",
  "Core principle": "核心原则",
  Trust: "信任",
  Use: "应用",
  "Three trust questions": "三个信任问题",
  "Four capabilities": "四项能力",
  Evidence: "已披露证据",
  Stablecoin: "稳定币关系",
};
function DetailFields({ id, keys }: { id: string; keys: string[] }) {
  const { t } = usePaymentText();
  const copy = detailCopy(id);
  return (
    <div className="space-y-5">
      {keys
        .filter((key) => field(copy, key))
        .map((key) => (
          <div key={key}>
            <h3 className="mb-2 text-sm font-semibold">
              {t(key, fieldNames[key] ?? key)}
            </h3>
            <PaymentCopy
              en={detailEN[id]?.[key] ?? field(copy, key)}
              zh={field(copy, key)}
            />
          </div>
        ))}
    </div>
  );
}
export function AgenticProtocolDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const { t, value } = usePaymentText();
  const p = getProtocol(id);
  if (id === "a2p2") return <Redirect to={`${BASE}/protocols`} replace />;
  if (id === "a402")
    return <Redirect to={`${BASE}/scenarios#api-pay`} replace />;
  if (!p)
    return (
      <PaymentPage>
        <PaymentHero title={t("Mechanism not found", "未找到该机制")} />
        <PageLink
          href={`${BASE}/protocols`}
          en="Back to protocols"
          zh="返回协议与机制"
        />
      </PaymentPage>
    );
  const copy = detailCopy(id),
    sources = sourceIds(p.source_ids);
  const scenarioIndex = ["ucp", "acp"].includes(id)
    ? 0
    : ["x402", "mpp"].includes(id)
      ? 2
      : 1;
  return (
    <PaymentPage sources={sources}>
      <PaymentProtocolNav />
      <PaymentHero
        title={t(`${p.name}: ${p.one_line_en}`, field(copy, "H1"))}
        lead={t(
          detailEnglish(p.name),
          field(copy, "One-line") || p.one_line_zh,
        )}
      >
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span>{t(p.full_name, p.full_name)}</span>
          <span>{value(p.artifact_type)}</span>
          <span>{t(p.org, p.org)}</span>
          <span>
            {t("Last verified", "最近核查")} {p.last_verified}
          </span>
          <PaymentCitation ids={sources} />
        </div>
      </PaymentHero>
      <PaymentSection
        id="problem"
        title={t("What problem does it solve?", "它解决什么问题？")}
      >
        <PaymentCopy
          en={detailEN[id]?.Problem ?? p.one_line_en}
          zh={field(copy, "Problem") || p.one_line_zh}
        />
      </PaymentSection>
      <PaymentSection
        id="scenario"
        title={t("Typical scenario", "典型应用场景")}
      >
        <PaymentCopy
          en={scenarioEN[scenarioIndex][0]}
          zh={field(scenarioModules[scenarioIndex], "Example")}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          {t(
            "Illustrative task, not evidence of general availability.",
            "任务示意，不代表该协议相关产品已全面开放。",
          )}
        </p>
        <PageLink
          href={`${BASE}/scenarios#${["shopping", "conditional", "api-pay"][scenarioIndex]}`}
          en="Explore the scenario & risks"
          zh="查看场景与风险"
        />
      </PaymentSection>
      <PaymentSection id="mechanism" title={t("How it works", "如何运行")}>
        <FlowLine flow={t(protocolFlow(id), protocolFlow(id))} />
        <DetailFields
          id={id}
          keys={[
            "Core mechanism",
            "Core",
            "Flow",
            "Key rule",
            "Core principle",
            "Trust",
            "Three trust questions",
            "Four capabilities",
          ]}
        />
        <PaymentCitation ids={sources} />
      </PaymentSection>
      <PaymentSection
        id="actors"
        title={t("Actors & ecosystem", "参与方与生态")}
      >
        <p className="mb-5 text-sm text-muted-foreground">
          {t("Organization / ecosystem", "发起机构 / 生态")} · {t(p.org, p.org)}
        </p>
        <p className="text-sm leading-7 text-muted-foreground">
          {t(
            "The mechanism above identifies the user, agent, merchant/service and relevant payment participants; product and infrastructure providers are distinct from the protocol.",
            "上方机制流程标明用户、Agent、商户 / 服务及相关支付参与方；产品和基础设施提供者与协议本身需区分。",
          )}
        </p>
        <DetailFields id={id} keys={["Merchant role", "Merchant of Record"]} />
        <PaymentCitation ids={sources} />
      </PaymentSection>
      <PaymentSection
        id="authorization"
        title={t("Authorization & fund control", "授权与资金控制")}
      >
        <ProtocolFacts protocol={p} controlOnly />
        <div className="mt-6">
          <DetailFields
            id={id}
            keys={[
              "Human Present",
              "Human Not Present",
              "Important control",
              "Payment control",
            ]}
          />
        </div>
        <PaymentCitation ids={sources} />
      </PaymentSection>
      <PaymentSection id="rails" title={t("Payment rail", "支付轨道")}>
        <div className="border-l-2 border-primary/40 pl-5">
          <p className="mb-2 text-xs font-semibold text-primary">
            {t("PAYMENT RAIL", "支付轨道")}
          </p>
          <p className="text-base leading-8">{value(p.rails)}</p>
        </div>
        <PaymentCitation ids={sources} />
      </PaymentSection>
      <PaymentSection
        id="stablecoin"
        title={t("Stablecoin relationship", "与稳定币的关系")}
      >
        <div className="border-l-2 border-secondary/60 pl-5">
          <p className="mb-2 text-xs font-semibold text-secondary">
            {t("STABLECOIN RELATION", "稳定币关系")}
          </p>
          <p className="text-base leading-8">{value(p.stablecoin)}</p>
        </div>
        <div className="mt-5">
          <DetailFields
            id={id}
            keys={detailEN[id]?.Stablecoin ? ["Stablecoin"] : []}
          />
        </div>
        <PaymentCitation ids={sources} />
      </PaymentSection>
      <PaymentSection
        id="maturity"
        title={t("Evidence, maturity & evolution", "证据、阶段与演变")}
      >
        <p className="mb-5 border-l-2 border-primary bg-primary/5 px-5 py-4 text-sm font-semibold leading-7">
          {value(p.maturity)}
          <PaymentCitation ids={sources} />
        </p>
        <DetailFields
          id={id}
          keys={[
            "Best use",
            "Evolution",
            "Governance",
            "Real use",
            "Use",
            "Evidence",
            "Related products",
          ]}
        />
        <div className="mt-6">
          <Timeline sources={sources} />
        </div>
      </PaymentSection>
      <PaymentSection
        id="unknowns"
        title={t("Risks & unknowns", "风险与未知项")}
      >
        <DetailFields id={id} keys={["Evidence boundary"]} />
        {id === "amp" && (
          <p className="mb-4 text-sm leading-7">
            {t(
              "UNKNOWN · The settlement asset for A2A nano-payment is not publicly confirmed.",
              "UNKNOWN · A2A 极小额支付的结算资产尚未公开确认。",
            )}
          </p>
        )}
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {t(
            "Protocol-specific quantified residual risk: UNKNOWN. The transaction-wide risk chain covers intent, agent, authorization, credentials, merchant, payment, settlement and disputes.",
            "协议级量化剩余风险：UNKNOWN。通用交易风险链涵盖意图、Agent、授权、凭证、商户、支付、结算与争议。",
          )}
        </p>
        <PageLink
          href={`${BASE}/scenarios#risk-chain`}
          en="Read the risk chain"
          zh="查看交易风险链"
        />
      </PaymentSection>
      <PaymentSection id="sources" title={t("Official sources", "官方来源")}>
        <SourceList ids={sources} />
      </PaymentSection>
    </PaymentPage>
  );
}

export function AgenticLegacyProtocolRedirect() {
  const { id = "" } = useParams<{ id: string }>();
  return (
    <Redirect
      replace
      to={
        id === "a2p2"
          ? `${BASE}/protocols`
          : id === "a402"
            ? `${BASE}/scenarios#api-pay`
            : (getProtocol(id)?.detail_route ?? `${BASE}/protocols`)
      }
    />
  );
}
