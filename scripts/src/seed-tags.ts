import "dotenv/config";
import { db, tagsTable, pool, type InsertTag } from "@workspace/db";
import { sql } from "drizzle-orm";

// Source: docs/roadmap.md Part 3 (T.2 theme seed + T.3 jurisdiction/asset seed).
// Idempotent — re-running inserts missing tags and refreshes the canonical names/definitions.

// Six-group category slugs for the theme facet's folding tree — docs/planning/15 §3.2/§3.3.
const A = "types_mechanisms", B = "stability_risk", C = "regulation_policy", D = "monetary_macro", E = "markets_adoption", F = "tech_infrastructure";

const themeTags: InsertTag[] = [
  // A 类型与机制
  { slug: "fiat-collateralized", nameEn: "Fiat-collateralized", nameZh: "法币抵押型", facet: "theme", definition: "由银行存款、现金或短期国债等法币资产 1:1 储备支持的稳定币,如 USDT、USDC。", region: null, category: A, status: "active" },
  { slug: "crypto-collateralized", nameEn: "Crypto-collateralized", nameZh: "加密资产抵押型", facet: "theme", definition: "由超额抵押的加密资产支持、通过链上机制维持锚定的稳定币,如 DAI。", region: null, category: A, status: "active" },
  { slug: "algorithmic", nameEn: "Algorithmic", nameZh: "算法稳定币", facet: "theme", definition: "不依赖足额储备、靠算法调节供给或套利机制维持锚定的稳定币,如 UST。", region: null, category: A, status: "active" },
  { slug: "synthetic-delta-neutral", nameEn: "Synthetic & delta-neutral", nameZh: "合成型与 Delta-neutral", facet: "theme", definition: "通过衍生品对冲、Delta-neutral 策略或合成资产头寸维持目标价值的稳定币，以 USDe 为代表；与纯算法供给调节型稳定币区分。", region: null, category: A, status: "active" },
  { slug: "hybrid-fractional", nameEn: "Hybrid & fractional-reserve", nameZh: "混合型与部分抵押型", facet: "theme", definition: "组合抵押资产、算法调节或部分储备机制的混合型稳定币设计，如早期 FRAX。", region: null, category: A, status: "active" },
  { slug: "yield-bearing-stablecoins", nameEn: "Yield-bearing stablecoins", nameZh: "收益型稳定币", facet: "theme", definition: "通过储备收益、质押、借贷或协议收入向持有人提供收益的稳定币及其风险；仅讨论普通稳定币利率不归入。", region: null, category: A, status: "active" },
  { slug: "commodity-rwa-backed", nameEn: "Commodity & RWA-backed", nameZh: "商品/RWA 抵押型", facet: "theme", definition: "由黄金、大宗商品或代币化现实世界资产支持的稳定币。", region: null, category: A, status: "active" },
  { slug: "cbdc", nameEn: "CBDC", nameZh: "央行数字货币", facet: "theme", definition: "由中央银行发行的数字法币,及其与稳定币的关系与竞争。", region: null, category: A, status: "active" },
  { slug: "tokenized-deposits-mmf", nameEn: "Tokenized deposits & MMFs", nameZh: "代币化存款与货基", facet: "theme", definition: "以代币化银行存款或代币化货币市场基金作为稳定价值载体的设计、发行和金融影响；传统货币基金或影子银行理论仅在与稳定币直接比较时归入。", region: null, category: A, status: "active" },
  { slug: "shadow-banking", nameEn: "Shadow Banking", nameZh: "影子银行", facet: "theme", definition: "游离于传统银行监管体系之外的信用中介活动，是理解稳定币、加密借贷与 DeFi 货币功能的重要理论背景。", region: null, category: A, status: "active" },
  { slug: "money-market-funds", nameEn: "Money Market Funds", nameZh: "货币市场基金", facet: "theme", definition: "传统货币市场基金的储备、流动性与挤兑机制研究，是稳定币风险分析的重要参照；与链上代币化货基分属传统金融背景与代币化产品两个角度。", region: null, category: A, status: "active" },
  // B 稳定性与风险
  { slug: "peg-stability-depeg", nameEn: "Peg stability & depeg", nameZh: "锚定稳定与脱锚", facet: "theme", definition: "以稳定币锚定价格、赎回价格、套利稳定机制或脱锚事件为核心研究问题；仅泛称价格、波动或风险不归入。", region: null, category: B, status: "active" },
  { slug: "run-liquidity-risk", nameEn: "Run & liquidity risk", nameZh: "挤兑与流动性风险", facet: "theme", definition: "大规模赎回、挤兑及赎回流动性不足导致的风险。", region: null, category: B, status: "active" },
  { slug: "reserve-quality-transparency", nameEn: "Reserves, disclosure & audit", nameZh: "储备、披露与审计", facet: "theme", definition: "稳定币储备资产的构成、质量、充足性，以及储备披露、鉴证、审计和相关会计要求。", region: null, category: B, status: "active" },
  { slug: "collateral-risk", nameEn: "Collateral risk", nameZh: "抵押品风险", facet: "theme", definition: "抵押资产价格波动、质量下降或清算引发的风险。", region: null, category: B, status: "active" },
  { slug: "smart-contract-security", nameEn: "Smart contract & security risk", nameZh: "合约与安全风险", facet: "theme", definition: "智能合约漏洞、被攻击、协议层技术安全问题。", region: null, category: B, status: "active" },
  { slug: "custody-counterparty", nameEn: "Custody & counterparty risk", nameZh: "托管与对手方风险", facet: "theme", definition: "储备托管方、发行方及交易对手违约或失信带来的风险。", region: null, category: B, status: "active" },
  { slug: "systemic-contagion", nameEn: "Systemic risk & contagion", nameZh: "系统性与传染风险", facet: "theme", definition: "稳定币危机向更广泛金融体系传导、引发系统性风险。", region: null, category: B, status: "active" },
  // C 监管与政策
  { slug: "regulatory-frameworks", nameEn: "Regulation & supervision", nameZh: "监管框架与监督", facet: "theme", definition: "针对稳定币的立法、监管制度、发行人准入、牌照要求和持续监督，如 MiCA、GENIUS Act 等。", region: null, category: C, status: "active" },
  { slug: "aml-cft", nameEn: "AML/CFT & illicit finance", nameZh: "反洗钱与非法金融", facet: "theme", definition: "稳定币在反洗钱、反恐怖融资及非法资金流动中的监管议题。", region: null, category: C, status: "active" },
  { slug: "consumer-protection", nameEn: "Consumer & investor protection", nameZh: "消费者与投资者保护", facet: "theme", definition: "持有人权益、赎回保障与投资者保护机制。", region: null, category: C, status: "active" },
  { slug: "cross-border-coordination", nameEn: "Cross-border coordination", nameZh: "跨境监管协调", facet: "theme", definition: "不同司法辖区间监管标准的协调与国际合作。", region: null, category: C, status: "active" },
  // D 货币与宏观
  { slug: "monetary-transmission", nameEn: "Monetary policy transmission", nameZh: "货币政策传导", facet: "theme", definition: "稳定币对货币政策传导机制与央行调控能力的影响。", region: null, category: D, status: "active" },
  { slug: "bank-disintermediation", nameEn: "Bank disintermediation", nameZh: "银行脱媒", facet: "theme", definition: "资金从银行存款转向稳定币导致的银行体系脱媒。", region: null, category: D, status: "active" },
  { slug: "capital-flows-sovereignty", nameEn: "Currency substitution & monetary sovereignty", nameZh: "货币替代与货币主权", facet: "theme", definition: "美元稳定币引发的货币替代、事实美元化、跨境资本流动变化，以及对本币地位、资本管制和国家货币主权的影响。", region: null, category: D, status: "active" },
  // E 市场与应用
  { slug: "payments-remittances", nameEn: "Payments & remittances", nameZh: "支付与跨境汇款", facet: "theme", definition: "稳定币在支付、跨境汇款场景的应用与效率优势。", region: null, category: E, status: "active" },
  { slug: "defi-lending", nameEn: "DeFi & lending", nameZh: "DeFi 与借贷", facet: "theme", definition: "稳定币在去中心化金融、借贷协议中的核心作用。", region: null, category: E, status: "active" },
  { slug: "trading-market-structure", nameEn: "Trading & market structure", nameZh: "交易与市场结构", facet: "theme", definition: "以稳定币交易、流动性、做市、套利、交易所或加密市场微观结构中的稳定币作用为核心；一般加密资产价格或交易研究不归入。", region: null, category: E, status: "active" },
  { slug: "adoption-emerging-markets", nameEn: "Adoption & emerging markets", nameZh: "采用与新兴市场", facet: "theme", definition: "稳定币在新兴市场与发展中国家的采用与普惠金融意义。", region: null, category: E, status: "active" },
  { slug: "market-data-supply", nameEn: "Market data & supply dynamics", nameZh: "市场数据与供给动态", facet: "theme", definition: "稳定币流通量、市值、供给变化等市场数据与指标分析。", region: null, category: E, status: "active" },
  // F 技术与基础设施
  { slug: "blockchain-chains", nameEn: "Blockchain & chains", nameZh: "区块链与公链", facet: "theme", definition: "承载稳定币的底层区块链与公链平台。", region: null, category: F, status: "active" },
  { slug: "interoperability-bridges", nameEn: "Interoperability & bridges", nameZh: "互操作与跨链桥", facet: "theme", definition: "稳定币跨链转移、互操作协议与跨链桥风险。", region: null, category: F, status: "active" },
  { slug: "oracles-data-feeds", nameEn: "Oracles & data feeds", nameZh: "预言机与数据源", facet: "theme", definition: "为稳定币机制提供价格与数据输入的预言机系统。", region: null, category: F, status: "active" },
  { slug: "privacy-compliance-tech", nameEn: "Privacy & compliance tech", nameZh: "隐私与合规技术", facet: "theme", definition: "兼顾隐私保护与监管合规的技术方案。", region: null, category: F, status: "active" },
  { slug: "programmability", nameEn: "Programmability", nameZh: "可编程性", facet: "theme", definition: "以稳定币或可编程货币的智能合约自动执行、条件支付和自动化金融功能为实质研究对象；仅提及区块链或数字平台不归入。", region: null, category: F, status: "active" },
  { slug: "crypto-asset-foundations", nameEn: "Crypto Asset Foundations", nameZh: "加密资产基础研究", facet: "theme", definition: "非稳定币专属的加密资产金融与经济研究，包括比特币、加密市场、DeFi 代币、治理代币、价格形成、波动与风险计量，为稳定币研究提供市场和资产背景。", region: null, category: F, status: "active" },
  { slug: "blockchain-foundations", nameEn: "Blockchain Foundations", nameZh: "区块链基础研究", facet: "theme", definition: "区块链、智能合约、跨链互操作、安全、密钥管理、共识与分布式系统等基础研究，为稳定币、加密资产和 DeFi 的技术实现提供背景。", region: null, category: F, status: "active" },
];

