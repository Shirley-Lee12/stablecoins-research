import "dotenv/config";
import { db, tagsTable, pool, type InsertTag } from "@workspace/db";
import { sql } from "drizzle-orm";

// Source: docs/roadmap.md Part 3 (T.2 theme seed + T.3 jurisdiction/asset seed).
// Idempotent — re-running only fills in tags that don't exist yet (matched by slug).

const themeTags: InsertTag[] = [
  // A 类型与机制
  { slug: "fiat-collateralized", nameEn: "Fiat-collateralized", nameZh: "法币抵押型", facet: "theme", definition: "由银行存款、现金或短期国债等法币资产 1:1 储备支持的稳定币,如 USDT、USDC。", region: null, status: "active" },
  { slug: "crypto-collateralized", nameEn: "Crypto-collateralized", nameZh: "加密资产抵押型", facet: "theme", definition: "由超额抵押的加密资产支持、通过链上机制维持锚定的稳定币,如 DAI。", region: null, status: "active" },
  { slug: "algorithmic", nameEn: "Algorithmic", nameZh: "算法稳定币", facet: "theme", definition: "不依赖足额储备、靠算法调节供给或套利机制维持锚定的稳定币,如 UST。", region: null, status: "active" },
  { slug: "commodity-rwa-backed", nameEn: "Commodity & RWA-backed", nameZh: "商品/RWA 抵押型", facet: "theme", definition: "由黄金、大宗商品或代币化现实世界资产支持的稳定币。", region: null, status: "active" },
  { slug: "cbdc", nameEn: "CBDC", nameZh: "央行数字货币", facet: "theme", definition: "由中央银行发行的数字法币,及其与稳定币的关系与竞争。", region: null, status: "active" },
  { slug: "tokenized-deposits-mmf", nameEn: "Tokenized deposits & MMFs", nameZh: "代币化存款与货基", facet: "theme", definition: "商业银行存款或货币市场基金的代币化形态,作为稳定价值载体。", region: null, status: "active" },
  // B 稳定性与风险
  { slug: "peg-stability-depeg", nameEn: "Peg stability & depeg", nameZh: "锚定稳定与脱锚", facet: "theme", definition: "稳定币维持或偏离其锚定价格的机制、动态与脱锚事件分析。", region: null, status: "active" },
  { slug: "run-liquidity-risk", nameEn: "Run & liquidity risk", nameZh: "挤兑与流动性风险", facet: "theme", definition: "大规模赎回、挤兑及赎回流动性不足导致的风险。", region: null, status: "active" },
  { slug: "reserve-quality-transparency", nameEn: "Reserve quality & transparency", nameZh: "储备质量与透明度", facet: "theme", definition: "储备资产构成、充足性、审计与披露透明度问题。", region: null, status: "active" },
  { slug: "collateral-risk", nameEn: "Collateral risk", nameZh: "抵押品风险", facet: "theme", definition: "抵押资产价格波动、质量下降或清算引发的风险。", region: null, status: "active" },
  { slug: "smart-contract-security", nameEn: "Smart contract & security risk", nameZh: "合约与安全风险", facet: "theme", definition: "智能合约漏洞、被攻击、协议层技术安全问题。", region: null, status: "active" },
  { slug: "custody-counterparty", nameEn: "Custody & counterparty risk", nameZh: "托管与对手方风险", facet: "theme", definition: "储备托管方、发行方及交易对手违约或失信带来的风险。", region: null, status: "active" },
  { slug: "systemic-contagion", nameEn: "Systemic risk & contagion", nameZh: "系统性与传染风险", facet: "theme", definition: "稳定币危机向更广泛金融体系传导、引发系统性风险。", region: null, status: "active" },
  // C 监管与政策
  { slug: "regulatory-frameworks", nameEn: "Regulatory frameworks", nameZh: "监管框架", facet: "theme", definition: "针对稳定币的立法与监管框架,如 MiCA、美国 GENIUS Act 等。", region: null, status: "active" },
  { slug: "licensing-supervision", nameEn: "Licensing & supervision", nameZh: "牌照与监管", facet: "theme", definition: "发行方的牌照要求、准入门槛与持续监管。", region: null, status: "active" },
  { slug: "aml-cft", nameEn: "AML/CFT & illicit finance", nameZh: "反洗钱与非法金融", facet: "theme", definition: "稳定币在反洗钱、反恐怖融资及非法资金流动中的监管议题。", region: null, status: "active" },
  { slug: "consumer-protection", nameEn: "Consumer & investor protection", nameZh: "消费者与投资者保护", facet: "theme", definition: "持有人权益、赎回保障与投资者保护机制。", region: null, status: "active" },
  { slug: "disclosure-accounting", nameEn: "Disclosure & accounting", nameZh: "披露与会计", facet: "theme", definition: "储备披露要求、会计处理与审计准则。", region: null, status: "active" },
  { slug: "cross-border-coordination", nameEn: "Cross-border coordination", nameZh: "跨境监管协调", facet: "theme", definition: "不同司法辖区间监管标准的协调与国际合作。", region: null, status: "active" },
  // D 货币与宏观
  { slug: "monetary-transmission", nameEn: "Monetary policy transmission", nameZh: "货币政策传导", facet: "theme", definition: "稳定币对货币政策传导机制与央行调控能力的影响。", region: null, status: "active" },
  { slug: "dollarization-substitution", nameEn: "Dollarization & currency substitution", nameZh: "美元化与货币替代", facet: "theme", definition: "美元稳定币在他国引发的事实美元化与本币替代。", region: null, status: "active" },
  { slug: "bank-disintermediation", nameEn: "Bank disintermediation", nameZh: "银行脱媒", facet: "theme", definition: "资金从银行存款转向稳定币导致的银行体系脱媒。", region: null, status: "active" },
  { slug: "capital-flows-sovereignty", nameEn: "Capital flows & monetary sovereignty", nameZh: "资本流动与货币主权", facet: "theme", definition: "稳定币对跨境资本流动管理与国家货币主权的冲击。", region: null, status: "active" },
  // E 市场与应用
  { slug: "payments-remittances", nameEn: "Payments & remittances", nameZh: "支付与跨境汇款", facet: "theme", definition: "稳定币在支付、跨境汇款场景的应用与效率优势。", region: null, status: "active" },
  { slug: "defi-lending", nameEn: "DeFi & lending", nameZh: "DeFi 与借贷", facet: "theme", definition: "稳定币在去中心化金融、借贷协议中的核心作用。", region: null, status: "active" },
  { slug: "trading-market-structure", nameEn: "Trading & market structure", nameZh: "交易与市场结构", facet: "theme", definition: "稳定币在交易、做市与加密市场微观结构中的角色。", region: null, status: "active" },
  { slug: "adoption-emerging-markets", nameEn: "Adoption & emerging markets", nameZh: "采用与新兴市场", facet: "theme", definition: "稳定币在新兴市场与发展中国家的采用与普惠金融意义。", region: null, status: "active" },
  { slug: "market-data-supply", nameEn: "Market data & supply dynamics", nameZh: "市场数据与供给动态", facet: "theme", definition: "稳定币流通量、市值、供给变化等市场数据与指标分析。", region: null, status: "active" },
  // F 技术与基础设施
  { slug: "blockchain-chains", nameEn: "Blockchain & chains", nameZh: "区块链与公链", facet: "theme", definition: "承载稳定币的底层区块链与公链平台。", region: null, status: "active" },
  { slug: "interoperability-bridges", nameEn: "Interoperability & bridges", nameZh: "互操作与跨链桥", facet: "theme", definition: "稳定币跨链转移、互操作协议与跨链桥风险。", region: null, status: "active" },
  { slug: "oracles-data-feeds", nameEn: "Oracles & data feeds", nameZh: "预言机与数据源", facet: "theme", definition: "为稳定币机制提供价格与数据输入的预言机系统。", region: null, status: "active" },
  { slug: "privacy-compliance-tech", nameEn: "Privacy & compliance tech", nameZh: "隐私与合规技术", facet: "theme", definition: "兼顾隐私保护与监管合规的技术方案。", region: null, status: "active" },
  { slug: "programmability", nameEn: "Programmability", nameZh: "可编程性", facet: "theme", definition: "稳定币的可编程特性及其在自动化金融中的应用。", region: null, status: "active" },
];

