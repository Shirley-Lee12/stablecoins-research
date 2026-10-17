export type MetadataCopy = readonly [en: string, zh: string];
type Entry = { title: MetadataCopy; description: MetadataCopy };
export const PUBLIC_PAGE_METADATA: Record<string, Entry> = {
  "/": {
    title: ["Home", "首页"],
    description: [
      "Explore stablecoin mechanisms, research, regulation and market evidence.",
      "浏览稳定币机制、研究、监管与市场证据。",
    ],
  },
  "/dashboard": {
    title: ["Dashboard", "数据仪表盘"],
    description: [
      "Inspect stablecoin signals with their sources, dates and coverage.",
      "查看稳定币信号及其来源、日期与覆盖范围。",
    ],
  },
  "/research": {
    title: ["Our Research", "我们的研究"],
    description: [
      "Explore the AI-DEFIT 2026 conceptual study and its future research directions.",
      "了解 AI-DEFIT 2026 概念研究及其未来研究方向。",
    ],
  },
  "/quantitative": {
    title: ["Stablecoin Risk Framework", "稳定币风险框架"],
    description: [
      "Explore the conference framework, atomic risks and two complementary mappings.",
      "了解会议研究框架、原子风险与两个互补映射。",
    ],
  },
  "/quantitative/dimension-a": {
    title: ["Lifecycle Mapping (T0–T3)", "生命周期映射（T0–T3）"],
    description: [
      "Explore the lifecycle locations used in the conference risk framework.",
      "了解会议风险框架中的生命周期位置。",
    ],
  },
  "/quantitative/dimension-b": {
    title: [
      "Amplification & Transmission Mapping (L0–L3)",
      "放大与传导映射（L0–L3）",
    ],
    description: [
      "Explore trigger, vulnerability, amplification and transmission roles.",
      "了解触发、脆弱性、放大与传导角色。",
    ],
  },
  "/about-stablecoins": {
    title: ["About Stablecoins", "关于稳定币"],
    description: [
      "Understand stablecoin backing, issuance, circulation and redemption.",
      "了解稳定币支撑、发行、流通与赎回。",
    ],
  },
  "/about-stablecoins/history": {
    title: ["Stablecoin History", "稳定币发展历程"],
    description: [
      "Explore the evolution of stablecoin mechanisms and institutions.",
      "了解稳定币机制与制度的演进。",
    ],
  },
  "/about-stablecoins/types": {
    title: ["Stablecoin Types", "稳定币类别"],
    description: [
      "Compare stablecoin mechanisms and their boundaries.",
      "比较稳定币机制及其边界。",
    ],
  },
  "/about-stablecoins/applications": {
    title: ["Stablecoin Applications", "稳定币应用"],
    description: [
      "Distinguish stablecoin applications from evidence of adoption.",
      "区分稳定币应用场景与实际采用证据。",
    ],
  },
  "/about-stablecoins/regulatory-evolution": {
    title: ["Regulatory Evolution", "监管演进"],
    description: [
      "Explore the evolution of stablecoin regulatory approaches.",
      "了解稳定币监管思路的演进。",
    ],
  },
  "/agentic-payments": {
    title: ["Agentic Payments", "智能体支付"],
    description: [
      "Explore agent authorisation, payment execution and payment rails.",
      "了解智能体授权、支付执行与支付通道。",
    ],
  },
  "/agentic-payments/protocols": {
    title: ["Protocols & Mechanisms", "协议与机制"],
    description: [
      "Compare the roles of agentic payment protocols and mechanisms.",
      "比较智能体支付协议与机制的角色。",
    ],
  },
  "/agentic-payments/scenarios": {
    title: ["Applications & Risks", "应用与风险"],
    description: [
      "Explore agentic payment scenarios and their risks.",
      "了解智能体支付场景及其风险。",
    ],
  },
  "/agentic-payments/ecosystem": {
    title: ["Ecosystem & Developments", "生态与进展"],
    description: [
      "Explore the roles of protocols, agents, products and payment providers.",
      "了解协议、智能体、产品与支付服务方的角色。",
    ],
  },
  "/regional-developments": {
    title: ["Asia Stablecoin Development", "亚洲稳定币发展"],
    description: [
      "Compare regional stablecoin pathways, products and access boundaries.",
      "比较亚洲稳定币路径、产品与准入边界。",
    ],
  },
  "/mainland-china": {
    title: ["Mainland China", "中国内地"],
    description: [
      "Explore the digital-money pathway and institutional boundaries in mainland China.",
      "了解中国内地的数字货币路径与制度边界。",
    ],
  },
  "/hong-kong": {
    title: ["Hong Kong", "中国香港"],
    description: [
      "Explore Hong Kong stablecoin licensing, issuance and product access.",
      "了解香港稳定币发牌、发行与产品准入。",
    ],
  },
  "/singapore": {
    title: ["Singapore", "新加坡"],
    description: [
      "Explore Singapore stablecoin products and regulatory boundaries.",
      "了解新加坡稳定币产品与监管边界。",
    ],
  },
  "/uae": {
    title: ["United Arab Emirates", "阿联酋"],
    description: [
      "Explore stablecoin products across the UAE regulatory perimeters.",
      "了解阿联酋不同监管边界下的稳定币产品。",
    ],
  },
  "/market-data": {
    title: ["Market Data", "市场数据"],
    description: [
      "Explore supply, on-chain activity, issuer disclosures, macro data and adoption evidence.",
      "浏览供应、链上活动、发行方披露、宏观数据与采用证据。",
    ],
  },
  "/market-data/market": {
    title: ["Stablecoin Market", "稳定币市场"],
    description: [
      "Inspect stablecoin supply, price stability and selected trading liquidity.",
      "查看稳定币供应、价格稳定与选定交易流动性。",
    ],
  },
  "/market-data/on-chain": {
    title: ["On-chain Data", "链上数据"],
    description: [
      "Distinguish tracked supply, transfers and payment-adoption evidence.",
      "区分追踪供应、链上转移与支付采用证据。",
    ],
  },
  "/market-data/issuers-reserves": {
    title: ["Issuers & Reserves", "发行方与储备"],
    description: [
      "Compare issuer disclosure scopes and redemption information.",
      "比较发行方披露范围与赎回信息。",
    ],
  },
  "/market-data/macro": {
    title: ["Macro Context", "宏观环境"],
    description: [
      "Inspect macroeconomic series with source dates and definitions.",
      "查看宏观序列及其来源日期与定义。",
    ],
  },
  "/market-data/adoption": {
    title: ["Adoption", "采用"],
    description: [
      "Inspect dated stablecoin adoption evidence and sample boundaries.",
      "查看带日期的稳定币采用证据与样本边界。",
    ],
  },
  "/regulatory": {
    title: ["Regulatory Overview", "监管概览"],
    description: [
      "Compare stablecoin legal stages, safeguards and official sources.",
      "比较稳定币法律阶段、保障要求与官方来源。",
    ],
  },
  "/academic-resources": {
    title: ["Stablecoin Research Library", "稳定币研究资源库"],
    description: [
      "Find public stablecoin research by title, author, theme and evidence type.",
      "按标题、作者、主题与证据类型查找公开稳定币研究资料。",
    ],
  },
  "/experts": {
    title: ["Researchers & Institutions", "研究者与机构"],
    description: [
      "Browse verified public research profiles and publication-time affiliations.",
      "浏览已核验的公开研究档案与发表时机构记录。",
    ],
  },
  "/connector": {
    title: ["Browser Capture Tool", "浏览器采集工具"],
    description: [
      "Download the research connector and review its capture workflow.",
      "下载研究采集工具并了解采集流程。",
    ],
  },
  "/connector/authorize": {
    title: ["Connect Browser", "连接浏览器"],
    description: [
      "Review browser-connection authorisation for your account.",
      "查看账户的浏览器连接授权。",
    ],
  },
  "/reset-password": {
    title: ["Reset Password", "重置密码"],
    description: [
      "Reset your account password using a valid reset link.",
      "通过有效重置链接重置账户密码。",
    ],
  },
  "/verify-email": {
    title: ["Verify Email", "验证邮箱"],
    description: [
      "Review email verification for your account.",
      "查看账户邮箱验证。",
    ],
  },
  "/profile": {
    title: ["My Profile", "个人资料"],
    description: ["Review your account profile.", "查看并管理你的账户个人资料。"],
  },
  "/change-password": {
    title: ["Change Password", "修改密码"],
    description: ["Manage your account password.", "查看并管理你的账户密码。"],
  },
  "/my-contributions": {
    title: ["My Contributions", "我的贡献"],
    description: [
      "Review your research-resource contributions.",
      "查看提交的研究资源。",
    ],
  },
  "/admin": {
    title: ["Admin Center", "管理中心"],
    description: [
      "Account administration for authorised administrators.",
      "供已获授权管理员使用的账户管理。",
    ],
  },
};
const MECHANISMS: Record<string, MetadataCopy> = {
  "fiat-backed": ["Fiat-reserve-backed", "法币储备型"],
  "crypto-backed": ["Crypto-collateralised", "加密资产抵押型"],
  synthetic: ["Synthetic / Hedged", "合成 / 对冲型"],
  algorithmic: ["Algorithmic", "算法型"],
  other: ["Hybrid & Boundary", "混合与边界"],
};
export function pageMetadata(pathname: string, language: string) {
  const path = pathname.split(/[?#]/)[0];
  let entry = PUBLIC_PAGE_METADATA[path];
  const mechanism = path.match(/^\/about-stablecoins\/types\/([^/]+)$/)?.[1];
  const protocol = path.match(
    /^\/agentic-payments\/protocols\/(ucp|acp|ap2|act|amp|apop|x402|mpp)$/,
  )?.[1];
  if (mechanism && MECHANISMS[mechanism])
    entry = {
      title: MECHANISMS[mechanism],
      description: [
        "Explore this stablecoin mechanism and its boundaries.",
        "了解这一稳定币机制及其边界。",
      ],
    };
  if (protocol)
    entry = {
      title: [
        protocol === "x402" ? "x402" : protocol.toUpperCase(),
        protocol === "x402" ? "x402" : protocol.toUpperCase(),
      ],
      description: [
        "Explore the role, authorisation model and payment rails of this protocol.",
        "了解该协议的角色、授权模式与支付通道。",
      ],
    };
  if (/^\/authors\/[^/]+$/.test(path))
    entry = {
      title: ["Author Profile", "作者档案"],
      description: [
        "Browse this author's publications in the public research library.",
        "浏览该作者在公开研究资源库中的成果。",
      ],
    };
  const found = Boolean(entry);
  entry ||= {
    title: ["Page not found", "页面未找到"],
    description: [
      "Return home or browse the public research library.",
      "返回首页或浏览公开研究资源库。",
    ],
  };
  const i = language === "zh" ? 1 : 0;
  return {
    title: `${entry.title[i]} | Stablecoin Research Hub`,
    description: entry.description[i],
    found,
  };
}
