import { usePaymentText, PaymentCitation } from "./agentic-payment-ui";

/** AGT-D01: semantic text remains readable; only connectors/icons are SVG. No scaled artwork. */
export function AgenticPaymentStack() {
  const { t } = usePaymentText();
  const layers = [
    [
      "Intent",
      "用户意图",
      "Define the task and budget",
      "明确任务、预算与期限",
      "User / enterprise intent",
      "用户／企业意图",
    ],
    [
      "Agent & commerce",
      "智能体与商业交互",
      "Prepare the order or request",
      "准备订单或服务请求",
      "Product surface · service / commerce",
      "产品入口 · 服务／商业交互",
    ],
    [
      "Trust & authorization",
      "信任与授权",
      "Check identity and permission",
      "核对身份与授权条件",
      "Identity / trust · delegated authority",
      "身份／信任 · 委托权限",
    ],
    [
      "Payment",
      "付款执行",
      "Use the permitted credential and rail",
      "使用获准凭据与支付轨道",
      "Payment execution · payment rail",
      "付款执行 · 支付轨道",
    ],
    [
      "Settlement & evidence",
      "结算与证据",
      "Record settlement, receipt and dispute evidence",
      "记录结算、回执与争议证据",
      "Settlement · receipt / audit / dispute",
      "结算 · 回执／审计／争议",
    ],
  ];
  return (
    <figure
      data-figure="AGT-D01"
      aria-labelledby="agt-stack-title"
      className="my-8 border-y border-border py-6"
    >
      <figcaption
        id="agt-stack-title"
        className="mb-5 font-serif text-xl font-semibold"
      >
        {t(
          "From intent to settlement: the payment stack",
          "从意图到结算：智能体支付栈",
        )}
      </figcaption>
      <ol className="grid gap-3 lg:grid-cols-5">
        {layers.map(([en, zh, descEn, descZh, detailEn, detailZh], i) => (
          <li
            key={en}
            className="relative grid grid-cols-[1.5rem_1fr] gap-3 border-l-2 border-primary/40 py-2 pl-3 lg:block lg:border-l-0 lg:border-t-2 lg:px-0 lg:pt-4"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="text-primary lg:mb-3"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
              />
              <text
                x="12"
                y="16"
                textAnchor="middle"
                fill="currentColor"
                fontSize="12"
              >
                {i + 1}
              </text>
            </svg>
            <div>
              <h3 className="text-sm font-semibold leading-6">{t(en, zh)}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t(descEn, descZh)}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t(detailEn, detailZh)}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border py-3 text-xs">
        <strong>{t("Payment rails", "支付轨道")}</strong>
        {[
          t("Card / bank", "银行卡／银行账户"),
          t("Wallet / APM", "钱包／替代支付方式"),
          t("Stablecoin / blockchain", "稳定币／区块链"),
        ].map((v) => (
          <span key={v}>{v}</span>
        ))}
      </div>
      <p className="mt-4 text-xs leading-6 text-muted-foreground">
        {t(
          "Conceptual layers, not a universal wire sequence. Commerce: UCP / ACP; authorization: AP2 / ACT / AMP / APOP; machine payment: x402 / MPP. A402 is a method within Machine Pay. A stablecoin is one rail, not the whole stack. A receipt does not guarantee delivery or a refund.",
          "这是概念分层，不是所有协议统一的报文顺序。商业交互：UCP／ACP；授权：AP2／ACT／AMP／APOP；机器付款：x402／MPP。A402 是 Machine Pay 内的方法。稳定币只是一条轨道，不是整个支付栈；回执不保证履约或退款。",
        )}
        <PaymentCitation
          ids={[
            "SRC-AP2-02",
            "SRC-UCP-02",
            "SRC-ACP-03",
            "SRC-X402-01",
            "SRC-MPP-01",
            "SRC-A402-02",
          ]}
        />
      </p>
    </figure>
  );
}
