import data from "./agentic-payments-v02.generated.json";

/** V0.2 package + explicit user-authorized final content QA source/date addendum. */
export const PACKAGE = data;
export const AGENT_PROTOCOLS = data.protocols;
export const ECOSYSTEM_ENTRIES = data.ecosystem;
export const PAYMENT_SOURCES = data.sources;
export const REVIEWED_AT = "2026-10-15";
export type AgentProtocol = (typeof AGENT_PROTOCOLS)[number];
export type PaymentSource = (typeof PAYMENT_SOURCES)[number];
export const getProtocol = (id: string) =>
  AGENT_PROTOCOLS.find((p) => p.id === id);
export const getSource = (id: string) =>
  PAYMENT_SOURCES.find((p) => p.source_id === id);
export const sourceIds = (text: string) => text.split(";").filter(Boolean);
export function between(text: string, start: string, end?: string) {
  const index = text.indexOf(start);
  if (index < 0) return "";
  const rest = text.slice(index + start.length);
  return (end ? rest.split(end)[0] : rest).trim();
}
export const zhPage = (letter: string, next: string) =>
  between(data.copy.zh, `# ${letter}. `, `# ${next}. `);
export const enPage = (letter: string, next: string) =>
  between(data.copy.en, `# ${letter}. `, `# ${next}. `);
