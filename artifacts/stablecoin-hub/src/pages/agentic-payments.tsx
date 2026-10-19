import React, { useState } from "react";
import { Link, Redirect, useParams } from "wouter";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  ExternalLink,
  Search,
  ShieldCheck,
  Wallet,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PaymentCitation,
  PaymentFactText,
  PaymentFlow,
  PaymentPage,
  PaymentProtocolNav,
  PaymentQuestions,
  PaymentSection,
  usePaymentText,
} from "@/components/agentic-payment-ui";
import {
  AGENT_PROTOCOLS,
  ECOSYSTEM_ENTRIES,
  PAYMENT_LAYERS,
  PAYMENT_SCENARIOS,
  REVIEWED_AT,
  getProtocol,
  getSource,
  type AgentProtocol,
  type PaymentEvent,
  type PaymentLayer,
} from "@/data/agentic-payments-reconciled";
import { cn } from "@/lib/utils";

import { AgenticPaymentStack } from "@/components/agentic-payment-stack";
import {
  ProtocolEvidence,
  OverviewResearch,
  MachinePaymentNotes,
  EcosystemEvidence,
} from "@/components/agentic-evidence-notes";
import { PAYMENT_SOURCES } from "@/data/agentic-payments-reconciled";

const BASE = "/agentic-payments";
const protocolSources = (protocol: AgentProtocol) => [
  ...new Set([
    ...protocol.resources,
    ...protocol.controls.flatMap((f) => f.sources),
    ...protocol.history.flatMap((f) => f.sources),
    ...protocol.risks.flatMap((f) => f.sources),
  ]),
];
const allSources = [
  ...new Set(
    AGENT_PROTOCOLS.flatMap(protocolSources).concat(
      ECOSYSTEM_ENTRIES.map((e) => e.source),
      ["waller", "bis-money"],
      PAYMENT_SOURCES.map((s) => s.id),
    ),
  ),
];

function Relation({ protocol }: { protocol: AgentProtocol }) {
  const { t } = usePaymentText();
  const labels = {
    implementation: t(
      "Public stablecoin-related implementation",
      "有公开稳定币相关实现",
    ),
    extension: t("Specific payment integration matters", "须看具体付款接入"),
    unverified: t("Stablecoin path not verified", "未核实稳定币路径"),
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs font-medium",
        protocol.stablecoin.relation === "implementation"
          ? "text-secondary"
          : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          protocol.stablecoin.relation === "implementation"
            ? "bg-secondary"
            : "bg-muted-foreground/60",
        )}
      />
      {labels[protocol.stablecoin.relation]}
    </span>
  );
}

function Timeline({ events }: { events: PaymentEvent[] }) {
  const { local } = usePaymentText();
  return (
    <ol className="ml-2 border-l border-border">
      {events.map((item, index) => (
        <li
          key={`${item.date}-${item.title.en}-${index}`}
          className="relative pb-7 pl-6 last:pb-0"
        >
          <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-primary" />
          <p className="text-xs text-muted-foreground">
            <time dateTime={item.date}>{item.date}</time>
            <span className="ml-3 text-primary">{local(item.kind)}</span>
          </p>
          <h3 className="mt-2 text-base font-semibold leading-6">
            {local(item.title)}
          </h3>
          <PaymentFactText fact={item} className="mt-1 max-w-4xl" />
        </li>
      ))}
    </ol>
  );
}

