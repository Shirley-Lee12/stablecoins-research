/** Production Friday presentation + dated V0.2 evidence. Frozen inputs stay untouched. */
import * as friday from "./friday-agentic-payments";
import {
  PACKAGE,
  valueTranslations,
  sourceIds,
  ecosystemSources,
} from "./agentic-payments";
export type {
  AgentProtocol,
  PaymentText,
  PaymentFact,
  PaymentEvent,
  PaymentLayer,
} from "./friday-agentic-payments";
export {
  PAYMENT_LAYERS,
  PAYMENT_SCENARIOS,
  REVIEWED_AT,
} from "./friday-agentic-payments";
import { ECO_ZH } from "./agentic-ecosystem-translations";
const { text } = friday;
export const EVIDENCE_DATE = "2026-10-15";
export type PaymentSource = friday.PaymentSource & {
  status?: string;
  lastVerified?: string;
  sourceType?: string;
  useFor?: string;
};
// Keep historical deep links as well as the verified manifest; never guess URL equivalence.
export const PAYMENT_SOURCES: PaymentSource[] = [
  ...friday.PAYMENT_SOURCES,
  ...PACKAGE.sources.map((s) => ({
    id: s.source_id,
    title: text(s.title, s.title),
    publisher: s.organization,
    type: (s.source_type.includes("product")
      ? "product"
      : s.source_type.includes("spec") || s.source_type.includes("docs")
        ? "spec"
        : s.source_type.includes("code")
          ? "code"
          : s.source_type.includes("report")
            ? "report"
            : "announcement") as PaymentSource["type"],
    sourceType: s.source_type,
    useFor: s.use_for,
    url: s.url,
    date: s.date,
    status: s.status,
    lastVerified: s.last_verified,
  })),
];
export const getSource = (id: string) =>
  PAYMENT_SOURCES.find((s) => s.id === id);
const translated = (v: string) => text(v, valueTranslations[v] ?? v);
const fact = (
  en: string,
  zh: string,
  bodyEn: string,
  bodyZh: string,
  sources: string[],
): friday.PaymentFact => ({
  title: text(en, zh),
  body: text(bodyEn, bodyZh),
  sources,
});
const extra: friday.AgentProtocol[] = PACKAGE.protocols
  .filter((p) => ["mpp", "act"].includes(p.id))
  .map((p) => {
    const ids = sourceIds(p.source_ids),
      act = p.id === "act";
    const core = act
      ? text(
          "Public descriptions connect intent, delegation and traceable commerce. A complete public field-level specification is insufficient; no AP2 field equivalence is established.",
          "公开定位连接用户意图、委托授权与可追溯商业执行。完整字段级公开 specification 当前仍不足；不能与 AP2 字段逐一对应。",
        )
      : text(
          "Stripe and Tempo describe an open machine-payment standard for microtransactions, recurring payments and pay-per-use. Supported methods include stablecoins, cards and BNPL through the relevant payment integration.",
          "Stripe 与 Tempo 的开放机器支付标准，覆盖微额交易、周期付款与按量付费。相应支付集成支持稳定币、银行卡与先买后付，具体以实现为准。",
        );
    const sequence = act
      ? [
          ["User intent", "用户意图"],
          ["Delegated authority", "委托权限"],
          ["Commerce execution", "商业执行"],
          ["Traceability", "可追溯记录"],
        ]
      : [
          ["Request resource", "请求资源"],
          ["Receive payment request", "收到付款要求"],
          ["Authorize payment", "授权付款"],
          ["Receive resource", "接收资源"],
        ];
    return {
      id: p.id,
      name: p.name,
      fullName: p.full_name,
      owner: text(p.org, act ? "支付宝生态" : "Stripe 与 Tempo"),
      layers: act ? ["authorization"] : ["settlement"],
      kind: translated(p.artifact_type),
      purpose: text(p.one_line_en, p.one_line_zh),
      stage: translated(p.maturity),
      version: text(
        "Evidence snapshot · " + p.last_verified,
        "证据快照 · " + p.last_verified,
      ),
      stablecoin: {
        ...fact(
          "Settlement asset",
          "结算资产",
          act
            ? "No verified direct stablecoin link in the reviewed record."
            : "Stablecoin and fiat-compatible paths depend on the supported implementation.",
          act
            ? "核查记录尚无已核实的稳定币直接关联。"
            : "支持稳定币与传统支付路径；具体方式取决于实现。",
          ids,
        ),
        relation: act ? "unverified" : "extension",
      },
      task: act
        ? text(
            "Delegate a commerce task within explicit limits; verify the actual product's authorization controls.",
            "在明确限制内委托商业任务；具体授权控制须核对实际产品。",
          )
        : text(
            "Pay programmatically for an API, compute, content or service request.",
            "以程序化方式为 API、算力、内容或服务请求付款。",
          ),
      controls: [
        {
          title: text("Scope and control", "范围与控制"),
          body: core,
          sources: ids,
        },
      ],
      flow: sequence.map(([en, zh]) =>
        fact(
          en,
          zh,
          act
            ? "Conceptual responsibility only, not a published ACT wire message or field-level sequence."
            : "Illustrative resource-payment lifecycle; exact payment checks and delivery depend on the implementation.",
          act
            ? "仅表示概念职责，不是已公开的 ACT 报文字段或线序。"
            : "资源付款生命周期示意；具体核验和交付依实现而定。",
          ids,
        ),
      ),
      history: [
        {
          ...fact(
            "Public release record",
            "公开发布记录",
            p.one_line_en,
            p.one_line_zh,
            ids,
          ),
          date: p.first_release,
          kind: text("Release record", "发布记录"),
        },
      ],
      actors: act
        ? [
            {
              name: "Alipay ecosystem",
              nameZh: "支付宝生态",
              role: text(
                "Commerce-trust protocol and related products",
                "商业信任协议及相关产品",
              ),
            },
          ]
        : [
            {
              name: "Stripe + Tempo",
              role: text("Protocol co-creators", "协议共同创建方"),
            },
          ],
      evidence: [
        {
          title: text("What the sources establish", "来源所支持的内容"),
          body: core,
          sources: ids,
        },
      ],
      risks: [
        fact(
          "Evidence and delivery limits",
          "证据与交付边界",
          act
            ? "Do not infer public field-level interoperability, AP2 equivalence or stablecoin settlement. Agent Pay, Machine Pay and AI Wallet are products, not additional protocols."
            : "A payment proof does not guarantee delivery. Budget, duplicate requests, refunds and supported payment methods require implementation-level checks.",
          act
            ? "不得推断字段级互操作、AP2 等价关系或稳定币结算。Agent Pay、Machine Pay 与 AI Wallet 属于产品，不是新增协议。"
            : "支付证明不保证交付；预算、重复请求、退款与支付方式均须核对具体实现。",
          ids,
        ),
      ],
      resources: ids,
      authorization: translated(p.delegated),
      rails: translated(p.rails),
      access: translated(p.maturity),
    };
  });
