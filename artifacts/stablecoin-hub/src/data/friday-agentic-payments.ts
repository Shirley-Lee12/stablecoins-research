export type PaymentText = { en: string; zh: string };
export const text = (en: string, zh: string): PaymentText => ({ en, zh });
export const REVIEWED_AT = "2026-10-14";
export type PaymentSource = {
  id: string;
  title: PaymentText;
  publisher: string;
  type: "spec" | "code" | "announcement" | "report" | "product";
  url: string;
  date?: string;
  version?: string;
};
export const PAYMENT_SOURCES: PaymentSource[] = [
  {
    id: "ap2-spec",
    title: text(
      "AP2: roles, mandates and verification",
      "AP2：角色、授权与验证规范",
    ),
    publisher: "Google",
    type: "spec",
    version: "v0.2",
    url: "https://ap2-protocol.org/ap2/specification/",
  },
  {
    id: "ap2-mandate",
    title: text("AP2 Payment Mandate", "AP2 付款授权规范"),
    publisher: "Google",
    type: "spec",
    url: "https://ap2-protocol.org/ap2/payment_mandate/",
  },
  {
    id: "ap2-flow",
    title: text("AP2 transaction flows", "AP2 交易流程"),
    publisher: "Google",
    type: "spec",
    url: "https://ap2-protocol.org/ap2/flows/",
  },
  {
    id: "ap2-launch",
    title: text(
      "Announcing Agent Payments Protocol",
      "Agent Payments Protocol 发布介绍",
    ),
    publisher: "Google Cloud",
    type: "announcement",
    date: "2025-09-16",
    url: "https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol",
  },
  {
    id: "ap2-x402",
    title: text("AP2 human-present x402 sample", "AP2 用户在场的 x402 示例"),
    publisher: "Google",
    type: "code",
    url: "https://github.com/google-agentic-commerce/AP2/tree/main/code/samples/python/scenarios/a2a/human-present/x402/",
  },
  {
    id: "acp-spec",
    title: text(
      "Agentic Commerce Protocol specifications",
      "Agentic Commerce Protocol 版本规范",
    ),
    publisher: "ACP",
    type: "spec",
    url: "https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/tree/main/spec",
  },
  {
    id: "acp-launch",
    title: text(
      "Developing an open standard for agentic commerce",
      "智能体商业交互开放标准发布介绍",
    ),
    publisher: "Stripe",
    type: "announcement",
    date: "2025-09-29",
    url: "https://stripe.com/blog/developing-an-open-standard-for-agentic-commerce",
  },
  {
    id: "acp-maintainers",
    title: text("ACP lead maintainers", "ACP 主要维护者名单"),
    publisher: "ACP",
    type: "code",
    url: "https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/MAINTAINERS.md",
  },
  {
    id: "amp-code",
    title: text(
      "AMP documentation and reference scenarios",
      "AMP 文档与参考场景",
    ),
    publisher: "Ant International",
    type: "code",
    url: "https://github.com/ant-intl/AMP",
  },
  {
    id: "amp-launch",
    title: text("Ant International launches AMP", "蚂蚁国际发布 AMP"),
    publisher: "Ant International",
    type: "announcement",
    date: "2026-04-28",
    url: "https://www.ant-intl.com/en/news/detail/?id=ant-international-launches-open-sourced-agentic-mobile-protocol-to-drive-ai-commerce&tag=AI",
  },
  {
    id: "amp-rollout",
    title: text(
      "AMP wallet and acquirer rollout; KYA collaboration",
      "AMP 钱包与收单伙伴进展及 KYA 合作",
    ),
    publisher: "Ant International",
    type: "announcement",
    date: "2026-09-11",
    url: "https://www.ant-intl.com/en/news/detail/?id=ant-internationals-agentic-mobile-protocol-rolls-out-globally-with-wallets-acquirers-initiating-collaboration-on-kya-interoperability-framework-with-mastercard-and-visa&redirect=news&tag=PARTNERSHIP%2CAI",
  },
  {
    id: "x402-intro",
    title: text(
      "x402: HTTP payments and resource access",
      "x402：HTTP 付款与资源访问",
    ),
    publisher: "x402",
    type: "spec",
    url: "https://docs.x402.org/introduction",
  },
  {
    id: "x402-tokens",
    title: text("x402 networks and token support", "x402 网络与代币支持"),
    publisher: "x402",
    type: "spec",
    url: "https://docs.x402.org/core-concepts/network-and-token-support",
  },
  {
    id: "x402-launch",
    title: text("Introducing x402", "x402 发布介绍"),
    publisher: "Coinbase",
    type: "announcement",
    date: "2025-05-06",
    url: "https://www.coinbase.com/developer-platform/discover/launches/x402",
  },
  {
    id: "x402-foundation",
    title: text(
      "Coinbase and Cloudflare announce x402 Foundation plans",
      "Coinbase 与 Cloudflare 宣布 x402 Foundation 计划",
    ),
    publisher: "Coinbase",
    type: "announcement",
    date: "2025-09-23",
    url: "https://www.coinbase.com/en-gb/blog/coinbase-and-cloudflare-will-launch-x402-foundation",
  },
  {
    id: "ucp",
    title: text(
      "Universal Commerce Protocol",
      "Universal Commerce Protocol 官方资料",
    ),
    publisher: "UCP",
    type: "spec",
    url: "https://ucp.dev/",
  },
  {
    id: "ucp-history",
    title: text(
      "UCP announcements and version releases",
      "UCP 公告与版本发布记录",
    ),
    publisher: "UCP",
    type: "announcement",
    url: "https://ucp.dev/documentation/announcements/",
  },
  {
    id: "ucp-launch",
    title: text("Under the hood: UCP", "UCP 机制与发布介绍"),
    publisher: "Google Developers",
    type: "announcement",
    date: "2026-01-11",
    url: "https://developers.googleblog.com/under-the-hood-universal-commerce-protocol-ucp/",
  },
  {
    id: "apop",
    title: text(
      "UnionPay launches Agentic Payment Open Protocol",
      "中国银联发布智能体支付开放协议框架",
    ),
    publisher: "China UnionPay",
    type: "announcement",
    date: "2026-04-03",
    url: "https://www.unionpay.com/upowhtml/cn/templates/newInfo-nosub/7885004da382485e8bde5a0ba000fdd3/20260403105759.html",
  },

  {
    id: "x-money",
    title: text("X Money official product page", "X Money 官方产品介绍"),
    publisher: "X",
    type: "product",
    url: "https://money.x.com/en",
  },
  {
    id: "visa-tap",
    title: text("Visa Trusted Agent Protocol", "Visa 可信智能体协议"),
    publisher: "Visa",
    type: "spec",
    url: "https://developer.visa.com/capabilities/trusted-agent-protocol",
  },
  {
    id: "mastercard",
    title: text("Mastercard Agent Pay", "Mastercard Agent Pay 产品介绍"),
    publisher: "Mastercard",
    type: "product",
    url: "https://www.mastercard.com/us/en/business/artificial-intelligence/mastercard-agent-pay.html",
  },
  {
    id: "waller",
    title: text(
      "Payments in the age of AI agents",
      "智能体时代的支付：Waller 讲话",
    ),
    publisher: "Christopher J. Waller · BIS",
    type: "report",
    url: "https://www.bis.org/speeches/20261005-payments-age-ai-agents",
  },
  {
    id: "bis-money",
    title: text(
      "BIS 2026: anchoring trust in money",
      "BIS 2026：货币信任与稳定币研究",
    ),
    publisher: "BIS",
    type: "report",
    url: "https://www.bis.org/publications/iii-anchoring-trust-money-innovation-beyond-stablecoins",
  },
];