const jurisdictionTags: InsertTag[] = [
  { slug: "united-states", nameEn: "United States", nameZh: "美国", facet: "jurisdiction", definition: null, region: "Americas", status: "active" },
  { slug: "canada", nameEn: "Canada", nameZh: "加拿大", facet: "jurisdiction", definition: null, region: "Americas", status: "active" },
  { slug: "brazil", nameEn: "Brazil", nameZh: "巴西", facet: "jurisdiction", definition: null, region: "Americas", status: "active" },
  { slug: "european-union", nameEn: "European Union", nameZh: "欧盟", facet: "jurisdiction", definition: null, region: "Europe", status: "active" },
  { slug: "united-kingdom", nameEn: "United Kingdom", nameZh: "英国", facet: "jurisdiction", definition: null, region: "Europe", status: "active" },
  { slug: "switzerland", nameEn: "Switzerland", nameZh: "瑞士", facet: "jurisdiction", definition: null, region: "Europe", status: "active" },
  { slug: "singapore", nameEn: "Singapore", nameZh: "新加坡", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "hong-kong", nameEn: "Hong Kong", nameZh: "中国香港", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "china-mainland", nameEn: "China (Mainland)", nameZh: "中国大陆", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "japan", nameEn: "Japan", nameZh: "日本", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "south-korea", nameEn: "South Korea", nameZh: "韩国", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "australia", nameEn: "Australia", nameZh: "澳大利亚", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "india", nameEn: "India", nameZh: "印度", facet: "jurisdiction", definition: null, region: "APAC", status: "active" },
  { slug: "uae", nameEn: "United Arab Emirates", nameZh: "阿联酋", facet: "jurisdiction", definition: null, region: "Middle East", status: "active" },
  { slug: "nigeria", nameEn: "Nigeria", nameZh: "尼日利亚", facet: "jurisdiction", definition: null, region: "Africa", status: "active" },
  { slug: "global-international", nameEn: "Global / International", nameZh: "全球/国际", facet: "jurisdiction", definition: null, region: "Global", status: "active" },
];

const assetTags: InsertTag[] = [
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
];

async function main() {
  const allTags = [...themeTags, ...jurisdictionTags, ...assetTags];
  const inserted = await db
    .insert(tagsTable)
    .values(allTags)
    .onConflictDoNothing({ target: tagsTable.slug })
    .returning({ slug: tagsTable.slug });

  const counts = await db
    .select({ facet: tagsTable.facet, count: sql<number>`count(*)::int` })
    .from(tagsTable)
    .groupBy(tagsTable.facet);

  console.log(`Inserted ${inserted.length} new tags (${allTags.length - inserted.length} already existed, skipped).`);
  console.log("Current totals by facet:", counts);
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
