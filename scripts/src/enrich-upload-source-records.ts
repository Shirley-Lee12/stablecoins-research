import { db, pool, uploadJobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const uploadRouteUrl = new URL("../../artifacts/api-server/src/routes/upload.ts", import.meta.url).href;
const { runStoredUploadJob } = await import(uploadRouteUrl) as {
  runStoredUploadJob(jobId: number): Promise<void>;
};

type SourcePatch = {
  title?: string;
  authors?: string[];
  doi?: string;
  url?: string;
  publishedDate?: string;
  sourceType?: string;
  abstract?: string;
  keywords?: string[];
  keywordsSource?: "extracted" | "generated" | "manual";
};

// Evidence recovered from publisher, author-hosted, institutional-repository, or issuer pages.
// These values are deliberately limited to sources that identify the same work by title and DOI.
const patches = new Map<number, SourcePatch>([
  [700, {
    authors: ["Jane Thomason"],
    url: "https://doi.org/10.4018/979-8-3373-9043-7",
    publishedDate: "2026",
    sourceType: "report",
    abstract: "Stablecoins bridge traditional finance and the digital currency ecosystem by combining price stability with faster and more inclusive cross-border transactions. Their rapid adoption also creates regulatory and governance challenges involving monetary and financial stability, transparency, consumer protection, and systemic resilience. This work compares how jurisdictions regulate and govern stablecoins and draws lessons for balanced frameworks that support innovation while safeguarding the public interest.",
    keywords: ["stablecoin regulation", "governance", "financial stability", "consumer protection", "digital currency"],
    keywordsSource: "manual",
  }],
  [708, {
    url: "https://www.eba.europa.eu/sites/default/files/2024-08/52b7f7c9-1bf5-4dd8-948f-f31d9c02d1db/Stablecoins_240424.pdf",
    publishedDate: "2026",
    sourceType: "journal_article",
    abstract: "Stablecoin issuers can become subject to runs just like banks. This is because, in the absence of adequate regulation, issuers are incentivised to hold disproportionate amounts of high-yielding but illiquid assets in their reserve portfolios. The value of such reserve assets may be overly volatile, thus inducing investors to suddenly redeem their stablecoins. To mitigate the risk of runs, recent regulatory initiatives propose that reserve-asset portfolios should be overcollateralized, and that stablecoin issuers provide sufficient disclosure to holders about their composition. We show how transparency incentivises stablecoin issuers to keep a larger share of the reserves in liquid assets, thus reducing the risk of runs and potential bankruptcy ex-ante. In addition, transparency on reserves disincentivises stablecoin holders from irrationally demanding the reimbursement of their funds. We calculate the social welfare under different equilibria and analyse how regulatory interventions, like suspension of redemptions, may affect the welfare outcomes.",
    keywords: ["stablecoins", "runs", "transparency", "regulatory policy"],
    keywordsSource: "manual",
  }],
  [718, {
    url: "https://www.iog.io/papers/parscoin-a-privacy-preserving-auditable-and-regulation-friendly-stablecoin",
    publishedDate: "2024",
    sourceType: "conference_paper",
    abstract: "Stablecoins are digital assets designed to maintain a consistent value relative to a reference point, serving as a vital component in Blockchain, and Decentralized Finance (DeFi) ecosystem. Typical implementations of stablecoins via smart contracts come with important downsides such as a questionable level of privacy, potentially high fees, and lack of scalability. We put forth a new design, PARScoin, for a Privacy-preserving, Auditable, and Regulation-friendly Stablecoin that mitigates these issues while enabling high performance both in terms of speed of settlement and for scaling to large numbers of users as our performance analysis demonstrates. Our construction is blockchain-agnostic and is analyzed in the Universal Composition (UC) framework, offering a secure and modular approach for its integration into the broader blockchain ecosystem.",
    keywords: ["stablecoin", "privacy", "auditability", "regulatory compliance", "scalability"],
    keywordsSource: "manual",
  }],
  [725, {
    url: "https://www.sciencedirect.com/science/article/pii/S2405844026008145",
    publishedDate: "2026",
    sourceType: "journal_article",
    abstract: "This paper delivers a multidimensional systematic review of stablecoins and their interplay with central bank digital currencies (CBDCs), structured along four core analytical dimensions: technical architecture, economic spillovers, global regulatory regimes, and geopolitical currency competition. Guided by the PRISMA 2020 reporting framework, we synthesize peer-reviewed studies, conference proceedings, and institutional policy reports issued from 2020 to 2025. This study develops a Three-Tension Framework capturing three fundamental trade-offs underpinning stablecoin evolution: decentralization versus stability, innovation versus regulation, and sovereignty versus borderlessness. We integrate empirical, theoretical, and policy evidence to examine how stablecoins can reshape monetary transmission mechanisms, systemic financial stability, and cross-border currency rivalry, and propose a targeted research agenda for scholars and regulatory practitioners.",
    keywords: ["stablecoin", "central bank digital currency", "monetary policy", "financial regulation", "digital currency"],
    keywordsSource: "manual",
  }],
  [726, {
    url: "https://www.bostonfed.org/-/media/Documents/events/2024/stablecoins/Stablecoins_regulation__carapella.pdf",
    publishedDate: "2025",
    sourceType: "working_paper",
    abstract: "This paper analyzes the fragility of stablecoin issuers in an economy where they coexist with traditional financial institutions, such as banks. We fully characterize a self-enforcing mechanism aimed at improving stablecoin resiliency. Such mechanism relies on two essential components: a voluntary loss mutualization fund and costly participation to the fund in the form of one-period titles. We compare this mechanism with regulatory proposals advanced by policy makers and academics, uncovering direct and indirect effects of stablecoin regulation on the fragility of traditional financial institutions.",
    keywords: ["stablecoins", "self-regulation", "loss mutualization", "financial stability", "bank fragility"],
    keywordsSource: "manual",
  }],
  [730, {
    url: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6121746",
    publishedDate: "2026",
    sourceType: "journal_article",
    abstract: "To theoretically investigate the mechanism of stablecoin fragility under information shocks, we construct a novel agent-based market empowered by Large Language Models. This framework reproduces the micro-cognitive dynamics of investor panic, allowing agents to process unstructured narrative data. We find that stablecoin collapse is a highly non-linear phenomenon governed by a critical severity threshold. While the peg remains robust under moderate stress, crossing the narrative severity threshold triggers a cognitive de-pegging as diverse investor beliefs rapidly converge into synchronized selling. This highlights that the intensity of a narrative, rather than its specific content, is the primary driver of digital bank runs, suggesting that regulators should implement narrative stress tests to monitor systemic risk.",
    keywords: ["stablecoin", "large language models", "narrative shock", "depegging", "agent-based modeling"],
    keywordsSource: "manual",
  }],
  [577, {
    url: "https://api-new.whitepaper.io/documents/pdf?id=HJX1cRBSO",
    publishedDate: "2018-05",
    sourceType: "report",
  }],
  [602, {
    url: "https://a16zcrypto.com/posts/article/state-of-crypto-report-2023/",
    publishedDate: "2023-04-10",
    sourceType: "report",
  }],
  [621, {
    abstract: "Smart contracts are computer programs that can be correctly executed by a network of mutually distrusting nodes, without the need of an external trusted authority. Since smart contracts handle and transfer assets of considerable value, their implementation must be secure against attacks that steal or tamper with assets. This study analyses Ethereum smart-contract vulnerabilities, develops a taxonomy of common programming pitfalls, and shows attacks that exploit them to steal money or cause other damage.",
  }],
  [628, {
    abstract: "Recent advances in decentralized finance have increased the use of automated market makers to create decentralized exchanges. This paper treats an AMM as a neoclassical black box that converts token inputs into price outputs through an exchange function. It examines constant-product, constant-mean, constant-sum, hybrid, and dynamic AMMs, as well as concentrated liquidity, to clarify their similarities and differences.",
  }],
  [630, {
    abstract: "This paper studies the determination and evolution of bitcoin prices in a monetary economy with a decentralized network. Users value bitcoin for transactions and resale while considering network-attack risk, and miners contribute resources for security in exchange for token-denominated rewards. The model jointly determines security and price and shows how price-security feedback can amplify or moderate volatility after demand shocks.",
  }],
  [632, {
    doi: "10.1016/j.jbvi.2019.e00151",
    url: "https://www.sciencedirect.com/science/article/pii/S2352673419300824",
    publishedDate: "2020-06",
    sourceType: "journal_article",
    abstract: "Blockchain technology can reduce transaction costs, generate distributed trust, and support decentralized platforms and business models. In finance, these capabilities enable decentralized services that may be more open, innovative, interoperable, borderless, and transparent. The article assesses the benefits of decentralized finance, identifies existing business models, and evaluates the challenges and limits that could constrain its development.",
  }],
  [648, {
    title: "Bribes to Miners: Evidence from Ethereum",
    url: "https://arxiv.org/abs/2203.14601",
    publishedDate: "2022-03-28",
    sourceType: "working_paper",
    abstract: "Blockchain users can bribe miners by transferring cryptoassets, creating a collusion problem. The study scans Ethereum transactions to identify potential bribery, constructs proxies for its activity, and examines its effects after Ethereum's London Fork. It finds that potential bribers and bribees are concentrated in a small group and that bribery affects Ethereum, other blockchains, and connections with traditional financial markets.",
  }],
  [660, {
    abstract: "This review develops a comprehensive account of DeFi vulnerabilities, attacks, and security tools for protocols and smart contracts. It organizes common weaknesses and 57 documented attack incidents into a taxonomy, then evaluates tools for vulnerability detection, attack hunting, risk assessment, and automated repair. The study identifies the limits of current methods for complex DeFi protocols and highlights open research challenges.",
  }],
  [667, {
    abstract: "Traditional financial infrastructure restricts access and imposes high costs on households and small businesses. This work argues that decentralized finance can address these problems through blockchain-based methods, while initiatives that remain tied to existing banking infrastructure may be less durable. It presents DeFi as a potential alternative financial architecture for more open and inclusive services.",
  }],
  [672, {
    abstract: "Decentralized autonomous organizations rely on governance mechanisms without centralized leadership. This empirical study examines participation, proposal submission, approval rates, and decision duration across more than 3,000 proposals from 14 Internet Computer SNS DAOs over 20 months. Compared with other DAO frameworks, SNS governance shows higher activity, lower costs, faster decisions, and sustained or increasing engagement over time.",
  }],
  [677, {
    abstract: "Several Ethereum projects for stablecoins and synthetic assets use a shared mechanism to fix asset prices. This paper formalizes that mechanism as a red-black coin primitive, models its financial properties, and studies how it should be priced. It also develops a design landscape for reducing exposure to price declines and for alternatives to liquidation.",
  }],
  [681, {
    abstract: "Blockchain applications need to represent many kinds of digital assets, but those assets cannot be recorded directly on-chain and require tokenization. This systematic study classifies tokenization schemes and digital tokens as fungible, non-fungible, or semi-fungible, reviews Ethereum token standards, and identifies challenges and research directions for interoperable tokenization processes.",
  }],
  [684, {
    abstract: "DeFi lending can enable high leverage through under-collateralized platforms. This paper formalizes a model for these platforms and analytically and empirically evaluates impermanent loss in AMMs, arbitrage loss, and collateral liquidation. Using Alpha Homora data, it finds that leverage can mitigate some impermanent loss while arbitrage and liquidation losses rise with the leverage multiplier.",
  }],
  [687, {
    abstract: "This study investigates how Bitcoin users experience security, privacy, and anonymity. A survey of 990 users and qualitative interviews examine asset-management practices and the security measures users apply. The findings show widespread reliance on web-hosted tools, misconceptions about anonymity and security features, and substantial losses from security breaches or self-induced errors.",
  }],
]);

const requestedIds = process.argv.slice(2).map(Number).filter((id) => Number.isInteger(id) && patches.has(id));
const targets = requestedIds.length > 0 ? requestedIds : [...patches.keys()];
const summary = { selected: targets.length, processed: 0, completed: 0, stillMissing: [] as number[], failed: [] as number[] };

for (const id of targets) {
  const [job] = await db.select().from(uploadJobsTable).where(eq(uploadJobsTable.id, id)).limit(1);
  if (!job || job.status !== "ready_for_review" || !job.result) {
    console.log(JSON.stringify({ id, skipped: "job is no longer ready for review" }));
    continue;
  }
  const result = job.result as any;
  const patch = patches.get(id)!;
  const draft = { ...result.draft, ...patch };
  if (patch.publishedDate) draft.year = Number.parseInt(patch.publishedDate.slice(0, 4), 10);

  await db.update(uploadJobsTable).set({
    status: "queued",
    attempts: 0,
    nextAttemptAt: null,
    completedAt: null,
    error: "Refreshing metadata from identified source record",
    result: { ...result, draft },
    updatedAt: new Date(),
  }).where(eq(uploadJobsTable.id, id));

  await runStoredUploadJob(id);
  const [updated] = await db.select().from(uploadJobsTable).where(eq(uploadJobsTable.id, id)).limit(1);
  const missing = ((updated?.result as any)?.missingRequired ?? []) as string[];
  summary.processed += 1;
  if (updated?.status === "failed") summary.failed.push(id);
  else if (missing.length > 0) summary.stillMissing.push(id);
  else summary.completed += 1;
  console.log(JSON.stringify({ id, status: updated?.status, missing }));
}

console.log(JSON.stringify({ summary }, null, 2));
await pool.end();
