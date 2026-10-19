import { Link } from "wouter";
import {
  usePaymentText,
  PaymentCitation,
  PaymentSection,
} from "./agentic-payment-ui";
import {
  PACKAGE,
  sourceIds,
  valueTranslations,
  ecosystemSources,
} from "@/data/agentic-payments";
import {
  evidenceSources,
  verifiedCard,
} from "@/data/agentic-payments-reconciled";

const NOTES: Record<string, [string, string]> = {
  ap2: [
    "Mandates link intent, purchase authorization and receipts. In human-present purchases, a trusted deterministic surface confirms the transaction; an LLM cannot declare user consent. In delegated purchases, amount, time and task constraints must be checked. AP2 is payment-agnostic, not a new rail.",
    "Mandate 连接意图、购买授权与回执。用户在场时，通过可信、确定性界面确认具体交易，不能让 LLM 自称用户已同意；预授权时核对金额、时间与任务约束。AP2 不依赖单一支付方式，也不是新支付轨道。",
  ],
  ucp: [
    "UCP exchanges products, carts, checkout, payment handlers and order state. It addresses repeated integration across agent surfaces and merchants. Without the AP2 Mandates extension, checkout is completed through a trusted deterministic UI. The business remains Merchant of Record; stablecoins are an indirect, payment-neutral possibility.",
    "UCP 标准化商品、购物车、checkout、payment handler 与订单状态的交换，减少智能体入口与商户逐一适配的成本。没有 AP2 Mandates 扩展时，由可信、确定性界面完成 checkout。商户仍是 Merchant of Record；稳定币属间接、支付方式中立的关联。",
  ],
  acp: [
    "ACP is the commerce standard; Instant Checkout is a product. Product feed → checkout session → merchant-authoritative cart → delegated payment → merchant payment and fulfillment. A delegated request can constrain maximum amount and expiry; the PSP returns a token. The merchant remains Merchant of Record, not OpenAI. Initiators and later maintainers are different roles.",
    "ACP 是商业交互标准，Instant Checkout 是产品。商品 feed → checkout session → 商户权威购物车 → 委托付款 → 商户收款与履约。委托请求可设置最大金额与有效期，由 PSP 返回 token。Merchant of Record 仍是商户，不是 OpenAI。发起方与后续维护者属于不同角色。",
  ],
  x402: [
    "The server returns HTTP 402 payment requirements. The agent pays and retries with proof; the service verifies before delivery. Uses include APIs, data, inference, compute, content and agent services. Stablecoin origins do not mean USDC-only: V2 expands assets and networks. The dated V0.2 record reports x402 Foundation / Linux Foundation governance, distinct from Coinbase origin.",
    "服务端返回 HTTP 402 付款要求，智能体付款并带证明重试，服务核验后交付。可用于 API、数据、推理、算力、内容与智能体服务。稳定币起源不等于仅支持 USDC；V2 扩展资产与网络。V0.2 日期记录中的 x402 Foundation／Linux Foundation 治理，与 Coinbase 起源须分开。",
  ],
  mpp: [
    "Stripe and Tempo describe micropayments, recurring payments and pay-per-use. Request → payment request → authorization → resource delivery. Supported implementations use stablecoins, cards and BNPL through Shared Payment Tokens / Stripe infrastructure. The official record names Browserbase, PostalForm, Prospect Butcher Co. and Stripe Climate as examples; these are reported examples, not independent adoption statistics.",
    "Stripe 与 Tempo 描述微额、周期与按量付款：请求 → 付款要求 → 授权 → 资源交付。相应实现通过 Shared Payment Tokens／Stripe 基础设施支持稳定币、卡与先买后付。官方记录列举 Browserbase、PostalForm、Prospect Butcher Co. 与 Stripe Climate；这是官方披露案例，不是独立采用量统计。",
  ],
  act: [
    "ACT covers intent, delegated authority, cross-agent/platform commerce and traceable execution. Public field-level specification evidence is incomplete; do not map ACT fields one-to-one to AP2. Agent Pay, Machine Pay and AI Wallet are related products. No verified direct stablecoin link is established.",
    "ACT 覆盖意图、委托权限、跨智能体／平台商业交互及可追溯执行。字段级公开规范证据仍不足，不得与 AP2 字段逐一对应。Agent Pay、Machine Pay 与 AI Wallet 是相关产品；尚无已核实的稳定币直接关联。",
  ],
  amp: [
    "Authorize the task rather than hand over the account. KYA and Agent Trust Rating concern trust. The mobile/wallet-first scope includes smartphones, wearables and in-car interfaces. Public nano-grade A2A settlement is reported, but its settlement asset remains UNKNOWN; tokenised deposits used elsewhere are not proof of AMP stablecoin settlement.",
    "授权任务，而不是交出账户。KYA 与 Agent Trust Rating 处理信任问题。移动／钱包优先的范围包括手机、可穿戴与车载入口。已有公开 nano 级 A2A 结算披露，但其结算资产仍为 UNKNOWN；其他业务的代币化存款不证明 AMP 使用稳定币结算。",
  ],
  apop: [
    "APOP is a protocol framework. Identity, intent and process trust are supported by agent identity, intent management, user identity and payment authorization. Five production-system validation transactions were reported at launch; validation is not general availability. Release/event: 2026-04-02; source publication: 2026-04-03. Public examples use card/bank networks, with no verified direct stablecoin link.",
    "APOP 是协议框架。身份、意图与过程信任对应智能体身份、意图管理、用户身份与支付授权四项能力。发布时披露五笔生产系统验证交易；生产系统验证，不等于全面开放。发布／活动日为 2026-04-02，来源发布日期为 2026-04-03。公开实例依托卡／银行网络，尚无已核实的稳定币直接关联。",
  ],
};
export function ProtocolEvidence({ id }: { id: string }) {
  const { t } = usePaymentText(),
    p = verifiedCard(id);
  if (!p) return null;
  const tr = (v: string) => t(v, valueTranslations[v] ?? v);
  return (
    <PaymentSection
      id="verified-record"
      kicker={t("DATED EVIDENCE · 2026-10-15", "日期证据 · 2026-10-15")}
      title={t(
        "Scope, fund control and evidence limits",
        "适用范围、资金控制与证据边界",
      )}
    >
      <p className="max-w-4xl text-sm leading-7 text-muted-foreground">
        {t(...NOTES[id])}
        <PaymentCitation ids={evidenceSources(id)} />
      </p>
      <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          [t("Classification", "分类"), p.artifact_type],
          [t("Human confirmation", "用户确认"), p.human_confirmed],
          [t("Delegation", "委托权限"), p.delegated],
          [t("Machine payment", "机器付款"), p.machine_payment],
          [t("Identity / trust", "身份／信任"), p.agent_identity],
          [t("Payment rail", "支付轨道"), p.rails],
          [t("Stablecoin relation", "稳定币关系"), p.stablecoin],
          [t("Evidence maturity", "证据阶段"), p.maturity],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold">{label}</dt>
            <dd className="mt-1 text-sm leading-6 text-muted-foreground">
              {tr(value)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 text-xs leading-6 text-muted-foreground">
        {t(
          "This is the retained evidence snapshot, not a new verification today. Historical version-specific flows below remain dated separately. Publication dates are not release dates.",
          "这是保留的证据快照，不是今日重新核验结果。下方历史版本流程另按其记录日期理解；来源发布日期不等于发布／活动日。",
        )}
      </p>
    </PaymentSection>
  );
}
export function OverviewResearch() {
  const { t } = usePaymentText();
  const blocks = [
    [
      "Autonomy requires limits",
      "自动化需要边界",
      "Human-confirmed: approve the final purchase. Pre-authorized: constrain amount, merchant/category, time and frequency. Machine-native: pay for resources within an authorized policy. More automation requires identity checks, revocation, audit and anomaly monitoring.",
      "逐笔确认：批准最终购买；预先授权：限定金额、商户／类别、时间与频次；机器原生：在获准策略内为资源付款。自动化越高，越需要身份核验、撤销、审计与异常监测。",
    ],
    [
      "Three ways to control funds",
      "三种资金控制方式",
      "A mandate grants constrained task authority. A scoped credential lets an agent use a one-time/restricted PSP token without seeing the underlying card. A platform account can execute only after an Allow/Deny approval. These models depend on the actual service, not the presence of AI alone.",
      "Mandate 授予受限任务权限；受限凭据让智能体使用一次性／限定 PSP token，而无需看到原始卡凭据；平台账户可在 Allow／Deny 确认后执行。模型取决于实际服务，不能仅因存在 AI 就推断其权限。",
    ],
    [
      "Where stablecoins can help",
      "稳定币可以解决什么",
      "Micropayments, machine-to-machine exchange, 24/7 cross-border settlement and programmability are structural use cases, not measured adoption claims. Consumer card/wallet acceptance, refunds and protections remain relevant; irreversibility, depegging and compliance must be checked separately.",
      "微额付款、机器间交换、跨境全天候结算与可编程性属于结构性应用方向，不是采用量结论。消费者卡／钱包接受度、退款和保护仍很重要；不可逆、脱锚与合规须单独核对。",
    ],
    [
      "Risks along the transaction",
      "交易沿途的风险",
      "Misread intent; prompt injection; over-delegation; credential/key compromise; malicious merchants/APIs; duplicate charges; stablecoin and chain risk; unclear liability. Authorization, payment, delivery and dispute resolution are separate controls.",
      "意图误读、提示注入、过度授权、凭据／密钥泄露、恶意商户／API、重复扣款、稳定币与链风险、责任不清。授权、付款、交付及争议处理是不同控制环节。",
    ],
  ];
  return (
    <PaymentSection
      title={t(
        "Understand the controls behind the task",
        "理解任务背后的控制机制",
      )}
    >
      <div className="grid gap-6 md:grid-cols-2">
        {blocks.map(([en, zh, bodyEn, bodyZh]) => (
          <article key={en}>
            <h3 className="text-base font-semibold">{t(en, zh)}</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {t(bodyEn, bodyZh)}
            </p>
          </article>
        ))}
      </div>
      <p className="mt-5">
        <PaymentCitation
          ids={[
            "SRC-AP2-02",
            "SRC-ACP-03",
            "SRC-MPP-01",
            "SRC-AMP-02",
            "SRC-X402-01",
          ]}
        />
      </p>
    </PaymentSection>
  );
}
export function MachinePaymentNotes() {
  const { t } = usePaymentText();
  return (
    <PaymentSection
      id="api-pay"
      title={t(
        "Per-request payments and agent services",
        "按请求付款与智能体服务",
      )}
    >
      <p className="text-sm leading-7 text-muted-foreground">
        {t(
          "A402 is a payment-method specification inside Alipay Machine Pay, which is a product; independent public governance and cross-implementation standard evidence remain unverified. It must not be ranked as a fully independent open standard.",
          "A402 是支付宝 Machine Pay 产品内的支付方法规范；独立公开治理与跨实现标准证据仍待核实，不能当成独立开放标准排名。",
        )}
      </p>
      <ol className="my-4 grid list-inside list-decimal gap-2 text-sm leading-6 sm:grid-cols-2">
        {[
          ["Request resource", "请求资源"],
          ["HTTP 402 + Payment-Needed", "HTTP 402 + Payment-Needed"],
          ["User authorizes / confirms; payment", "用户授权／确认并付款"],
          ["Obtain credential", "获得支付凭证"],
          ["Retry with Payment-Proof", "携带 Payment-Proof 重试"],
          ["Merchant verifies", "商户核验"],
          ["Deliver resource and receipt", "交付资源与履约回执"],
        ].map(([en, zh]) => (
          <li key={en}>{t(en, zh)}</li>
        ))}
      </ol>
      <PaymentCitation ids={["SRC-A402-01", "SRC-A402-02"]} />
      <p className="mt-5 text-sm leading-7 text-muted-foreground">
        {t(
          "Agent-to-agent: discover a service → agree a price → authorize a budget → pay → receive a result. AMP reports nano-grade A2A settlement; its asset and degree of autonomy must be verified per implementation. x402 and MPP address machine payments. A payment receipt alone does not establish service quality.",
          "智能体间服务：发现服务 → 确认价格 → 授权预算 → 付款 → 收到结果。AMP 披露 nano 级 A2A 结算，具体资产与自主程度须按实现核实；x402 与 MPP 处理机器付款。付款回执本身不证明服务质量。",
        )}
        <PaymentCitation ids={["SRC-AMP-02", "SRC-X402-01", "SRC-MPP-01"]} />
      </p>
      <Link
        className="mt-4 inline-block text-sm text-primary underline"
        href="/agentic-payments/protocols/mpp"
      >
        {t("Read MPP's mechanism", "查看 MPP 机制")}
      </Link>
    </PaymentSection>
  );
}
const TIMELINE_ZH = [
  "x402 发布",
  "Antom 智能体支付方案",
  "Google 发布 AP2",
  "ACP 与 ChatGPT Instant Checkout",
  "京东AI购用户协议",
  "x402 V2",
  "UCP 发布",
  "ACT 发布",
  "MPP 发布",
  "APOP 发布与五笔生产系统验证交易",
  "AMP 发布",
  "支付宝 AI Wallet／AI Pay 规模披露",
  "中国网信办智能体治理指引",
  "Meta Business Agent 扩展",
  "x402 Foundation 正式运营",
  "中国智能体支付自律公约（未核实）",
  "Grok Bot 经 Stripe Link 确认购买",
  "Meta Muse 发布",
  "AMP 第一期推广与 KYA 互操作工作",
  "Grok Bot 通过 X Money 或 Stripe Link 付款",
];
export function EcosystemEvidence() {
  const { t } = usePaymentText();
  return (
    <PaymentSection
      title={t(
        "Roles, products and rails · dated evidence",
        "角色、产品与轨道 · 日期证据",
      )}
    >
      <p className="mb-5 text-xs leading-6 text-muted-foreground">
        {t(
          "Evidence snapshot: 2026-10-15. Protocol, product, infrastructure and rail are distinct. Partnership announcements and pilots are not general availability; production validation is not broad release.",
          "证据快照：2026-10-15。协议、产品、基础设施与轨道须分开。合作公告与试点不等于全面开放，生产验证不等于全面推广。",
        )}
      </p>
      <details className="mt-6 border-t border-border pt-4">
        <summary className="cursor-pointer text-sm font-semibold">
          {t(
            "Evidence chronology · dates and status",
            "证据时间线 · 日期与状态",
          )}
        </summary>
        <ol className="mt-4 space-y-4">
          {PACKAGE.timeline.map((event, i) => (
            <li key={i} className="text-sm leading-6">
              <time>{event.date}</time> · {t(event.title, TIMELINE_ZH[i])}
              <span className="ml-2 text-xs text-muted-foreground">
                {t(
                  event.type,
                  (
                    {
                      protocol_release: "协议发布",
                      protocol_and_product: "协议与产品",
                      product_evidence: "产品证据",
                      protocol_evolution: "协议演变",
                      product_scale: "产品规模披露",
                      regulation: "监管指引",
                      industry_rule: "行业规则",
                      product_capability: "产品能力",
                      product_launch: "产品发布",
                      production_validation: "生产验证",
                      rollout: "推广",
                      partnership: "合作",
                      governance: "治理",
                      regulatory: "监管／行业规则",
                    } as Record<string, string>
                  )[event.type] ?? event.type,
                )}
              </span>
              {event.source_id ? (
                <PaymentCitation ids={[event.source_id]} />
              ) : (
                <strong className="ml-2">
                  {t(
                    "UNKNOWN · source unverified; not evidence of an enacted rule",
                    "UNKNOWN · 来源未核实，不作为生效规则证据",
                  )}
                </strong>
              )}
            </li>
          ))}
        </ol>
      </details>
    </PaymentSection>
  );
}