export type PaymentFact = {
  title: PaymentText;
  body: PaymentText;
  sources: string[];
};
const fact = (
  title: PaymentText,
  body: PaymentText,
  ...sources: string[]
): PaymentFact => ({ title, body, sources });
export type PaymentLayer = "commerce" | "authorization" | "settlement";
export const PAYMENT_LAYERS: Record<PaymentLayer, PaymentText> = {
  commerce: text("Commerce interaction", "商业交互"),
  authorization: text("Identity & authorization", "身份与授权"),
  settlement: text("Payment & settlement", "支付与结算"),
};
export type PaymentEvent = PaymentFact & { date: string; kind: PaymentText };
const event = (
  date: string,
  kind: PaymentText,
  title: PaymentText,
  body: PaymentText,
  ...sources: string[]
): PaymentEvent => ({ date, kind, title, body, sources });
export type PaymentActor = {
  name: string;
  nameZh?: string;
  role: PaymentText;
  url?: string;
};
export type AgentProtocol = {
  id: string;
  name: string;
  fullName: string;
  owner: PaymentText;
  layers: PaymentLayer[];
  kind: PaymentText;
  purpose: PaymentText;
  stage: PaymentText;
  version: PaymentText;
  stablecoin: PaymentFact & {
    relation: "implementation" | "extension" | "unverified";
  };
  task: PaymentText;
  controls: PaymentFact[];
  flow: PaymentFact[];
  history: PaymentEvent[];
  actors: PaymentActor[];
  evidence: PaymentFact[];
  risks: PaymentFact[];
  resources: string[];
  authorization: PaymentText;
  rails: PaymentText;
  access: PaymentText;
};
export const AGENT_PROTOCOLS: AgentProtocol[] = [
  {
    id: "ap2",
    name: "AP2",
    fullName: "Agent Payments Protocol",
    owner: text("Google & contributors", "Google 与贡献者"),
    layers: ["authorization"],
    kind: text("Open protocol", "开放协议"),
    purpose: text(
      "Bind a purchase and its payment to the user's authorization.",
      "让购买内容和付款与用户授权相对应。",
    ),
    stage: text("Public specification & samples", "公开规范与示例"),
    version: text("v0.2", "v0.2"),
    stablecoin: {
      ...fact(
        text("A public x402 sample", "有公开 x402 示例"),
        text(
          "Google provides an AP2/x402 scenario. This demonstrates a combination, not acceptance by every AP2 merchant.",
          "Google 提供 AP2 与 x402 的组合示例；示例不代表所有 AP2 商户都接受稳定币。",
        ),
        "ap2-x402",
      ),
      relation: "implementation",
    },
    task: text(
      "Ask an agent to find a purchase; approve the checkout or authorize a constrained task in advance.",
      "让智能体寻找购买方案，再确认订单；或事先授权它在限定条件下执行。",
    ),
    controls: [
      fact(
        text("Approve now or delegate", "逐笔确认或预先授权"),
        text(
          "The specification distinguishes direct and autonomous modes.",
          "规范区分用户在场确认与预先授权后的自主执行。",
        ),
        "ap2-spec",
      ),
      fact(
        text("Set payment conditions", "限定付款条件"),
        text(
          "Payment mandates express constraints such as amounts, recipients and time limits.",
          "付款授权可以表达金额、收款方、有效期等限制。",
        ),
        "ap2-mandate",
      ),
    ],
    flow: [
      fact(
        text("Authorize", "用户授权"),
        text(
          "A trusted interface records the user's consent.",
          "可信交互界面记录用户同意的内容。",
        ),
        "ap2-flow",
      ),
      fact(
        text("Match the order", "对应订单"),
        text(
          "The merchant checks purchase authorization against checkout contents.",
          "商户检查购买授权是否对应订单内容。",
        ),
        "ap2-spec",
      ),
      fact(
        text("Verify payment", "核验付款"),
        text(
          "Credential and payment parties check the authorization before payment.",
          "凭据及付款相关方在付款前核验授权。",
        ),
        "ap2-mandate",
      ),
      fact(
        text("Keep receipts", "保留回执"),
        text(
          "Purchase and payment receipts can support later evidence checks.",
          "购买和付款回执为后续核验提供证据。",
        ),
        "ap2-flow",
      ),
    ],
    history: [
      event(
        "2025-09-16",
        text("Announcement", "发布"),
        text(
          "An authorization standard across payment methods",
          "提出跨付款方式的授权标准",
        ),
        text(
          "Google introduces AP2 for agent-initiated payments.",
          "Google 发布 AP2，聚焦智能体发起付款的授权问题。",
        ),
        "ap2-launch",
      ),
      event(
        REVIEWED_AT,
        text("Specification checked", "规范核查"),
        text("v0.2: linked mandates and receipts", "v0.2：关联授权与回执"),
        text(
          "The current page links purchase and payment evidence and separates direct and autonomous modes; this date is our review, not a release date.",
          "当前规范关联购买与付款证据，并区分两种执行模式；此日期是核查日期，不是版本发布日期。",
        ),
        "ap2-spec",
      ),
    ],
    actors: [
      {
        name: "Google",
        role: text("Protocol initiator", "协议发起方"),
        url: "https://ap2-protocol.org/",
      },
      {
        name: "Shopping Agent",
        nameZh: "购物智能体",
        role: text("Discover and execute the purchase", "寻找并执行购买"),
      },
      {
        name: "Merchant",
        nameZh: "商户",
        role: text(
          "Check the order and purchase authorization",
          "核验订单及购买授权",
        ),
      },
      {
        name: "Credential Provider",
        nameZh: "付款凭据提供方",
        role: text(
          "Check access to payment credentials",
          "核验付款凭据的使用权限",
        ),
      },
    ],
    evidence: [
      fact(
        text("Card and x402 reference scenarios", "卡支付与 x402 参考场景"),
        text(
          "The documentation links sample flows for user-present and autonomous tasks. Samples are not usage-volume evidence.",
          "官方资料链接用户在场及自主执行示例；示例并不是使用量证据。",
        ),
        "ap2-flow",
        "ap2-x402",
      ),
    ],
    risks: [
      fact(
        text("What if the order changes?", "订单变化后还能付款吗？"),
        text(
          "Check that the payment remains linked to the authorized checkout; a new order must not silently inherit the old permission.",
          "需要核对付款是否仍对应已授权订单，不能让新订单默默沿用旧权限。",
        ),
        "ap2-spec",
      ),
      fact(
        text("Does a receipt guarantee a refund?", "有回执就一定能退款吗？"),
        text(
          "AP2 provides dispute evidence; detailed dispute resolution and evidence retrieval are outside its specification.",
          "AP2 提供争议证据，但具体争议处理与证据调取安排不由该规范完整规定。",
        ),
        "ap2-spec",
      ),
    ],
    resources: [
      "ap2-spec",
      "ap2-mandate",
      "ap2-flow",
      "ap2-x402",
      "ap2-launch",
    ],
    authorization: text("Direct / pre-authorized", "逐笔确认／预先授权"),
    rails: text(
      "Payment-method agnostic; x402 sample",
      "不限单一付款方式；有 x402 示例",
    ),
    access: text(
      "Public docs and samples; production integration is separate",
      "文档与示例公开；生产接入需另行确认",
    ),
  },
  {
    id: "acp",
    name: "ACP",
    fullName: "Agentic Commerce Protocol",
    owner: text(
      "OpenAI, Stripe, Meta · maintainer list",
      "OpenAI、Stripe、Meta · 维护者名单",
    ),
    layers: ["commerce"],
    kind: text("Open commerce standard", "开放商业交互标准"),
    purpose: text(
      "Connect buyers, agents and merchants through a shared checkout model.",
      "用共同的结账规则连接买家、智能体和商户。",
    ),
    stage: text("Versioned public specifications", "公开的日期版本规范"),
    version: text("2026-04-17 · spec directory", "2026-04-17 · 规范目录"),
    stablecoin: {
      ...fact(
        text("Checkout is not a settlement asset", "结账标准不等于结算资产"),
        text(
          "The commerce standard can work with payment infrastructure. Stablecoin acceptance must be verified for a specific provider and merchant.",
          "商业交互标准可以连接付款系统；是否接受稳定币，要核实具体服务商与商户。",
        ),
        "acp-launch",
      ),
      relation: "extension",
    },
    task: text(
      "Choose an item in an agent interface, review checkout and confirm the purchase.",
      "在智能体界面选择商品、查看结账信息，再确认购买。",
    ),
    controls: [
      fact(
        text("Review before purchase", "购买前查看订单"),
        text(
          "The published launch flow has the buyer review and confirm checkout.",
          "发布介绍中的流程包括买家查看并确认结账内容。",
        ),
        "acp-launch",
      ),
      fact(
        text("Merchant retains order responsibility", "商户仍负责订单"),
        text(
          "The seller retains control of acceptance and fulfilment; an agent is not a substitute for the merchant.",
          "商户保留交易接受与履约职责；智能体不是商户的替代者。",
        ),
        "acp-launch",
      ),
    ],
    flow: [
      fact(
        text("Discover", "发现商品"),
        text(
          "An agent helps the buyer find items.",
          "智能体帮助买家寻找商品。",
        ),
        "acp-launch",
      ),
      fact(
        text("Build checkout", "生成结账信息"),
        text(
          "The merchant and agent exchange checkout data.",
          "商户与智能体交换结账信息。",
        ),
        "acp-spec",
      ),
      fact(
        text("Confirm", "用户确认"),
        text(
          "The buyer confirms and the payment provider supplies a scoped credential.",
          "买家确认，由付款服务商提供受限凭据。",
        ),
        "acp-launch",
      ),
      fact(
        text("Accept and fulfil", "商户接受并交付"),
        text(
          "The merchant accepts or rejects the transaction and handles the order.",
          "商户接受或拒绝交易，并处理订单。",
        ),
        "acp-launch",
      ),
    ],
    history: [
      event(
        "2025-09-29",
        text("Announcement", "发布"),
        text("OpenAI and Stripe introduce ACP", "OpenAI 与 Stripe 介绍 ACP"),
        text(
          "A common checkout model is released for agentic commerce.",
          "为智能体商业交互提出共同的结账模型。",
        ),
        "acp-launch",
      ),
      event(
        "2026-04-17",
        text("Dated specification", "日期版本"),
        text("A later specification directory", "后续日期版本规范"),
        text(
          "The repository includes this dated version alongside earlier versions and unreleased work; a directory is not adoption evidence.",
          "仓库包含该日期版本、早期版本及未发布内容；版本目录不能证明采用规模。",
        ),
        "acp-spec",
      ),
      event(
        REVIEWED_AT,
        text("Maintainers checked", "维护者核查"),
        text(
          "Meta appears in the lead maintainer list",
          "主要维护者名单列有 Meta",
        ),
        text(
          "This records a maintainer role, not Facebook product rollout.",
          "这是维护角色记录，不代表 Facebook 产品已全面上线。",
        ),
        "acp-maintainers",
      ),
    ],
    actors: [
      {
        name: "OpenAI",
        role: text("Co-developer / maintainer", "共同开发／维护"),
        url: "https://agenticcommerce.dev/",
      },
      {
        name: "Stripe",
        role: text("Co-developer / maintainer", "共同开发／维护"),
        url: "https://stripe.com/",
      },
      {
        name: "Meta",
        role: text("Lead maintainer listed", "名单列明的主要维护者"),
        url: "https://about.meta.com/",
      },
      {
        name: "Merchant",
        role: text("Order, acceptance and fulfilment", "订单、接受交易与履约"),
        nameZh: "商户",
      },
    ],
    evidence: [
      fact(
        text(
          "The launch described a consumer checkout",
          "发布时介绍了消费者结账场景",
        ),
        text(
          "Stripe's dated announcement describes the original purchase experience. Current availability must be checked with the product, not inferred from the 2025 launch.",
          "Stripe 的历史公告介绍了当时的购买体验；当前可用范围须另查产品，不能沿用 2025 年发布状态。",
        ),
        "acp-launch",
      ),
    ],
    risks: [
      fact(
        text("Who delivers and handles returns?", "谁交付商品、处理退货？"),
        text(
          "Checkout interoperability does not remove merchant fulfilment or payment-provider terms.",
          "结账互通不会取消商户的履约责任或付款服务商条款。",
        ),
        "acp-launch",
      ),
      fact(
        text("Which version does the integration use?", "接入使用哪个版本？"),
        text(
          "Compare the integration with a dated specification, not unreleased repository changes.",
          "接入应对应明确日期版本，而不是仓库尚未发布的改动。",
        ),
        "acp-spec",
      ),
    ],
    resources: ["acp-spec", "acp-maintainers", "acp-launch"],
    authorization: text(
      "Buyer confirmation in the launch flow",
      "发布流程中由买家确认",
    ),
    rails: text("Depends on the payment integration", "取决于付款系统接入"),
    access: text(
      "Public specifications; product onboarding varies",
      "规范公开；产品接入条件另查",
    ),
  },
  {
    id: "amp",
    name: "AMP",
    fullName: "Agentic Mobile Protocol",
    owner: text("Ant International", "蚂蚁国际"),
    layers: ["authorization", "settlement"],
    kind: text("Mobile payment protocol", "移动支付协议"),
    purpose: text(
      "Connect agent shopping to mobile wallets and acquiring networks.",
      "连接智能体购物、移动钱包与收单网络。",
    ),
    stage: text("Open source & partner rollout", "开源及伙伴推进"),
    version: text("Public repository", "公开仓库"),
    stablecoin: {
      ...fact(
        text(
          "Wallet integration is not proof of stablecoin settlement",
          "钱包接入不等于稳定币结算",
        ),
        text(
          "The reviewed samples focus on mobile payment roles. A specific stablecoin asset or settlement path is not established by those samples.",
          "本轮核对的示例侧重移动支付角色，不能据此确认具体稳定币资产或结算路径。",
        ),
        "amp-code",
      ),
      relation: "unverified",
    },
    task: text(
      "Let an agent prepare a purchase and authorize payment through a mobile wallet arrangement.",
      "让智能体准备购买，再通过移动钱包相关安排授予付款权限。",
    ),
    controls: [
      fact(
        text("Two reference scenarios", "两类参考场景"),
        text(
          "The repository includes human-present and human-not-present samples.",
          "仓库提供用户在场和不在场的参考示例。",
        ),
        "amp-code",
      ),
      fact(
        text(
          "Check limits within the mandate lifecycle",
          "在授权流程中检查限制",
        ),
        text(
          "The sample mandate service validates constraints and updates the budget state.",
          "示例中的授权服务验证条件并更新预算状态。",
        ),
        "amp-code",
      ),
    ],
    flow: [
      fact(
        text("Prepare the order", "准备订单"),
        text(
          "The shopping agent works with the merchant.",
          "购物智能体与商户交互。",
        ),
        "amp-code",
      ),
      fact(
        text("Obtain authorization", "获得授权"),
        text(
          "Credential and wallet roles handle user authorization.",
          "凭据与钱包相关角色处理用户授权。",
        ),
        "amp-code",
      ),
      fact(
        text("Route payment", "路由付款"),
        text(
          "The acquirer and network coordinate the request.",
          "收单方与网络协调付款请求。",
        ),
        "amp-code",
      ),
      fact(
        text("Record the outcome", "记录结果"),
        text(
          "The reference interface shows authorization and transaction evidence.",
          "参考界面展示授权及交易证据。",
        ),
        "amp-code",
      ),
    ],
    history: [
      event(
        "2026-04-28",
        text("Announcement", "发布"),
        text("AMP introduced", "AMP 发布"),
        text(
          "Ant International announces an open-sourced mobile agent payment protocol.",
          "蚂蚁国际宣布开源的移动智能体支付协议。",
        ),
        "amp-launch",
      ),
      event(
        "2026-09-11",
        text("Partner announcement", "伙伴公告"),
        text(
          "Wallet and acquirer rollout; KYA collaboration",
          "钱包与收单推进；KYA 合作",
        ),
        text(
          "The announcement adds ecosystem rollout and collaboration on agent identity interoperability.",
          "公告介绍生态推进及智能体身份互操作合作。",
        ),
        "amp-rollout",
      ),
    ],
    actors: [
      {
        name: "Ant International",
        nameZh: "蚂蚁国际",
        role: text("Protocol initiator", "协议发起方"),
        url: "https://www.ant-intl.com/",
      },
      {
        name: "Alipay+",
        role: text(
          "Network and mandate roles in the sample",
          "示例中的网络及授权角色",
        ),
        url: "https://www.alipayplus.com/",
      },
      {
        name: "Mobile Payment Provider",
        nameZh: "移动支付服务商",
        role: text("User authorization and payment", "用户授权与付款"),
      },
      {
        name: "Acquirer",
        nameZh: "收单方",
        role: text("Merchant-side payment routing", "商户侧付款路由"),
      },
    ],
    evidence: [
      fact(
        text(
          "10 wallets and 7 acquirers in the announcement",
          "公告中的 10 家钱包与 7 家收单伙伴",
        ),
        text(
          "Ant International reported these phase-one partners in September 2026. Partner coverage is not a count of users making agent payments.",
          "蚂蚁国际于 2026 年 9 月披露第一阶段伙伴；伙伴覆盖不是使用智能体付款的用户数量。",
        ),
        "amp-rollout",
      ),
    ],
    risks: [
      fact(
        text("Which party checks the budget?", "谁检查预算？"),
        text(
          "The sample identifies a mandate service. Production operators must confirm where constraints are checked and recorded.",
          "示例设有授权服务；生产接入仍应确认限制在哪里检查、记录。",
        ),
        "amp-code",
      ),
      fact(
        text(
          "Does partner coverage mean everyone can use it?",
          "有合作伙伴就人人可用吗？",
        ),
        text(
          "The announcement is evidence of collaboration, not universal wallet availability or a published transaction total.",
          "公告证明合作进展，不代表所有钱包用户都可使用，也不是交易总量。",
        ),
        "amp-rollout",
      ),
    ],
    resources: ["amp-code", "amp-launch", "amp-rollout"],
    authorization: text(
      "User-present / absent reference samples",
      "用户在场／不在场参考示例",
    ),
    rails: text("Mobile wallets and acquiring network", "移动钱包与收单网络"),
    access: text(
      "Open source samples; partner integration is separate",
      "示例开源；伙伴接入另行确认",
    ),
  },
  {
    id: "x402",
    name: "x402",
    fullName: "HTTP-native payment standard",
    owner: text(
      "Coinbase-originated · open ecosystem",
      "Coinbase 发起 · 开放生态",
    ),
    layers: ["settlement"],
    kind: text("HTTP payment standard", "HTTP 支付标准"),
    purpose: text(
      "Pay for a resource within the HTTP request flow.",
      "在 HTTP 请求流程中为数据或服务付款。",
    ),
    stage: text("Public docs & implementations", "公开文档与实现"),
    version: text("Current public documentation", "当前公开文档"),
    stablecoin: {
      ...fact(
        text(
          "Explicit stablecoin payment implementations",
          "有明确稳定币支付实现",
        ),
        text(
          "The documentation lists USDC on Base and Ethereum, among other network/asset combinations. Production support also needs a working settlement implementation.",
          "文档列有 Base、Ethereum 上的 USDC 等组合；实际生产支持还需要可运行的结算实现。",
        ),
        "x402-tokens",
      ),
      relation: "implementation",
    },
    task: text(
      "An agent requests a paid API or dataset and pays when the server asks for payment.",
      "智能体请求付费 API 或数据，在服务端要求付款时完成支付。",
    ),
    controls: [
      fact(
        text("A request has a price", "请求有明确价格"),
        text(
          "A payment-required response tells the client how to pay.",
          "要求付款的响应向客户端说明付款条件。",
        ),
        "x402-intro",
      ),
      fact(
        text("Budget control still needs an application", "总预算仍需应用控制"),
        text(
          "Before signing, the agent's application should check the task budget and recipient. A request flow is not a complete personal finance policy.",
          "签名前，智能体应用应检查任务预算与收款对象；请求付款流程不等于完整资金管理制度。",
        ),
        "x402-intro",
      ),
    ],
    flow: [
      fact(
        text("Request", "请求资源"),
        text("The client requests the resource.", "客户端请求资源。"),
        "x402-intro",
      ),
      fact(
        text("Receive 402", "收到付款要求"),
        text(
          "The server returns payment instructions.",
          "服务端返回付款条件。",
        ),
        "x402-intro",
      ),
      fact(
        text("Authorize and settle", "授权并结算"),
        text(
          "The client supplies a payment payload; settlement is verified directly or via a facilitator.",
          "客户端提交付款信息，由服务端或结算协助方验证及结算。",
        ),
        "x402-intro",
      ),
      fact(
        text("Return the service", "返回服务"),
        text(
          "After valid payment, the server returns the requested resource.",
          "有效付款后，服务端返回所请求资源。",
        ),
        "x402-intro",
      ),
    ],
    history: [
      event(
        "2025-05-06",
        text("Announcement", "发布"),
        text(
          "Stablecoins inside HTTP interactions",
          "将稳定币付款引入 HTTP 交互",
        ),
        text(
          "Coinbase introduces x402 for programmatic payments.",
          "Coinbase 发布 x402，用于程序化付款。",
        ),
        "x402-launch",
      ),
      event(
        "2025-09-23",
        text("Governance announcement", "治理公告"),
        text("Foundation plans announced", "宣布基金会计划"),
        text(
          "Coinbase and Cloudflare announce plans for the x402 Foundation.",
          "Coinbase 与 Cloudflare 宣布 x402 Foundation 计划。",
        ),
        "x402-foundation",
      ),
      event(
        REVIEWED_AT,
        text("Documentation checked", "文档核查"),
        text(
          "Network support is distinct from production support",
          "区分协议支持与生产支持",
        ),
        text(
          "Current documentation separates protocol expression, runtime support and a working production settlement path.",
          "当前文档区分协议表达、运行时支持和可运行的生产结算路径。",
        ),
        "x402-tokens",
      ),
    ],
    actors: [
      {
        name: "Coinbase",
        role: text("Initial protocol launch", "早期协议发布"),
        url: "https://www.coinbase.com/",
      },
      {
        name: "Buyer / Agent",
        nameZh: "买家／智能体",
        role: text("Request and authorize payment", "请求资源并授权付款"),
      },
      {
        name: "Service provider",
        nameZh: "服务提供方",
        role: text("Price and deliver the resource", "定价并交付资源"),
      },
      {
        name: "Facilitator",
        nameZh: "付款验证与结算协助方",
        role: text("Verify / settle when used", "使用时承担验证／结算职责"),
      },
    ],
    evidence: [
      fact(
        text("A documented resource-payment flow", "已公开的资源付款流程"),
        text(
          "Official examples cover paid APIs and agent access. This page does not equate protocol requests or on-chain transfers with retail adoption.",
          "官方示例涵盖付费 API 和智能体访问；协议请求或链上转账不直接等于零售采用。",
        ),
        "x402-intro",
      ),
    ],
    risks: [
      fact(
        text("Paid, but no usable response?", "付了款却没有可用响应？"),
        text(
          "The service must define delivery, retry and refund handling. Blockchain settlement alone cannot prove that a useful answer was delivered.",
          "服务需要明确交付、重试和退款安排；链上结算本身不能证明有用的回答已经交付。",
        ),
        "x402-intro",
      ),
      fact(
        text("Which asset and network?", "到底付哪种资产、用哪条链？"),
        text(
          "Check the payment request and production settlement support, not just a protocol's network list.",
          "应核对付款请求及生产结算支持，而不只是协议的网络清单。",
        ),
        "x402-tokens",
      ),
    ],
    resources: ["x402-intro", "x402-tokens", "x402-launch", "x402-foundation"],
    authorization: text(
      "Signed payment payload; task controls are application-specific",
      "签署付款信息；任务控制由应用落实",
    ),
    rails: text(
      "Crypto-native; supported stablecoin implementations",
      "加密原生；有稳定币实现",
    ),
    access: text(
      "Public docs; settlement provider or self-hosting required",
      "文档公开；需结算服务或自建实现",
    ),
  },
  {
    id: "apop",
    name: "APOP",
    fullName: "Agentic Payment Open Protocol",
    owner: text("China UnionPay", "中国银联"),
    layers: ["authorization", "settlement"],
    kind: text("Payment protocol framework", "支付协议框架"),
    purpose: text(
      "Coordinate agent identity, user intent and payment authorization within a payment network.",
      "在支付网络中协调智能体身份、用户意图与付款授权。",
    ),
    stage: text(
      "Production validation; invited partners",
      "生产验证；伙伴受邀接入",
    ),
    version: text("Official framework announcement", "官方框架公告"),
    stablecoin: {
      ...fact(
        text(
          "No confirmed stablecoin path in the cited announcement",
          "所引公告未确认稳定币路径",
        ),
        text(
          "The announcement concerns payment network authorization and use cases, not a named stablecoin settlement implementation.",
          "公告介绍支付网络授权与应用场景，未给出具体稳定币结算实现。",
        ),
        "apop",
      ),
      relation: "unverified",
    },
    task: text(
      "An agent helps arrange a purchase, with the user's confirmed payment flowing through the relevant service.",
      "智能体协助安排购买，经用户确认后由相关服务执行付款。",
    ),
    controls: [
      fact(
        text("A confirmed ticket purchase", "确认后购买机票"),
        text(
          "The announced test included an airline assistant and tester confirmation.",
          "公告中的航空场景包括助手推荐及测试人员确认。",
        ),
        "apop",
      ),
      fact(
        text("Availability is limited", "使用范围有限"),
        text(
          "The announcement describes whitelist functions and invited-partner access.",
          "公告说明相关功能存在白名单范围，接入资料面向受邀伙伴。",
        ),
        "apop",
      ),
    ],
    flow: [
      fact(
        text("Express the task", "提出任务"),
        text(
          "The user communicates a purchase intent to an assistant.",
          "用户向助手表达购买意图。",
        ),
        "apop",
      ),
      fact(
        text("Confirm the choice", "确认方案"),
        text(
          "The announced ticket example includes user confirmation.",
          "公告机票示例包含用户确认。",
        ),
        "apop",
      ),
      fact(
        text("Authorize payment", "授权付款"),
        text(
          "The framework addresses agent and user identity alongside authorization.",
          "框架涉及智能体、用户身份及付款授权。",
        ),
        "apop",
      ),
      fact(
        text("Verify in production", "生产系统验证"),
        text(
          "The announcement records completed validation transactions.",
          "公告记录了已完成的验证交易。",
        ),
        "apop",
      ),
    ],
    history: [
      event(
        "2026-04-02",
        text("Release and validation", "发布与验证"),
        text(
          "Framework and five validation transactions",
          "框架发布及五笔验证交易",
        ),
        text(
          "UnionPay's next-day announcement records production-system validation, not scaled adoption.",
          "银联次日公告记录生产系统验证，不是规模化采用。",
        ),
        "apop",
      ),
    ],
    actors: [
      {
        name: "China UnionPay",
        nameZh: "中国银联",
        role: text(
          "Framework publisher / payment network",
          "框架发布方／支付网络",
        ),
        url: "https://www.unionpay.com/",
      },
      {
        name: "Agent service",
        nameZh: "智能体服务",
        role: text("Interpret the user's task", "理解用户任务"),
      },
      {
        name: "Merchant / payment partners",
        nameZh: "商户／付款合作方",
        role: text("Participate in scenario validation", "参与场景验证"),
      },
    ],
    evidence: [
      fact(
        text(
          "5 production-system validation transactions",
          "5 笔生产系统验证交易",
        ),
        text(
          "The official announcement reports ticketing and other service scenarios; the number measures validation, not customer activity at scale.",
          "官方公告介绍机票等服务场景；该数字衡量验证，不代表规模化客户活动。",
        ),
        "apop",
      ),
    ],
    risks: [
      fact(
        text("Can an ordinary user access it?", "普通用户现在能用吗？"),
        text(
          "Check the specific product's availability; a framework release does not mean universal access.",
          "需要核对具体产品的开放范围；框架发布并不等于所有用户可用。",
        ),
        "apop",
      ),
    ],
    resources: ["apop"],
    authorization: text(
      "Identity and authorization framework; full interface details not obtained",
      "身份与授权框架；本轮未取得完整接口细节",
    ),
    rails: text("UnionPay payment-network scenarios", "银联支付网络场景"),
    access: text(
      "Documentation and sandbox for invited partners",
      "文档与沙箱面向受邀伙伴",
    ),
  },

  {
    id: "ucp",
    name: "UCP",
    fullName: "Universal Commerce Protocol",
    owner: text(
      "Google, Shopify & ecosystem contributors",
      "Google、Shopify 与生态贡献者",
    ),
    layers: ["commerce"],
    kind: text("Commerce interoperability standard", "商业互操作标准"),
    purpose: text(
      "Give agents and merchants a shared language from discovery to order management.",
      "为智能体与商户提供从商品发现到订单管理的共同语言。",
    ),
    stage: text(
      "Public specifications & governance updates",
      "公开规范与治理更新",
    ),
    version: text("Versioned specification", "日期版本规范"),
    stablecoin: {
      ...fact(
        text(
          "Commerce can connect to payment mechanisms",
          "商业交互可连接支付机制",
        ),
        text(
          "UCP is compatible with AP2. This does not make every UCP checkout a stablecoin payment.",
          "UCP 可与 AP2 配合，但这不意味着每笔 UCP 订单都使用稳定币。",
        ),
        "ucp-launch",
      ),
      relation: "extension",
    },
    task: text(
      "An agent discovers products, works with a merchant checkout and follows the order's progress.",
      "智能体发现商品、与商户结账流程交互，并跟进订单。",
    ),
    controls: [
      fact(
        text("Separate commerce and payment", "区分商业交互与付款"),
        text(
          "Product discovery and checkout are not the same thing as payment authorization or settlement.",
          "商品发现及结账，与付款授权及结算不是同一层功能。",
        ),
        "ucp-launch",
      ),
    ],
    flow: [
      fact(
        text("Discover capabilities", "发现能力"),
        text(
          "The business exposes supported capabilities.",
          "商户公开其支持的能力。",
        ),
        "ucp",
      ),
      fact(
        text("Build checkout", "准备结账"),
        text(
          "The agent and business exchange checkout information.",
          "智能体与商户交换结账信息。",
        ),
        "ucp",
      ),
      fact(
        text("Connect payment", "连接付款"),
        text(
          "Payment arrangements work alongside the commerce flow.",
          "付款安排与商业流程配合。",
        ),
        "ucp-launch",
      ),
      fact(
        text("Manage the order", "管理订单"),
        text(
          "The commerce model includes order-related interaction.",
          "商业模型包括订单相关交互。",
        ),
        "ucp",
      ),
    ],
    history: [
      event(
        "2026-01-11",
        text("Release", "发布"),
        text("A shared commerce protocol", "共同商业交互协议"),
        text(
          "The initial release connects commerce surfaces, businesses and payment providers.",
          "初始发布连接商业界面、商户与付款服务商。",
        ),
        "ucp-launch",
      ),
      event(
        "2026-04-08",
        text("Version update", "版本更新"),
        text("v2026-04-08 announced", "公布 v2026-04-08"),
        text(
          "The official announcements record a subsequent version; implementation must use matching release notes.",
          "官方公告记录后续版本；接入需对应具体发布说明。",
        ),
        "ucp-history",
      ),
      event(
        "2026-04-28",
        text("Governance update", "治理更新"),
        text("Stripe joins the Governing Council", "Stripe 加入治理委员会"),
        text(
          "This changes governance participation, not a payment-volume metric.",
          "这是治理参与变化，不是付款量指标。",
        ),
        "ucp-history",
      ),
    ],
    actors: [
      {
        name: "Google",
        role: text("Co-developer", "共同开发方"),
        url: "https://ucp.dev/",
      },
      {
        name: "Shopify",
        role: text("Co-developer", "共同开发方"),
        url: "https://www.shopify.com/ucp",
      },
      {
        name: "Merchant",
        role: text(
          "Offer commerce capabilities and fulfil orders",
          "提供商业能力并履约",
        ),
        nameZh: "商户",
      },
    ],
    evidence: [
      fact(
        text(
          "Specification releases and ecosystem governance",
          "规范发布与生态治理",
        ),
        text(
          "Official release records show technical and governance progress. This page does not infer shopper adoption from membership.",
          "官方记录展示技术及治理进展；成员加入不直接证明消费者采用。",
        ),
        "ucp-history",
      ),
    ],
    risks: [
      fact(
        text("Compatible means already integrated?", "兼容就等于已经接入？"),
        text(
          "A compatible design still needs working merchant, agent and payment implementations.",
          "兼容设计仍需可运行的商户、智能体及付款实现。",
        ),
        "ucp-launch",
      ),
    ],
    resources: ["ucp", "ucp-history", "ucp-launch"],
    authorization: text(
      "Commerce layer; payment authorization is complementary",
      "商业交互层；付款授权由相关机制配合",
    ),
    rails: text(
      "Depends on the actual payment integration",
      "取决于实际付款接入",
    ),
    access: text(
      "Public versioned docs; platform availability differs",
      "日期版本文档公开；平台可用范围不同",
    ),
  },
];