function TaskExplorer({ detailed = false }: { detailed?: boolean }) {
  const { t, local } = usePaymentText();
  const [selected, setSelected] = useState(PAYMENT_SCENARIOS[0].id);
  const scenario = PAYMENT_SCENARIOS.find((s) => s.id === selected)!;
  return (
    <div>
      <div
        className="mb-6 flex min-w-0 gap-5 overflow-x-auto border-b border-border"
        aria-label={t("Choose a task", "选择用户任务")}
      >
        {PAYMENT_SCENARIOS.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={item.id === selected}
            onClick={() => setSelected(item.id)}
            className={cn(
              "shrink-0 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors",
              item.id === selected
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {local(item.title)}
          </button>
        ))}
      </div>
      <div className="grid gap-7 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="text-xs font-semibold tracking-wide text-primary">
            {local(scenario.eyebrow)}
          </p>
          <h3 className="mt-3 max-w-xl text-xl font-semibold leading-relaxed sm:text-2xl">
            “{local(scenario.task)}”
          </h3>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {local(scenario.control)}
          </p>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
            {scenario.protocols.map((id) => (
              <Link
                key={id}
                href={`${BASE}/protocols/${id}`}
                className="inline-flex min-h-8 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                {getProtocol(id)?.name}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/[0.035] p-5 sm:p-6">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Wallet className="h-4 w-4 text-primary" />
            {local(scenario.funding.title)}
          </h4>
          <PaymentFactText fact={scenario.funding} />
          <p className="mt-4 text-xs leading-6 text-muted-foreground">
            {t(
              "Select a step below to explore user actions and provider responsibilities.",
              "点击下方步骤，查看用户操作与服务方职责。",
            )}
          </p>
        </div>
      </div>
      <div className="mt-7">
        <PaymentFlow
          key={scenario.id}
          steps={scenario.steps}
          label={t(
            "Follow the task · select a step",
            "沿着任务看流程 · 点击步骤",
          )}
          conceptual
        />
      </div>
      {detailed && (
        <div className="mt-7">
          <PaymentQuestions questions={scenario.questions} />
        </div>
      )}
    </div>
  );
}

export function AgenticPaymentsOverview() {
  const { t, local } = usePaymentText();
  const [mode, setMode] = useState("confirm");
  const recent = AGENT_PROTOCOLS.flatMap((p) => p.history)
    .filter((event) => event.date !== REVIEWED_AT)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  return (
    <PaymentPage sources={allSources}>
      <header className="grid gap-8 pb-10 pt-2 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
        <div>
          <p className="mb-4 text-xs font-semibold tracking-[0.1em] text-primary">
            {t("STABLECOINS × AGENTIC PAYMENTS", "稳定币 × 智能体支付")}
          </p>
          <h1 className="max-w-3xl font-serif text-3xl font-bold leading-tight text-primary sm:text-4xl lg:text-5xl">
            {t(
              "When agents pay, how do you stay in control?",
              "智能体如何付款，用户如何保持控制？",
            )}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
            {t(
              "From your permission to a completed purchase: explore the protocols, the people responsible, and where stablecoins fit.",
              "从你的授权到一次购买完成：看懂协议如何运作、谁承担责任，以及稳定币在哪里参与。",
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <a href="#tasks">
                {t("Explore a task", "看看如何使用")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`${BASE}/protocols`}>
                {t("Protocols & mechanisms", "探索协议与机制")}
              </Link>
            </Button>
          </div>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-6 sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              {t("Three questions to ask first", "先看懂三个问题")}
            </span>
          </div>
          {[
            {
              title: t("Your permission", "你授权了什么"),
              body: t(
                "What it may buy, for whom, and within which limits.",
                "买什么、付给谁、允许花多少。",
              ),
            },
            {
              title: t("The money path", "钱从哪里来"),
              body: t(
                "Card, mobile wallet or a verified stablecoin implementation.",
                "卡、移动钱包，或已核实的稳定币实现。",
              ),
            },
            {
              title: t("The completed task", "任务是否完成"),
              body: t(
                "A payment receipt and a delivered service are different outcomes.",
                "付款回执与收到服务，是两个不同结果。",
              ),
            },
          ].map((item, i) => (
            <div
              key={item.title}
              className={cn(
                "flex gap-4",
                i > 0 && "mt-5 border-t border-primary/15 pt-5",
              )}
            >
              <span className="font-mono text-xs text-primary">0{i + 1}</span>
              <div>
                <h2 className="text-base font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </header>
      <AgenticPaymentStack />
      <PaymentSection
        id="tasks"
        kicker={t("START WITH YOUR TASK", "从你的任务出发")}
        title={t(
          "What would you ask an agent to do?",
          "你想让智能体帮你做什么？",
        )}
      >
        <TaskExplorer />
      </PaymentSection>
      <PaymentSection
        kicker={t("PERMISSION, NOT A BLANK CHEQUE", "授权，不是无限支出")}
        title={t(
          "Confirm every purchase—or agree the limits first",
          "每次确认，还是先约定条件？",
        )}
      >
        <div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
          <div className="flex flex-col gap-2">
            {[
              {
                id: "confirm",
                label: t("Confirm this purchase", "本次购买由我确认"),
              },
              {
                id: "delegate",
                label: t("Delegate within limits", "在限定条件内代我执行"),
              },
            ].map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={mode === item.id}
                onClick={() => setMode(item.id)}
                className={cn(
                  "rounded-md border px-5 py-4 text-left text-sm font-semibold transition-colors",
                  mode === item.id
                    ? "border-primary bg-primary/[0.07] text-primary"
                    : "border-border hover:border-primary/50",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div aria-live="polite" className="py-2">
            <h3 className="text-lg font-semibold">
              {mode === "confirm"
                ? t(
                    "Review the final offer before paying",
                    "付款前查看最终方案",
                  )
                : t("Be explicit about what is allowed", "明确允许它做什么")}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {mode === "confirm"
                ? t(
                    "You check the item and final price. The agent may prepare the order, but the service seeks confirmation before payment.",
                    "你核对商品及最终价格。智能体可以准备订单，但服务在付款前征求确认。",
                  )
                : t(
                    "Agree the task, amount and expiry first. What can be delegated—and how it is checked—depends on the protocol and actual service.",
                    "先约定任务、金额及有效期。能委托哪些操作、怎样检查，取决于协议及实际服务。",
                  )}
              <PaymentCitation ids={["ap2-spec", "ap2-mandate"]} />
            </p>
            <Link
              href={`${BASE}/protocols/ap2`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              {t("See AP2's authorization flow", "看 AP2 怎样表达授权")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </PaymentSection>
      <PaymentSection
        kicker={t("WHERE STABLECOINS FIT", "稳定币在哪里参与")}
        title={t(
          "An agent is not a wallet. A protocol is not a currency.",
          "智能体不是钱包，协议也不是货币。",
        )}
      >
        <p className="mb-6 max-w-3xl text-sm leading-7 text-muted-foreground">
          {t(
            "Separate the task, permission and funding. A stablecoin may carry the payment, but it does not by itself define what an agent is allowed to do.",
            "把任务、授权和资金分开看。稳定币可以承载付款，但它本身不会规定智能体被允许做什么。",
          )}
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {["x402", "ap2", "amp"].map((id) => {
            const p = getProtocol(id)!;
            return (
              <article key={id} className="border-t-2 border-primary/35 pt-5">
                <Relation protocol={p} />
                <h3 className="mt-3 text-lg font-semibold">
                  {p.name} · {local(p.stablecoin.title)}
                </h3>
                <PaymentFactText fact={p.stablecoin} className="mt-3" />
                <Link
                  href={`${BASE}/protocols/${id}`}
                  className="mt-4 inline-flex min-h-8 items-center gap-2 text-sm text-primary hover:underline"
                >
                  {t("Read the mechanism", "查看具体机制")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>
        <p className="mt-6 text-sm leading-7 text-muted-foreground">
          {t(
            "Asset stability, redemption and settlement remain separate questions—even if the agent's authorization is correct.",
            "即使智能体授权正确，资产稳定性、赎回和结算仍是需要单独考虑的问题。",
          )}
          <PaymentCitation ids={["bis-money"]} />
          <Link
            href="/market-data/issuers-reserves"
            className="ml-3 text-primary hover:underline"
          >
            {t("Issuers & reserves", "查看发行方与储备")} →
          </Link>
        </p>
      </PaymentSection>
      <OverviewResearch />
      <PaymentSection
        kicker={t("WHAT CHANGED", "发展与变化")}
        title={t(
          "Recent developments, with their evidence",
          "近期进展，看清证据到哪一步",
        )}
      >
        <Timeline events={recent} />
      </PaymentSection>
      <div className="grid gap-6 border-t border-border py-8 md:grid-cols-3">
        {[
          {
            href: "protocols",
            icon: BookOpen,
            title: t("Understand the mechanisms", "深入协议与机制"),
            body: t(
              "Flows, evolution and public specifications.",
              "流程、演变与公开规范。",
            ),
          },
          {
            href: "scenarios",
            icon: ShieldCheck,
            title: t("Explore applications & risks", "查看应用与风险"),
            body: t(
              "User control, delivery and failure handling.",
              "用户控制、交付与失败处理。",
            ),
          },
          {
            href: "ecosystem",
            icon: Building2,
            title: t("Meet the participants", "认识参与方"),
            body: t(
              "Who builds, verifies and provides payment services.",
              "谁建设、核验及提供付款服务。",
            ),
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={`${BASE}/${item.href}`}
            className="group block rounded-md bg-primary/[0.035] p-5 transition-colors hover:bg-primary/[0.08]"
          >
            <item.icon className="mb-4 h-5 w-5 text-primary" />
            <h2 className="flex items-center justify-between gap-2 text-base font-semibold">
              {item.title}
              <ArrowRight className="h-4 w-4 text-primary transition-transform motion-safe:group-hover:translate-x-1" />
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
          </Link>
        ))}
      </div>
    </PaymentPage>
  );
}

export function AgenticProtocolsPage() {
  const { t, local } = usePaymentText();
  const [query, setQuery] = useState("");
  const [layer, setLayer] = useState<PaymentLayer | "all">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const filtered = AGENT_PROTOCOLS.filter(
    (p) =>
      (layer === "all" || p.layers.includes(layer)) &&
      `${p.name} ${p.fullName} ${p.owner.en} ${p.owner.zh} ${p.purpose.en} ${p.purpose.zh} ${ECOSYSTEM_ENTRIES.filter(
        (e) => e.protocols.includes(p.id),
      )
        .map((e) => e.name)
        .join(" ")} ${p.id === "ap2" || p.id === "ucp" ? "谷歌" : ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const compared = AGENT_PROTOCOLS.filter((p) => selected.includes(p.id));
  return (
    <PaymentPage sources={allSources}>
      <PaymentProtocolNav />
      <header className="pb-8">
        <p className="mb-3 text-xs font-semibold tracking-wide text-primary">
          {t("READ THE MECHANISM", "看懂机制")}
        </p>
        <h1 className="font-serif text-3xl font-bold text-primary sm:text-4xl">
          {t("Protocols & mechanisms", "协议与机制")}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          {t(
            "Different protocols solve different parts of a purchase. Start with the problem, then explore user control, history and payment paths.",
            "不同协议解决购买过程中的不同问题。从用途出发，再深入用户控制、发展历程与资金路径。",
          )}
        </p>
      </header>
      <div className="mb-7 flex flex-wrap items-center gap-4 border-y border-border py-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t(
              "Search protocols or organizations",
              "搜索协议或机构",
            )}
            placeholder={t(
              "Search protocols or organizations",
              "搜索协议或机构",
            )}
            className="bg-transparent pl-9"
          />
        </div>
        <div
          className="flex flex-wrap gap-3"
          aria-label={t("Filter by function", "按功能筛选")}
        >
          {(["all", "commerce", "authorization", "settlement"] as const).map(
            (value) => (
              <button
                key={value}
                type="button"
                aria-pressed={layer === value}
                onClick={() => setLayer(value)}
                className={cn(
                  "border-b-2 px-1 py-2 text-xs font-medium",
                  layer === value
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-primary",
                )}
              >
                {value === "all"
                  ? t("All functions", "全部功能")
                  : local(PAYMENT_LAYERS[value])}
              </button>
            ),
          )}
        </div>
      </div>
      <div className="grid gap-x-8 gap-y-7 md:grid-cols-2">
        {filtered.map((p) => (
          <article
            key={p.id}
            className="min-w-0 rounded-lg border border-border bg-primary/[0.025] p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-primary">{p.name}</h2>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  {p.fullName}
                </p>
              </div>
              <label className="flex min-h-8 cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  aria-label={`${t("Compare", "比较")} ${p.name}`}
                  checked={selected.includes(p.id)}
                  disabled={!selected.includes(p.id) && selected.length >= 3}
                  onChange={(e) => {
                    setSelected((current) =>
                      e.target.checked
                        ? [...current, p.id]
                        : current.filter((id) => id !== p.id),
                    );
                    setShowCompare(false);
                  }}
                  className="h-4 w-4 accent-primary"
                />
                {t("Compare", "加入比较")}
              </label>
            </div>
            <p className="mt-4 text-base font-semibold leading-7">
              {local(p.purpose)}
              <PaymentCitation ids={[p.resources[0]]} />
            </p>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {local(p.owner)} · {local(p.kind)}
            </p>
            <div className="mt-5 border-t border-border pt-4">
              <Relation protocol={p} />
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {local(p.stage)}
              </p>
            </div>
            <Link
              href={`${BASE}/protocols/${p.id}`}
              className="mt-4 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              {t("User flow, history & evidence", "使用流程、历程与证据")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="py-8">
          <p className="text-sm text-muted-foreground">
            {t(
              "No matching protocols. Try another term or clear the filter.",
              "没有匹配的协议，可以更换关键词或清除筛选。",
            )}
          </p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => {
              setQuery("");
              setLayer("all");
            }}
          >
            {t("Clear filters", "清除筛选")}
          </Button>
        </div>
      )}
      <PaymentSection
        title={t("Compare a specific question", "围绕具体问题比较")}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {t(
              "Choose two or three protocols above. This is a mechanism comparison, not a product ranking.",
              "在上方选择两到三个协议，比较机制，不做产品排名。",
            )}
          </p>
          <Button
            disabled={compared.length < 2}
            onClick={() => setShowCompare(!showCompare)}
          >
            {showCompare
              ? t("Hide comparison", "收起比较")
              : t("Compare selected", "比较已选协议")}
            {selected.length > 0 ? ` (${selected.length})` : ""}
          </Button>
        </div>
        {showCompare && compared.length >= 2 && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {compared.map((p) => (
              <article
                key={p.id}
                className="border-l-2 border-primary bg-primary/[0.035] p-5"
              >
                <h3 className="mb-4 text-xl font-bold text-primary">
                  {p.name}
                </h3>
                {[
                  {
                    label: t("User authorization", "用户授权"),
                    value: p.authorization,
                  },
                  { label: t("Payment path", "付款路径"), value: p.rails },
                  {
                    label: t("Integration access", "接入条件"),
                    value: p.access,
                  },
                ].map((field) => (
                  <div key={field.label} className="mb-4">
                    <h4 className="text-xs font-semibold text-foreground">
                      {field.label}
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {local(field.value)}
                    </p>
                  </div>
                ))}
                <PaymentCitation ids={p.resources.slice(0, 2)} />
              </article>
            ))}
          </div>
        )}
      </PaymentSection>
    </PaymentPage>
  );
}

export function AgenticProtocolDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const { t, local } = usePaymentText();
  const protocol = getProtocol(id);
  if (id === "a2p2") return <Redirect to="/agentic-payments/protocols" />;
  if (id === "a402")
    return <Redirect to="/agentic-payments/scenarios#api-pay" />;
  if (!protocol)
    return (
      <PaymentPage>
        <h1 className="text-2xl font-semibold">
          {t("Protocol not found", "未找到该协议")}
        </h1>
        <Link
          href={`${BASE}/protocols`}
          className="mt-5 inline-block text-primary hover:underline"
        >
          {t("Back to protocols & mechanisms", "返回协议与机制")}
        </Link>
      </PaymentPage>
    );
  const p = protocol;
  return (
    <PaymentPage sources={protocolSources(p)}>
      <PaymentProtocolNav />
      <header className="grid gap-7 pb-9 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <p className="mb-3 text-xs font-semibold text-primary">
            {local(p.kind)} · {local(p.owner)}
          </p>
          <h1 className="font-serif text-4xl font-bold text-primary sm:text-5xl">
            {p.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{p.fullName}</p>
          <p className="mt-5 max-w-3xl text-xl font-semibold leading-8">
            {local(p.purpose)}
            <PaymentCitation ids={[p.resources[0]]} />
          </p>
          <div className="mt-5">
            <Relation protocol={p} />
          </div>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-5">
          <p className="text-xs font-semibold text-primary">
            {t("Current public record", "当前公开记录")}
          </p>
          <h2 className="mt-3 text-lg font-semibold">{local(p.stage)}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {local(p.access)}
            <PaymentCitation ids={p.resources.slice(0, 2)} />
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            {t("Version / record", "版本／记录")} · {local(p.version)}
          </p>
        </div>
      </header>
      <nav
        aria-label={t("On this page", "本页内容")}
        className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"
      >
        {[
          { id: "use", label: t("User flow", "怎样使用") },
          { id: "mechanism", label: t("Mechanism", "运作机制") },
          { id: "history", label: t("Evolution", "发展历程") },
          { id: "funding", label: t("Stablecoins", "稳定币关联") },
          { id: "actors", label: t("Participants", "参与方") },
          { id: "evidence", label: t("Evidence & risks", "证据与风险") },
          { id: "resources", label: t("Official resources", "权威资料") },
        ].map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="py-2 hover:text-primary hover:underline"
          >
            {item.label}
          </a>
        ))}
      </nav>
      <ProtocolEvidence id={id} />
      <PaymentSection
        id="use"
        kicker={t("THE USER EXPERIENCE", "用户使用")}
        title={t("What can I ask it to do?", "我可以让它做什么？")}
      >
        <p className="mb-6 max-w-4xl text-lg leading-8">{local(p.task)}</p>
        <div className="grid gap-6 md:grid-cols-2">
          {p.controls.map((f) => (
            <article
              key={f.title.en}
              className="border-l-2 border-primary/40 pl-5"
            >
              <h3 className="text-base font-semibold">{local(f.title)}</h3>
              <PaymentFactText fact={f} className="mt-2" />
            </article>
          ))}
        </div>
      </PaymentSection>
      <PaymentSection
        id="mechanism"
        kicker={t("BEHIND THE INTERFACE", "界面背后的机制")}
        title={t(
          "Who checks what, before the money moves?",
          "付款之前，谁检查什么？",
        )}
      >
        <PaymentFlow
          key={p.id}
          steps={p.flow}
          label={
            p.id === "act"
              ? t(
                  "Conceptual responsibilities · no field-level flow verified",
                  "概念职责 · 字段级流程未核实",
                )
              : t("Select a step to read its role", "点击步骤查看职责")
          }
        />
      </PaymentSection>
      <PaymentSection
        id="history"
        kicker={t("EVOLUTION", "发展与演变")}
        title={t("What changed along the way?", "它是怎样发展到今天的？")}
      >
        <Timeline events={p.history} />
      </PaymentSection>
      <PaymentSection
        id="funding"
        kicker={t("STABLECOIN CONNECTION", "与稳定币的联系")}
        title={local(p.stablecoin.title)}
      >
        <PaymentFactText fact={p.stablecoin} className="max-w-4xl text-base" />
        <div className="mt-5 flex flex-wrap gap-4">
          <Link
            href="/market-data/issuers-reserves"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            {t("Issuers & reserves", "发行方与储备")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/market-data/adoption"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            {t("Adoption evidence", "采用数据")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PaymentSection>
      <PaymentSection
        id="actors"
        kicker={t("PARTICIPANTS", "参与方")}
        title={t(
          "Different roles, different responsibilities",
          "不同角色，分别承担什么责任",
        )}
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {p.actors.map((actor) => (
            <article key={actor.name} className="border-t-2 border-border pt-4">
              <h3 className="text-base font-semibold">
                {t(actor.name, actor.nameZh ?? actor.name)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {local(actor.role)}
              </p>
              {actor.url && (
                <a
                  href={actor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-8 items-center gap-2 text-xs text-primary hover:underline"
                >
                  {t("Official site", "官方网站")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </article>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          {t(
            "Roles from the cited materials; a reference role is not necessarily a separate company.",
            "角色依据所引资料整理；参考角色不一定对应独立公司。",
          )}
          <PaymentCitation
            ids={p.resources
              .filter(
                (s) =>
                  s.includes("spec") ||
                  s.includes("code") ||
                  s === "apop" ||
                  s === "a2p2" ||
                  s === "ucp" ||
                  s === "x402-intro",
              )
              .slice(0, 2)}
          />
        </p>
      </PaymentSection>
      <PaymentSection
        id="evidence"
        kicker={t("EVIDENCE & RESPONSIBILITY", "证据与责任")}
        title={t(
          "What is demonstrated—and what should I ask?",
          "已经证明了什么，还应问哪些问题？",
        )}
      >
        <div className="mb-7 grid gap-5 md:grid-cols-2">
          {p.evidence.map((f) => (
            <article
              key={f.title.en}
              className="rounded-md bg-primary/[0.045] p-5"
            >
              <h3 className="mb-2 flex items-start gap-2 text-base font-semibold">
                <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                {local(f.title)}
              </h3>
              <PaymentFactText fact={f} />
            </article>
          ))}
        </div>
        <PaymentQuestions questions={p.risks} />
      </PaymentSection>
      <PaymentSection
        id="resources"
        kicker={t("GO TO THE ORIGINAL", "查看原始资料")}
        title={t(
          "Specifications, examples & release records",
          "规范、示例与发布记录",
        )}
      >
        <ul className="grid gap-4 md:grid-cols-2">
          {p.resources.map((id) => {
            const source = getSource(id)!;
            return (
              <li key={id}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 border-b border-border py-3 text-primary"
                >
                  <ExternalLink className="mt-1 h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium leading-6 group-hover:underline">
                    {local(source.title)}
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      {source.publisher}
                      {source.date ? ` · ${source.date}` : ""}
                      {source.version ? ` · ${source.version}` : ""}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </PaymentSection>
    </PaymentPage>
  );
}

export function AgenticScenariosPage() {
  const { t } = usePaymentText();
  return (
    <PaymentPage sources={allSources}>
      <header className="pb-8">
        <p className="mb-3 text-xs font-semibold text-primary">
          {t("TASKS, CONTROL & OUTCOMES", "任务、控制与结果")}
        </p>
        <h1 className="font-serif text-3xl font-bold text-primary sm:text-4xl">
          {t("Applications & risks", "应用与风险")}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
          {t(
            "Start with what the user needs. Follow the permission and the money, then ask what happens when something goes wrong.",
            "先看用户需要什么，再看授权和资金怎样流动，最后看出错时如何处理。",
          )}
        </p>
      </header>
      <MachinePaymentNotes />
      <PaymentSection
        title={t("One task, several mechanisms", "一个任务，涉及哪些机制？")}
      >
        <TaskExplorer detailed />
      </PaymentSection>
      <PaymentSection
        kicker={t(
          "USER NEEDS × PROVIDER RESPONSIBILITY",
          "用户需求 × 服务方责任",
        )}
        title={t("Convenience needs clear boundaries", "便利，需要清楚的边界")}
      >
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: t("Control the permission", "控制授权"),
              body: t(
                "Make the task, spending limits and confirmation steps visible. Do not treat a vague instruction as unlimited consent.",
                "让任务、支出限制和确认步骤可见；不把模糊指令当成无限授权。",
              ),
            },
            {
              icon: Wallet,
              title: t("Understand the funding", "了解资金"),
              body: t(
                "Know which account pays, who holds credentials, and which asset or network is used.",
                "知道从哪个账户付款、谁持有凭据、使用什么资产及网络。",
              ),
            },
            {
              icon: Workflow,
              title: t("Follow the outcome", "跟踪结果"),
              body: t(
                "Keep order and payment records separate and connect them for delivery checks, reconciliation and complaints.",
                "分别保留订单与付款记录，并用于交付核对、对账及投诉。",
              ),
            },
          ].map((item) => (
            <article
              key={item.title}
              className="border-t-2 border-primary/30 pt-5"
            >
              <item.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {item.body}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          {t(
            "Research questions, not a claim that every protocol supplies all protections.",
            "这是研究与检查问题，不表示每个协议都提供全部保障。",
          )}
          <PaymentCitation ids={["waller", "ap2-spec"]} />
        </p>
      </PaymentSection>
    </PaymentPage>
  );
}

export function AgenticEcosystemPage() {
  const { t, local } = usePaymentText();
  const [query, setQuery] = useState("");
  const entries = ECOSYSTEM_ENTRIES.filter((e) =>
    `${e.name} ${e.role.en} ${e.role.zh} ${e.protocols.join(" ")}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const events = AGENT_PROTOCOLS.flatMap((p) => p.history)
    .filter((e) => e.date !== REVIEWED_AT)
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <PaymentPage sources={allSources}>
      <header className="pb-8">
        <p className="mb-3 text-xs font-semibold text-primary">
          {t("WHO DOES WHAT", "谁承担什么角色")}
        </p>
        <h1 className="font-serif text-3xl font-bold text-primary sm:text-4xl">
          {t("Ecosystem & developments", "生态与进展")}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
          {t(
            "Protocol maintainers, agent platforms, wallets and payment networks do not play the same role. Explore the connections and the evidence behind them.",
            "协议维护者、智能体平台、钱包和支付网络承担不同角色。查看它们之间的联系，以及支持这些联系的证据。",
          )}
        </p>
      </header>
      <EcosystemEvidence />
      <PaymentSection
        title={t("Organizations and their roles", "机构及其角色")}
      >
        <div className="relative mb-6 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label={t(
              "Search organizations or protocols",
              "搜索机构或协议",
            )}
            placeholder={t(
              "Search organizations or protocols",
              "搜索机构或协议",
            )}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent pl-9"
          />
        </div>
        <div className="divide-y divide-border border-y border-border">
          {entries.map((e) => (
            <article
              key={e.name}
              className="grid gap-3 py-6 md:grid-cols-[.65fr_1.35fr]"
            >
              <div>
                <h2 className="text-lg font-semibold">{e.name}</h2>
                <p className="mt-2 text-xs font-medium text-primary">
                  {local(e.role)}
                </p>
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-8 items-center gap-2 text-xs text-primary hover:underline"
                >
                  {t("Official site", "官方网站")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <p className="text-sm leading-7 text-muted-foreground">
                  {local(e.note)}
                  <PaymentCitation ids={e.sources} />
                </p>
                {e.protocols.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-4">
                    {e.protocols.map((id) => (
                      <Link
                        key={id}
                        href={`${BASE}/protocols/${id}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                      >
                        {getProtocol(id)?.name}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
        {entries.length === 0 && (
          <p className="py-5 text-sm text-muted-foreground">
            {t(
              "No matching organizations. Try another search.",
              "没有匹配机构，请更换关键词。",
            )}
          </p>
        )}
      </PaymentSection>
      <PaymentSection
        kicker={t("DEVELOPMENT RECORD", "发展记录")}
        title={t(
          "From release to implementation—not one single stage",
          "发布、实现与采用，不是同一个阶段",
        )}
      >
        <Timeline events={events} />
      </PaymentSection>
    </PaymentPage>
  );
}