export const AGENT_PROTOCOLS: friday.AgentProtocol[] = [
  ...friday.AGENT_PROTOCOLS.map((p) => {
    const c = PACKAGE.protocols.find((c) => c.id === p.id)!;
    // Canonical classification / maturity are dated separately from the retained historical flow.
    return {
      ...p,
      kind: translated(c.artifact_type),
      stage: translated(c.maturity),
      resources: [...p.resources, ...sourceIds(c.source_ids)],
      ...(p.id === "acp"
        ? {
            owner: text(
              "OpenAI + Stripe · initiators; later maintainers listed separately",
              "OpenAI 与 Stripe · 发起方；后续维护者另列",
            ),
          }
        : {}),
      ...(p.id === "x402"
        ? {
            owner: text(
              c.org,
              "x402 Foundation / Linux Foundation；起源于 Coinbase",
            ),
          }
        : {}),
      ...(p.id === "apop"
        ? {
            access: text(
              "Production-system validation is not general availability; verify access separately.",
              "生产系统验证，不等于全面开放；接入条件须另行核实。",
            ),
          }
        : {}),
    };
  }),
  ...extra,
];
export const getProtocol = (id: string) =>
  AGENT_PROTOCOLS.find((p) => p.id === id);
const legacyNames: Record<string, string> = {
  google: "Google",
  meta: "Meta / Facebook",
  "ant-international": "Ant International / 蚂蚁国际",
  unionpay: "China UnionPay / 中国银联",
  x402: "Coinbase",
  "x-xai": "X / Twitter",
};
export const ECOSYSTEM_ENTRIES = [
  ...PACKAGE.ecosystem.map((e) => {
    const old = friday.ECOSYSTEM_ENTRIES.find(
        (o) => o.name === legacyNames[e.id],
      ),
      zh = ECO_ZH[e.id],
      ids = ecosystemSources[e.id] ?? [];
    const protocolIds = PACKAGE.protocols
      .filter(
        (p) => p.id !== "a402" && e.protocols.split(/[; ()]+/).includes(p.name),
      )
      .map((p) => p.id);
    return {
      name: e.name,
      role: text(e.role, zh[0]),
      protocols: [...new Set([...protocolIds, ...(old?.protocols ?? [])])],
      note: text(
        e.products +
          ". " +
          e.payment_infra +
          ". " +
          e.stablecoin +
          ". " +
          e.status +
          (old ? " · Friday record (2026-10-14): " + old.note.en : ""),
        zh[2] +
          "。" +
          zh[3] +
          (old ? "。Friday 记录（2026-10-14）：" + old.note.zh : ""),
      ),
      source: ids[0],
      sources: [...ids, ...(old ? [old.source] : [])],
      url: getSource(ids[0])!.url,
    };
  }),
  ...friday.ECOSYSTEM_ENTRIES.filter((e) =>
    ["Visa", "Mastercard"].includes(e.name),
  ).map((e) => ({ ...e, sources: [e.source] })),
];
export const verifiedCard = (id: string) =>
  PACKAGE.protocols.find((p) => p.id === id);
export const evidenceSources = (id: string) =>
  sourceIds(verifiedCard(id)?.source_ids ?? "");
