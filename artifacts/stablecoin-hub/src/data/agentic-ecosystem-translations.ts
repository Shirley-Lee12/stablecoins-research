/** Faithful Chinese labels for the retained 2026-10-15 ecosystem snapshot. */
export const ECO_ZH: Record<string, [string, string, string, string]> = {
  google: [
    "协议制定与 AI／商业入口",
    "AP2；UCP",
    "Gemini／Google 商业入口；与既有支付方式集成",
    "AP2 可兼容稳定币，UCP 为间接关联",
  ],
  "openai-stripe": [
    "AI 入口、商业集成与支付基础设施",
    "ACP；MPP（Stripe 与 Tempo）",
    "Instant Checkout；Stripe 工具；商户 PSP 与 Shared Payment Tokens",
    "MPP 直接关联；ACP 间接关联，支付方式依协议而异",
  ],
  x402: [
    "互联网原生机器付款标准",
    "x402",
    "Facilitator／SDK 生态；HTTP 原生付款协调",
    "稳定币直接关联；中立开放治理",
  ],
  alipay: [
    "消费钱包、AI 商业与商户支付",
    "ACT；Machine Pay 内 A402 方法",
    "Agent Pay／Machine Pay／AI Wallet／Vibe Pay／Skill Pay／Token Pay；支付宝账户与风控基础设施",
    "尚无已核实的稳定币直接关联",
  ],
  "ant-international": [
    "钱包互操作与全球商户支付基础设施",
    "AMP",
    "Antom／AgentSafePay／AFA／EasySafePay；Alipay+ 钱包与替代支付方式",
    "AMP 结算资产未知；WhaleRTP 的代币化存款不等于稳定币",
  ],
  unionpay: [
    "卡网络信任、身份与授权框架",
    "APOP；AVOP",
    "智能银行卡／Payment Skills；卡与银行网络",
    "尚无已核实的稳定币直接关联；生产系统验证与推广",
  ],
  jd: [
    "电商、自有支付与企业智能体",
    "未发现独立公开的智能体支付协议",
    "京东AI购／京东AI付／JoyAgent；卡、余额、白条、银行与二维码轨道",
    "生产产品不等于独立协议；尚无稳定币直接关联",
  ],
  meta: [
    "个人／商户智能体与安全凭据集成",
    "未发现独立公开的智能体支付协议",
    "Muse／Meta Business Agent／WhatsApp Business AI；Stripe Link 一次性卡、UPI，已公布 Shop Pay",
    "产品推广不等于独立协议；尚无稳定币直接关联",
  ],
  "x-xai": [
    "智能体与平台原生金融账户",
    "未发现独立公开的智能体支付协议",
    "Grok Bot／X Money；Cross River 储值、Visa X Card、ACH 与 Stripe Link",
    "面向部分用户／推广；尚无稳定币直接关联",
  ],
};
