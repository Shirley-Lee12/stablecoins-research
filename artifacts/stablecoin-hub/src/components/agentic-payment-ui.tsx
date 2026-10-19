import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, ExternalLink, Info } from "lucide-react";
import { SectionTopNav } from "@/components/section-top-nav";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";
import {
  AGENT_PROTOCOLS,
  PAYMENT_SOURCES,
  REVIEWED_AT,
  getSource,
  type PaymentFact,
  type PaymentText,
} from "@/data/friday-agentic-payments";

export function usePaymentText() {
  const { t } = useLanguage();
  return { t, local: (value: PaymentText) => t(value.en, value.zh) };
}

export function PaymentCitation({ ids }: { ids: string[] }) {
  const { t, local } = usePaymentText();
  const types = {
    spec: t("Specification", "官方规范"),
    code: t("Source / sample", "源码／示例"),
    announcement: t("Official announcement", "官方公告"),
    report: t("Research / release coverage", "研究／发布报道"),
    product: t("Product page", "产品介绍"),
  };
  return (
    <>
      {[...new Set(ids)].map((id) => {
        const source = getSource(id);
        if (!source) return null;
        const number = PAYMENT_SOURCES.indexOf(source) + 1;
        return (
          <sup key={id} className="ml-0.5 inline-flex align-super">
            <Tooltip delayDuration={200} disableHoverableContent>
              <TooltipTrigger asChild>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${local(source.title)} · ${t("opens in a new tab", "新标签页打开")}`}
                  className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-sm text-[11px] font-semibold leading-none text-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  [{number}]
                </a>
              </TooltipTrigger>
              <TooltipContent className="max-w-[min(320px,90vw)] border border-border bg-popover p-3 text-popover-foreground shadow-md">
                <p className="font-semibold leading-5">{local(source.title)}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {source.publisher} · {types[source.type]}
                  {source.version ? ` · ${source.version}` : ""}
                  {source.date ? ` · ${source.date}` : ""}
                </p>
              </TooltipContent>
            </Tooltip>
          </sup>
        );
      })}
    </>
  );
}

export function PaymentFactText({
  fact,
  className,
}: {
  fact: PaymentFact;
  className?: string;
}) {
  const { local } = usePaymentText();
  return (
    <p className={cn("text-sm leading-7 text-muted-foreground", className)}>
      {local(fact.body)}
      <PaymentCitation ids={fact.sources} />
    </p>
  );
}

export function PaymentSection({
  id,
  kicker,
  title,
  children,
}: {
  id?: string;
  kicker?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 border-t border-border py-9 sm:py-12"
    >
      {kicker && (
        <p className="mb-3 text-xs font-semibold tracking-[0.1em] text-primary">
          {kicker}
        </p>
      )}
      <h2 className="mb-6 max-w-4xl font-serif text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function PaymentFlow({
  steps,
  label,
  conceptual = false,
}: {
  steps: PaymentFact[];
  label: string;
  conceptual?: boolean;
}) {
  const { t, local } = usePaymentText();
  const [selected, setSelected] = useState(0);
  // A different task can have fewer steps than the previous task.
  const index = Math.min(selected, steps.length - 1);
  if (!steps.length) return null;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {conceptual && (
          <span className="text-xs text-muted-foreground">
            {t(
              "Illustrative task · no money moves",
              "任务示意 · 不发生真实付款",
            )}
          </span>
        )}
      </div>
      <div
        aria-label={label}
        className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:items-stretch"
      >
        {steps.map((step, i) => (
          <React.Fragment key={`${step.title.en}-${i}`}>
            <button
              type="button"
              aria-pressed={index === i}
              onClick={() => setSelected(i)}
              className={cn(
                "flex min-w-0 items-center gap-3 rounded-md border px-4 py-4 text-left transition-colors xl:flex-1 xl:flex-col xl:items-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
                index === i
                  ? "border-primary bg-primary/[0.08]"
                  : "border-border bg-transparent hover:border-primary/60",
              )}
            >
              <span
                className={cn(
                  "font-mono text-xs",
                  index === i ? "text-primary" : "text-muted-foreground",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-semibold leading-6">
                {local(step.title)}
              </span>
            </button>
            {i < steps.length - 1 && (
              <ArrowRight
                aria-hidden="true"
                className="hidden h-4 w-4 shrink-0 self-center text-primary/60 xl:block"
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <div
        aria-live="polite"
        className="mt-4 border-l-2 border-primary bg-primary/[0.04] px-4 py-3"
      >
        <p className="text-sm font-semibold">{local(steps[index].title)}</p>
        <PaymentFactText fact={steps[index]} />
      </div>
    </div>
  );
}

export function PaymentQuestions({ questions }: { questions: PaymentFact[] }) {
  const { local } = usePaymentText();
  return (
    <div className="divide-y divide-border border-y border-border">
      {questions.map((question) => (
        <details key={question.title.en} className="group py-4">
          <summary className="cursor-pointer text-sm font-semibold leading-6 text-foreground marker:text-primary">
            {local(question.title)}
          </summary>
          <PaymentFactText fact={question} className="mt-3 max-w-4xl pl-4" />
        </details>
      ))}
    </div>
  );
}

export function PaymentProtocolNav() {
  const [location] = useLocation();
  const { t } = usePaymentText();
  return (
    <nav
      aria-label={t("Choose a protocol", "选择具体协议")}
      className="mb-8 flex min-w-0 gap-5 overflow-x-auto border-b border-border pb-1"
    >
      {[
        {
          name: t("All protocols", "全部协议"),
          href: "/agentic-payments/protocols",
        },
        ...AGENT_PROTOCOLS.map((p) => ({
          name: p.name,
          href: `/agentic-payments/protocols/${p.id}`,
        })),
      ].map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={location === item.href ? "page" : undefined}
          className={cn(
            "shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition-colors hover:text-primary",
            location === item.href
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground",
          )}
        >
          {item.name}
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
  const { t, local } = usePaymentText();
  const [notesOpen, setNotesOpen] = useState(false);
  const chosenSources = PAYMENT_SOURCES.filter((s) => sources.includes(s.id));
  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl pb-8">
      <SectionTopNav
        eyebrow={t("Agentic Payments", "智能体支付协议")}
        ariaLabel={t("Agentic payment sections", "智能体支付专题导航")}
        items={[
          { href: "/agentic-payments", label: t("Overview", "概览") },
          {
            href: "/agentic-payments/protocols",
            label: t("Protocols & mechanisms", "协议与机制"),
            matchPrefix: true,
          },
          {
            href: "/agentic-payments/scenarios",
            label: t("Applications & risks", "应用与风险"),
          },
          {
            href: "/agentic-payments/ecosystem",
            label: t("Ecosystem & developments", "生态与进展"),
          },
        ]}
      />
      {children}
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
        <p>
          {t("Sources reviewed", "资料核查")} · {REVIEWED_AT}
        </p>
        <button
          type="button"
          className="inline-flex min-h-9 items-center gap-2 text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
          onClick={() => setNotesOpen(true)}
        >
          <Info className="h-3.5 w-3.5" />
          {t("Sources & reading notes", "资料与阅读说明")}
        </button>
      </footer>
      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent
          closeLabel={t("Close", "关闭窗口")}
          className="max-h-[85dvh] max-w-2xl overflow-hidden"
        >
          <DialogHeader>
            <DialogTitle>
              {t("Sources & reading notes", "资料与阅读说明")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "How to interpret specifications, examples and public claims.",
                "如何理解规范、参考示例与公开声明。",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(85dvh-9rem)] min-h-0 overflow-y-auto overscroll-contain pr-1">
            <div className="space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                {t(
                  "Specifications explain a design. Reference code shows an implementation example, not that every product has adopted it.",
                  "规范说明设计；参考代码展示一种实现，不代表所有产品都已采用。",
                )}
              </p>
              <p>
                {t(
                  "Official announcements describe what an organization reported. Partners and covered accounts are not users who actually made agent payments.",
                  "官方公告记录机构披露的进展。伙伴及覆盖账户，不是实际使用智能体付款的用户数量。",
                )}
              </p>
              <p>
                {t(
                  "The flows marked illustrative describe research scenarios, not a live payment service. Refunds and liability depend on the actual service, terms and jurisdiction.",
                  "标为示意的流程用于解释研究场景，不是真实付款服务。退款与责任取决于实际服务、条款及所在地区。",
                )}
              </p>
              <p>
                {t(
                  "Not verified means that the reviewed public sources do not establish a capability; it does not prove that the capability is absent. Review dates are not release dates.",
                  "未核实表示本轮公开资料不足以确认某项能力，并不证明该能力不存在。核查日期不等于发布日期。",
                )}
              </p>
              <p>
                {t(
                  "Research and speeches represent their stated authors or institutions; they are not automatically regulatory rules or approvals.",
                  "研究和讲话需按作者及机构身份理解，不自动等于监管规则或许可。",
                )}
              </p>
            </div>
            {chosenSources.length > 0 && (
              <div className="mt-2 border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-semibold">
                  {t("Related primary resources", "相关权威资料")}
                </h3>
                <ul className="space-y-3">
                  {chosenSources.map((source) => (
                    <li key={source.id} className="text-sm">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-start gap-2 text-primary hover:underline"
                      >
                        <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0" />
                        <span>
                          [{PAYMENT_SOURCES.indexOf(source) + 1}]{" "}
                          {local(source.title)}
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {source.publisher}
                            {source.date ? ` · ${source.date}` : ""}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