const jurisdictionTags: InsertTag[] = [
  { slug: "united-states", nameEn: "United States", nameZh: "美国", facet: "jurisdiction", definition: null, region: "Americas", status: "active" },
  { slug: "canada", nameEn: "Canada", nameZh: "加拿大", facet: "jurisdiction", definition: null, region: "Americas", status: "active" },
  { slug: "brazil", nameEn: "Brazil", nameZh: "巴西", facet: "jurisdiction", definition: null, region: "Americas", status: "active" },
  { slug: "mexico", nameEn: "Mexico", nameZh: "墨西哥", facet: "jurisdiction", definition: null, region: "Americas", status: "active" },
  { slug: "argentina", nameEn: "Argentina", nameZh: "阿根廷", facet: "jurisdiction", definition: null, region: "Americas", status: "active" },
  { slug: "el-salvador", nameEn: "El Salvador", nameZh: "萨尔瓦多", facet: "jurisdiction", definition: null, region: "Americas", status: "active" },
  { slug: "european-union", nameEn: "European Union", nameZh: "欧盟", facet: "jurisdiction", definition: null, region: "Europe", status: "active" },
  { slug: "united-kingdom", nameEn: "United Kingdom", nameZh: "英国", facet: "jurisdiction", definition: null, region: "Europe", status: "active" },
  { slug: "switzerland", nameEn: "Switzerland", nameZh: "瑞士", facet: "jurisdiction", definition: null, region: "Europe", status: "active" },
  { slug: "france", nameEn: "France", nameZh: "法国", facet: "jurisdiction", definition: null, region: "Europe", status: "active" },
  { slug: "germany", nameEn: "Germany", nameZh: "德国", facet: "jurisdiction", definition: null, region: "Europe", status: "active" },
  { slug: "netherlands", nameEn: "Netherlands", nameZh: "荷兰", facet: "jurisdiction", definition: null, region: "Europe", status: "active" },
  { slug: "singapore", nameEn: "Singapore", nameZh: "新加坡", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "hong-kong", nameEn: "Hong Kong", nameZh: "中国香港", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "china-mainland", nameEn: "China (Mainland)", nameZh: "中国大陆", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "japan", nameEn: "Japan", nameZh: "日本", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "south-korea", nameEn: "South Korea", nameZh: "韩国", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "australia", nameEn: "Australia", nameZh: "澳大利亚", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "india", nameEn: "India", nameZh: "印度", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "taiwan", nameEn: "Taiwan", nameZh: "中国台湾", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "new-zealand", nameEn: "New Zealand", nameZh: "新西兰", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "indonesia", nameEn: "Indonesia", nameZh: "印度尼西亚", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "malaysia", nameEn: "Malaysia", nameZh: "马来西亚", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "thailand", nameEn: "Thailand", nameZh: "泰国", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "philippines", nameEn: "Philippines", nameZh: "菲律宾", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "vietnam", nameEn: "Vietnam", nameZh: "越南", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "uae", nameEn: "United Arab Emirates", nameZh: "阿联酋", facet: "jurisdiction", definition: null, region: "Middle East", status: "active" },
  { slug: "saudi-arabia", nameEn: "Saudi Arabia", nameZh: "沙特阿拉伯", facet: "jurisdiction", definition: null, region: "Middle East", status: "active" },
  { slug: "bahrain", nameEn: "Bahrain", nameZh: "巴林", facet: "jurisdiction", definition: null, region: "Middle East", status: "active" },
  { slug: "turkey", nameEn: "Türkiye", nameZh: "土耳其", facet: "jurisdiction", definition: null, region: "Middle East", status: "active" },
  { slug: "nigeria", nameEn: "Nigeria", nameZh: "尼日利亚", facet: "jurisdiction", definition: null, region: "Africa", status: "active" },
  { slug: "south-africa", nameEn: "South Africa", nameZh: "南非", facet: "jurisdiction", definition: null, region: "Africa", status: "active" },
  { slug: "kenya", nameEn: "Kenya", nameZh: "肯尼亚", facet: "jurisdiction", definition: null, region: "Africa", status: "active" },
];