export const field = (text: string, name: string) => {
  const value = between(text, `**${name}**`)
    .split(/\n\*\*[^\n]+\*\*|\n---|\n#{2,3} /)[0]
    .trim();
  return ["H1", "Title", "Eyebrow", "Primary CTA", "Secondary CTA"].includes(
    name,
  )
    ? value.split(/\n\s*\n/)[0]
    : value;
};
export const detailCopy = (id: string) => {
  const match = data.copy.zh.match(
    new RegExp(
      `# E\\d\\. [^\\n]*\\/${id}\\x60[^\\n]*\\n([\\s\\S]*?)(?=\\n# E\\d\\.|\\n# F\\.|$)`,
    ),
  );
  return match?.[1] ?? "";
};
export const detailEnglish = (name: string) =>
  between(enPage("E", "F"), `## ${name}\n`).split("\n## ")[0];
export const overviewModules = zhPage("A", "B")
  .split(/\n## MODULE /)
  .slice(1);
export const scenarioModules = zhPage("C", "D")
  .split(/\n## SCENARIO /)
  .slice(1);
export const protocolFlow = (id: string) => {
  const marker = (
    {
      ap2: "P01 AP2",
      ucp: "P02 UCP",
      acp: "P03 ACP",
      x402: "P04 x402",
      mpp: "P05 MPP",
      act: "P06 ACT",
      amp: "P07 AMP",
      apop: "P08 APOP",
    } as Record<string, string>
  )[id];
  return marker
    ? between(data.visualScripts, `## AGT-${marker}\n`).split("\n")[0]
    : "";
};
export const ecosystemSources: Record<string, string[]> = {
  google: ["SRC-AP2-01", "SRC-UCP-01"],
  "openai-stripe": ["SRC-ACP-01", "SRC-ACP-03", "SRC-MPP-01"],
  x402: ["SRC-X402-01", "SRC-X402-02"],
  alipay: [
    "SRC-ACT-02",
    "SRC-ALIPAY-01",
    "SRC-A402-01",
    "SRC-A402-02",
    "SRC-ALIPAY-03",
  ],
  "ant-international": ["SRC-AMP-01", "SRC-AMP-02", "SRC-ANTOM-01"],
  unionpay: ["SRC-APOP-01", "SRC-APOP-02"],
  jd: ["SRC-JD-01", "SRC-JD-02", "SRC-JD-03", "SRC-JD-04"],
  meta: ["SRC-META-01", "SRC-META-02"],
  "x-xai": ["SRC-XAI-01", "SRC-XMONEY-01", "SRC-XMONEY-02"],
};

// Faithful translations of frozen labels; never new capabilities or inferred facts.
export const valueTranslations: Record<string, string> = {
  PROTOCOL: "协议",
  PROTOCOL_FRAMEWORK: "协议框架",
  PAYMENT_METHOD_SPEC: "产品内支付方法规范",
  PRODUCT: "产品",
  INFRASTRUCTURE: "基础设施",
  Yes: "支持",
  No: "否",
  "Not core": "非核心功能",
  Compatible: "可兼容",
  "Via AP2 extension": "通过 AP2 扩展",
  "Partial / Delegated Payments": "部分支持 / 委托支付",
  "Via product layer": "通过产品层",
  "Policy-dependent": "取决于支付策略",
  "Implementation-dependent": "取决于具体实现",
  "Yes / implementation-dependent": "支持 / 取决于具体实现",
  "Product-dependent": "取决于产品",
  "Current docs include user authorization/confirmation":
    "当前文档包含用户授权与确认",
  "Yes / nano A2A disclosed": "支持 / 已披露 A2A 极小额支付",
  "Research / sandbox for A2A": "A2A 仍属研究 / 沙盒",
  Commerce: "商业交互",
  "Authorization / Trust": "授权 / 信任",
  "Commerce Trust / Authorization": "商业信任 / 授权",
  "Mobile Agentic Payment / Authorization": "移动智能体支付 / 授权",
  "Payment Trust / Authorization": "支付信任 / 授权",
  "Machine Payment": "机器支付",
  "Indirect / payment-neutral": "间接关联 / 支付方式中立",
  "No native dependency / indirect": "无原生稳定币依赖 / 间接关联",
  "No verified direct link": "尚无已核实的直接关联",
  "Unknown for nano-settlement": "UNKNOWN · 极小额结算资产未确认",
  "Direct / strong origin; not exclusive": "直接关联 / 起源紧密，但不限稳定币",
  "Direct + fiat-compatible": "直接关联，同时兼容法币",
  "Open-source standard / product integration": "开源标准 / 产品集成",
  "Open standard; Instant Checkout approved partners":
    "开放标准；Instant Checkout 面向获准伙伴",
  "Open protocol / evolving ecosystem": "开放协议 / 生态发展中",
  "Ecosystem protocol; public field-level spec incomplete":
    "生态协议；公开字段级规范尚不完整",
  "Phase I rollout": "第一阶段推广",
  "Production-system validation + ecosystem rollout": "生产系统验证 + 生态推广",
  "Open protocol / vendor-neutral governance": "开放协议 / 中立治理",
  "Open standard / production use cases": "开放标准 / 已有生产案例",
  "Documented product method; not yet classified as independent open standard":
    "已有产品方法文档；尚不归类为独立开放标准",
  "Payment handlers; e.g. cards/wallets": "支付处理器，例如银行卡 / 钱包",
  "Merchant PSP; currently card-centric spec":
    "商户支付服务商；当前规范以银行卡为主",
  "Payment-agnostic: cards, bank, stablecoins":
    "不依赖特定支付方式：银行卡、银行转账、稳定币",
  "Alipay/payment products": "支付宝 / 支付产品",
  "Digital wallets / APMs; settlement asset varies":
    "数字钱包 / 替代支付方式；结算资产因实现而异",
  "UnionPay cards / bank rails / existing payment network":
    "银联卡 / 银行轨道 / 现有支付网络",
  "Stablecoins + broader payment types": "稳定币及更广泛支付类型",
  "Stablecoins + cards + BNPL via supported methods":
    "支持的支付方式包括稳定币、银行卡及先买后付",
  "Alipay payment infrastructure": "支付宝支付基础设施",
  "Agent authorization / keys": "Agent 授权 / 密钥",
  "Trust / traceability; field-level spec pending":
    "信任 / 可追溯性；字段级规范待公开",
  "Wallet/session/discovery extensions": "钱包 / 会话 / 发现扩展",
  "Via Alipay skills/product integration": "通过支付宝 Skills / 产品集成",
};