export type PaymentScenario = {
  id: string;
  title: PaymentText;
  eyebrow: PaymentText;
  task: PaymentText;
  control: PaymentText;
  funding: PaymentFact;
  steps: PaymentFact[];
  protocols: string[];
  questions: PaymentFact[];
};
export const PAYMENT_SCENARIOS: PaymentScenario[] = [
  {
    id: "shopping",
    title: text("Shop / book a trip", "购物与订票"),
    eyebrow: text("Personal task", "个人任务"),
    task: text(
      "Find a suitable ticket; show me the final price before paying.",
      "找一张合适的机票，付款前让我确认最终价格。",
    ),
    control: text(
      "Confirm the item, final price and recipient. Delegated purchases need explicit limits.",
      "确认购买内容、最终价格和收款对象；委托执行时须明确限制。",
    ),
    funding: fact(
      text(
        "The user need not always hold stablecoins",
        "用户不一定需要持有稳定币",
      ),
      text(
        "Cards and wallets can also fund agent purchases. An AP2/x402 sample illustrates a stablecoin-related path, not universal ticket acceptance.",
        "卡与钱包也可用于智能体购买；AP2/x402 示例展示相关路径，不代表机票商户普遍接受稳定币。",
      ),
      "ap2-x402",
      "apop",
    ),
    steps: [
      fact(
        text("Set the task", "提出需求"),
        text(
          "Explain the itinerary and price conditions.",
          "说明行程及价格条件。",
        ),
      ),
      fact(
        text("Review the offer", "查看方案"),
        text(
          "Check item details, seller and total price.",
          "核对购买内容、商户及总价。",
        ),
      ),
      fact(
        text("Authorize payment", "授权付款"),
        text(
          "Confirm this purchase or check the agreed constraints.",
          "确认本笔购买，或核对已约定条件。",
        ),
      ),
      fact(
        text("Pay", "完成付款"),
        text(
          "The payment service processes the authorized transaction.",
          "付款服务处理已授权交易。",
        ),
      ),
      fact(
        text("Receive the booking", "收到预订结果"),
        text(
          "Check the booking separately from the payment result.",
          "将预订结果与付款结果分别核对。",
        ),
      ),
    ],
    protocols: ["ap2", "acp", "apop", "ucp"],
    questions: [
      fact(
        text(
          "The price changed. Can it still buy?",
          "价格变了，还能直接购买吗？",
        ),
        text(
          "The application must check whether the new offer remains within the user's permission; AP2 links authorization to the checkout.",
          "应用需要检查新方案是否仍在用户许可内；AP2 将授权与订单关联。",
        ),
        "ap2-spec",
      ),
      fact(
        text("Paid, but no ticket?", "付了款却没有出票？"),
        text(
          "Keep both payment and order evidence. Refund and fulfilment handling depend on the merchant and service terms, not merely the protocol.",
          "保留付款及订单证据；退款与履约处理取决于商户和服务条款，而不只是协议。",
        ),
        "acp-launch",
      ),
    ],
  },
  {
    id: "api",
    title: text("Buy data / API access", "购买数据与 API"),
    eyebrow: text("Digital resource", "数字资源"),
    task: text(
      "Get the data this task needs, without an open-ended spending allowance.",
      "获取任务需要的数据，但不要获得无限制的付款权限。",
    ),
    control: text(
      "Check the provider, per-request price and total task budget before signing a payment.",
      "签署付款前检查服务方、单次价格及任务总预算。",
    ),
    funding: fact(
      text("Stablecoins can be the payment asset", "稳定币可以作为付款资产"),
      text(
        "x402 documents compatible assets such as USDC. The actual request and settlement provider determine the usable network and token.",
        "x402 文档包含 USDC 等兼容资产；实际请求与结算服务决定可用网络及代币。",
      ),
      "x402-tokens",
    ),
    steps: [
      fact(
        text("Request data", "请求数据"),
        text("The agent asks for a resource.", "智能体请求资源。"),
      ),
      fact(
        text("Read the price", "读取价格"),
        text(
          "A payment-required response describes the terms.",
          "要求付款的响应说明条件。",
        ),
        "x402-intro",
      ),
      fact(
        text("Check permission", "检查权限"),
        text(
          "The application checks the budget and requested asset.",
          "应用检查预算及要求的资产。",
        ),
      ),
      fact(
        text("Verify / settle", "核验与结算"),
        text(
          "The server or facilitator processes payment.",
          "服务端或结算协助方处理付款。",
        ),
        "x402-intro",
      ),
      fact(
        text("Receive data", "收到数据"),
        text(
          "Check that a usable response was delivered.",
          "确认收到可用响应。",
        ),
      ),
    ],
    protocols: ["x402", "ap2"],
    questions: [
      fact(
        text("Will a retry charge me again?", "重新请求会再扣款吗？"),
        text(
          "The application and provider need clear retry and duplicate-payment rules. Do not assume every retry is free.",
          "应用与服务方需要明确重试及重复付款规则，不能默认重试免费。",
        ),
        "x402-intro",
      ),
      fact(
        text("Are network fees the whole cost?", "网络费用就是全部成本吗？"),
        text(
          "Consider resource price, network costs and provider terms together. A protocol's fee claim is not the final price of a service.",
          "需要合看资源价格、网络成本及服务条款；协议费用描述不等于服务最终价格。",
        ),
        "x402-tokens",
      ),
    ],
  },
  {
    id: "business",
    title: text("Procure business services", "企业采购服务"),
    eyebrow: text("Business user", "企业用户"),
    task: text(
      "Purchase approved services within a team's spending policy.",
      "按照团队预算规则采购已批准的服务。",
    ),
    control: text(
      "Specify suppliers, approval limits, account access and reconciliation requirements.",
      "明确供应商、审批额度、账户权限及对账要求。",
    ),
    funding: fact(
      text("Choose a payment route for the task", "按任务选择付款路径"),
      text(
        "Business payments may use several rails. Stablecoins are one possible implementation, not a requirement for delegated purchasing.",
        "企业付款可采用多种渠道；稳定币是可能实现之一，不是委托采购的必要条件。",
      ),
      "waller",
    ),
    steps: [
      fact(
        text("Approve suppliers", "批准供应商"),
        text(
          "Define which vendors the agent may use.",
          "规定智能体可使用哪些供应商。",
        ),
      ),
      fact(
        text("Set limits", "设置限制"),
        text(
          "Define task and account-level spending rules.",
          "规定任务及账户级支出规则。",
        ),
      ),
      fact(
        text("Verify the order", "核验订单"),
        text(
          "Check that the order follows the approval policy.",
          "检查订单符合审批规则。",
        ),
      ),
      fact(
        text("Execute payment", "执行付款"),
        text(
          "Use the selected payment service and account permissions.",
          "使用选定的付款服务及账户权限。",
        ),
      ),
      fact(
        text("Reconcile", "对账"),
        text(
          "Match the service, invoice and payment evidence.",
          "对应服务、发票及付款证据。",
        ),
      ),
    ],
    protocols: ["ap2", "amp", "x402"],
    questions: [
      fact(
        text(
          "Who is responsible for an incorrect purchase?",
          "采购错了由谁负责？",
        ),
        text(
          "Define approvals and responsibility before deployment. Technical evidence helps investigation but is not a complete liability agreement.",
          "上线前应明确审批及责任；技术证据有助调查，但不等于完整责任约定。",
        ),
        "waller",
      ),
      fact(
        text(
          "Can existing wallets and acquiring systems be reused?",
          "能否衔接现有钱包和收单系统？",
        ),
        text(
          "AMP's samples expose those roles. A specific production integration still needs operator confirmation.",
          "AMP 示例展示这些角色；具体生产接入仍需运营方确认。",
        ),
        "amp-code",
      ),
    ],
  },
];