const publicAssetSlugs = new Set([
  "usdt", "usdc", "dai", "ust", "iron", "libra", "busd", "digix-gold", "gho",
  "usde", "frax", "pyusd", "usds", "eurc", "rlusd", "fdusd",
]);

const assetTagDefinitions = [
  { slug: "usdt", nameEn: "USDT (Tether)", nameZh: "泰达币", facet: "asset", definition: "Tether 发行的法币抵押型稳定币,市值最大。", region: null, status: "active" },
  { slug: "usdc", nameEn: "USDC (USD Coin)", nameZh: "USDC", facet: "asset", definition: "Circle 发行的合规法币抵押型稳定币。", region: null, status: "active" },
  { slug: "usds", nameEn: "USDS (Sky)", nameZh: "USDS", facet: "asset", definition: "Sky(原 MakerDAO)发行,DAI 更名而来。", region: null, status: "active" },
  { slug: "dai", nameEn: "DAI", nameZh: "DAI", facet: "asset", definition: "MakerDAO 的加密抵押型稳定币,已更名 USDS,文献仍常用旧名。", region: null, status: "active" },
  { slug: "usde", nameEn: "USDe (Ethena)", nameZh: "USDe", facet: "asset", definition: "Ethena 的合成型稳定币,靠衍生品对冲维持锚定。", region: null, status: "active" },
  { slug: "pyusd", nameEn: "PYUSD (PayPal USD)", nameZh: "PYUSD", facet: "asset", definition: "PayPal/Paxos 发行的支付型法币稳定币。", region: null, status: "active" },
  { slug: "fdusd", nameEn: "FDUSD (First Digital USD)", nameZh: "FDUSD", facet: "asset", definition: "香港 First Digital 发行的法币稳定币。", region: null, status: "active" },
  { slug: "tusd", nameEn: "TUSD (TrueUSD)", nameZh: "TUSD", facet: "asset", definition: "TrueUSD,强调透明度的法币稳定币。", region: null, status: "active" },
  { slug: "rlusd", nameEn: "RLUSD (Ripple USD)", nameZh: "RLUSD", facet: "asset", definition: "Ripple 发行、获 NYDFS 批准的合规法币稳定币。", region: null, status: "active" },
  { slug: "usd1", nameEn: "USD1 (World Liberty Financial)", nameZh: "USD1", facet: "asset", definition: "World Liberty Financial 发行,争议性高,研究讨论多。", region: null, status: "active" },
  { slug: "usdd", nameEn: "USDD (TRON)", nameZh: "USDD", facet: "asset", definition: "TRON DAO 的超额抵押/算法型稳定币。", region: null, status: "active" },
  { slug: "eurc", nameEn: "EURC (Circle Euro)", nameZh: "EURC", facet: "asset", definition: "Circle 发行的欧元稳定币,非美元代表。", region: null, status: "active" },
  { slug: "ust", nameEn: "UST (TerraUSD)", nameZh: "UST", facet: "asset", definition: "Terra 算法稳定币,已崩盘,崩盘研究极多。", region: null, status: "active" },
  { slug: "busd", nameEn: "BUSD (Binance USD)", nameZh: "BUSD", facet: "asset", definition: "Binance/Paxos 法币稳定币,已停发,历史文献多。", region: null, status: "active" },
  { slug: "gusd", nameEn: "GUSD (Gemini Dollar)", nameZh: "GUSD", facet: "asset", definition: "Gemini 发行的法币稳定币。", region: null, status: "active" },
  { slug: "frax", nameEn: "FRAX", nameZh: "FRAX", facet: "asset", definition: "Frax Finance 发行的稳定币，早期采用部分抵押与算法混合机制。", region: null, status: "active" },
  { slug: "lusd", nameEn: "LUSD (Liquity USD)", nameZh: "LUSD", facet: "asset", definition: "Liquity 协议发行、以 ETH 超额抵押的去中心化稳定币。", region: null, status: "active" },
  { slug: "crvusd", nameEn: "crvUSD (Curve USD)", nameZh: "crvUSD", facet: "asset", definition: "Curve Finance 发行、采用 LLAMMA 清算机制的超额抵押稳定币。", region: null, status: "active" },
  { slug: "gho", nameEn: "GHO (Aave)", nameZh: "GHO", facet: "asset", definition: "Aave 协议发行的去中心化超额抵押稳定币。", region: null, status: "active" },
  { slug: "susd", nameEn: "sUSD (Synthetix)", nameZh: "sUSD", facet: "asset", definition: "Synthetix 生态中的合成美元稳定资产。", region: null, status: "active" },
  { slug: "usdp", nameEn: "USDP (Pax Dollar)", nameZh: "USDP", facet: "asset", definition: "Paxos 发行的美元法币储备型稳定币。", region: null, status: "active" },
  { slug: "eurt", nameEn: "EURT (Euro Tether)", nameZh: "EURT", facet: "asset", definition: "Tether 发行的欧元法币储备型稳定币。", region: null, status: "active" },
  { slug: "usd0", nameEn: "USD0 (Usual)", nameZh: "USD0", facet: "asset", definition: "Usual 协议发行、由短期真实世界资产支持的稳定币。", region: null, status: "active" },
  { slug: "usr", nameEn: "USR (Resolv)", nameZh: "USR", facet: "asset", definition: "Resolv 发行、采用加密抵押与 Delta-neutral 对冲的稳定币。", region: null, status: "active" },
  { slug: "mim", nameEn: "MIM (Magic Internet Money)", nameZh: "MIM", facet: "asset", definition: "Abracadabra 发行、以生息加密资产抵押的稳定币。", region: null, status: "active" },
  { slug: "dola", nameEn: "DOLA (Inverse Finance)", nameZh: "DOLA", facet: "asset", definition: "Inverse Finance 发行的去中心化债务型稳定币。", region: null, status: "active" },
  { slug: "xaut", nameEn: "XAUT (Tether Gold)", nameZh: "XAUT", facet: "asset", definition: "Tether 发行、由实物黄金支持的代币化稳定价值资产。", region: null, status: "active" },
  { slug: "paxg", nameEn: "PAXG (Pax Gold)", nameZh: "PAXG", facet: "asset", definition: "Paxos 发行、由实物黄金支持的代币化稳定价值资产。", region: null, status: "active" },
  { slug: "djed", nameEn: "DJED", nameZh: "DJED", facet: "asset", definition: "Cardano 生态中的超额抵押算法稳定币。", region: null, status: "active" },
  { slug: "fei", nameEn: "FEI", nameZh: "FEI", facet: "asset", definition: "Fei Protocol 曾发行的算法/协议控制价值型稳定币，现主要用于历史研究。", region: null, status: "active" },
  { slug: "iron", nameEn: "IRON (Iron Finance)", nameZh: "IRON", facet: "asset", definition: "Iron Finance 发行的部分抵押算法稳定币，崩盘事件常用于风险研究。", region: null, status: "active" },
  { slug: "libra", nameEn: "Libra / Diem", nameZh: "Libra / Diem", facet: "asset", definition: "Meta/Facebook 提出的全球稳定币项目，后更名 Diem，虽未正式发行但政策研究较多。", region: null, status: "active" },
  { slug: "digix-gold", nameEn: "DGX (Digix Gold)", nameZh: "DGX", facet: "asset", definition: "由实物黄金支持的早期商品抵押型稳定价值代币。", region: null, status: "active" },
] satisfies InsertTag[];

const assetTags: InsertTag[] = assetTagDefinitions.map((tag) => ({
  ...tag,
  status: publicAssetSlugs.has(tag.slug) ? "active" : "candidate",
}));

async function main() {
  const allTags = [...themeTags, ...jurisdictionTags, ...assetTags];
  for (const tag of allTags) {
    await db
      .insert(tagsTable)
      .values(tag)
      .onConflictDoUpdate({
        target: tagsTable.slug,
        set: {
          nameEn: tag.nameEn,
          nameZh: tag.nameZh,
          facet: tag.facet,
          definition: tag.definition,
          region: tag.region,
          category: tag.category,
          status: tag.status,
        },
      });
  }

  const counts = await db
    .select({ facet: tagsTable.facet, count: sql<number>`count(*)::int` })
    .from(tagsTable)
    .groupBy(tagsTable.facet);

  console.log(`Upserted ${allTags.length} canonical tags.`);
  console.log("Current totals by facet:", counts);
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