export const ECOSYSTEM_ENTRIES = [
  {
    name: "Google",
    role: text("Authorization & commerce standards", "授权与商业交互标准"),
    protocols: ["ap2", "ucp"],
    note: text(
      "AP2 and UCP address different parts of the same purchase journey.",
      "AP2 与 UCP 负责购买流程中的不同部分。",
    ),
    source: "ucp-launch",
    url: "https://developers.googleblog.com/",
  },
  {
    name: "Meta / Facebook",
    role: text("ACP maintainer role", "ACP 维护角色"),
    protocols: ["acp"],
    note: text(
      "Meta is listed as a lead maintainer; Facebook product adoption needs separate evidence.",
      "Meta 列于主要维护者名单；Facebook 产品采用需另有证据。",
    ),
    source: "acp-maintainers",
    url: "https://about.meta.com/",
  },
  {
    name: "Ant International / 蚂蚁国际",
    role: text("Mobile wallets & acquiring ecosystem", "移动钱包与收单生态"),
    protocols: ["amp"],
    note: text(
      "AMP connects wallet and acquiring roles; announced partner coverage is not payment volume.",
      "AMP 连接钱包与收单角色；公布的伙伴覆盖不是付款量。",
    ),
    source: "amp-rollout",
    url: "https://www.ant-intl.com/",
  },

  {
    name: "China UnionPay / 中国银联",
    role: text("Payment network framework", "支付网络框架"),
    protocols: ["apop"],
    note: text(
      "The official announcement documents production validation and invited-partner access.",
      "官方公告记录生产验证及受邀伙伴接入。",
    ),
    source: "apop",
    url: "https://www.unionpay.com/",
  },
  {
    name: "Coinbase",
    role: text("HTTP-native payments", "HTTP 原生支付"),
    protocols: ["x402"],
    note: text(
      "Coinbase introduced x402 for internet-native stablecoin payments.",
      "Coinbase 发布 x402，用于互联网原生稳定币付款。",
    ),
    source: "x402-launch",
    url: "https://www.coinbase.com/",
  },
  {
    name: "X / Twitter",
    role: text("Payment product", "支付产品"),
    protocols: [] as string[],
    note: text(
      "X Money is a payment product. It is not x402; an independent agent payment specification has not been verified here.",
      "X Money 是支付产品，不是 x402；本轮未核实其独立智能体付款规范。",
    ),
    source: "x-money",
    url: "https://money.x.com/en",
  },
  {
    name: "Visa",
    role: text("Agent trust & identification", "智能体信任与识别"),
    protocols: [] as string[],
    note: text(
      "Trusted Agent Protocol provides an agent-identification entry point; its role is distinct from settlement.",
      "Trusted Agent Protocol 提供智能体识别资料入口，职责不同于结算。",
    ),
    source: "visa-tap",
    url: "https://developer.visa.com/capabilities/trusted-agent-protocol",
  },
  {
    name: "Mastercard",
    role: text("Agent payment network capabilities", "智能体支付网络能力"),
    protocols: [] as string[],
    note: text(
      "Agent Pay is presented as network/product capabilities, not relabelled as an equivalent open protocol.",
      "Agent Pay 按网络及产品能力介绍，不重新命名为同层级开放协议。",
    ),
    source: "mastercard",
    url: "https://www.mastercard.com/",
  },
];

export const getProtocol = (id: string) =>
  AGENT_PROTOCOLS.find((item) => item.id === id);
export const getSource = (id: string) =>
  PAYMENT_SOURCES.find((item) => item.id === id);
