import { eq, or, sql } from "drizzle-orm";
import {
  db,
  pool,
  resourcesTable,
  resourceTagsTable,
  uploadJobsTable,
} from "@workspace/db";

const authorsModuleUrl = new URL("../../artifacts/api-server/src/lib/resourceAuthors.ts", import.meta.url).href;
const { syncResourceAuthors } = await import(authorsModuleUrl) as {
  syncResourceAuthors(resourceId: number, authors: string[], client?: any): Promise<void>;
};

const reviewerId = 10;

type SourceType = typeof resourcesTable.$inferInsert.sourceType;
type JobDraft = {
  title?: string;
  authors?: string[];
  sourceType?: SourceType;
  url?: string | null;
  doi?: string | null;
  abstract?: string | null;
  keywords?: string[];
  keywordsSource?: string | null;
  publishedDate?: string | null;
  year?: number | null;
};

type ReviewPatch = Partial<JobDraft> & {
  tagIds: number[];
  reviewNote: string;
};

const cleanDoi = (value: string | null | undefined) => value
  ?.trim()
  .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "") || null;

const cleanText = (value: string | null | undefined) => value
  ?.replace(/&(?:#39|apos);/gi, "'")
  .replace(/&quot;/gi, '"')
  .replace(/&amp;/gi, "&")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">")
  .replace(/\s+/g, " ")
  .trim() || null;

const approved: Record<number, ReviewPatch> = {
  319: {
    title: "Independent Auditors' Report on Tether Consolidated Financial Figures and Reserves as of 30 September 2024",
    authors: ["BDO Italia S.p.A."], sourceType: "report", publishedDate: "2024-10-31",
    url: "https://assets.ctfassets.net/vyse88cgwfbl/5TKa7xwJVLIAnVBMWb7iTq/5688216da5194fce27f4a0f2e808a486/ISAE_3000R_-_Opinion_on_Tether_Consolidated_Financials_Figures_30.09.2024_.pdf",
    abstract: "BDO Italia's independent reasonable-assurance report covers Tether Holdings Limited's consolidated financial figures and reserves as of 30 September 2024. It describes the ISAE 3000 (Revised) procedures performed and concludes that the report was fairly presented, in all material respects, according to Tether's stated criteria and accounting policies.",
    keywords: ["Tether", "USDT", "reserves", "independent assurance", "ISAE 3000"], keywordsSource: "generated",
    tagIds: [9, 12, 50], reviewNote: "Recovered from the original local PDF and matched to Tether's authoritative hosted report.",
  },
  322: { tagIds: [7, 26], reviewNote: "DOI metadata and the publisher abstract were consistent." },
  332: { doi: "10.1016/j.frl.2020.101867", tagIds: [26, 28], reviewNote: "Normalized the DOI and retained publisher-derived metadata." },
  338: {
    title: "香港《稳定币条例》正式成为法例", authors: ["胡志挺"], sourceType: "news", publishedDate: "2025-05-31",
    url: "https://www.thepaper.cn/newsDetail_forward_30912710",
    keywords: ["稳定币条例", "发行人牌照", "储备资产", "赎回", "香港金融管理局"], keywordsSource: "extracted",
    tagIds: [1, 9, 14, 41], reviewNote: "Matched the local copy to the original 澎湃新闻 report and removed unrelated CBDC/RWA tags.",
  },
  340: {
    authors: ["Shuhui Kwok", "Kimberly Lee"], sourceType: "report", publishedDate: "2023-09-06",
    url: "https://www.aoshearman.com/en/insights/mas-finalises-its-policy-position-on-the-regulation-of-stablecoin-related-activities",
    keywords: ["Singapore", "single-currency stablecoins", "Payment Services Act", "reserve requirements", "redemption"], keywordsSource: "extracted",
    tagIds: [1, 9, 14, 40], reviewNote: "Corrected the author/source from MAS to the A&O Shearman lawyers who wrote the analysis.",
  },
  353: {
    title: "全球稳定币法律监管走势与我国法治路径展望", publishedDate: "2025-11-20",
    url: "https://zsyyb.cn/user/search.htm?field=keywords&value=%E6%B3%95%E6%B2%BB%E8%B7%AF%E5%BE%84",
    tagIds: [14, 19, 23, 34, 37, 41, 42], reviewNote: "Matched the article to its PSSXiv record and journal collaboration listing.",
  },
  355: {
    title: "稳定币法律监管论", authors: ["姚青松"], sourceType: "thesis", publishedDate: "2022-06-10",
    url: "https://d.wanfangdata.com.cn/thesis/Y3969669",
    abstract: "本文以稳定币的法律属性与监管路径为核心，梳理稳定币的运行机制、发展现状及主要风险，比较境外监管实践，并讨论我国在金融监管、投资者保护、反洗钱和风险防控方面的制度选择。论文为山东大学法学院法律硕士学位论文。",
    keywords: ["稳定币", "法律属性", "金融监管", "风险防控", "投资者保护"], keywordsSource: "generated",
    tagIds: [14, 16, 17, 42], reviewNote: "Recovered the title page and thesis identifier from the original PDF after the AI result was empty.",
  },
  371: {
    url: "https://www.spglobal.com/content/dam/spglobal/ratings/en/documents/products/ssa_brochure_launch_edition.pdf",
    tagIds: [7, 9, 12], reviewNote: "Matched to S&P Global Ratings' official Stablecoin Stability Assessment brochure.",
  },
  375: {
    sourceType: "conference_paper", keywordsSource: "extracted", tagIds: [7, 11, 17],
    reviewNote: "DOI and full author names were verified; corrected the IEEE conference paper type.",
  },
  381: { tagIds: [1, 2, 3, 27, 29, 142], reviewNote: "CNKI DOI, authors and abstract were internally consistent; added mechanism and adoption tags." },
  383: {
    title: "稳定币的稳定性及影响研究", authors: ["向梓一"], sourceType: "thesis", publishedDate: "2025-05",
    url: "https://s.wanfangdata.com.cn/thesis?q=%E7%A8%B3%E5%AE%9A%E5%B8%81%E7%9A%84%E7%A8%B3%E5%AE%9A%E6%80%A7%E5%8F%8A%E5%BD%B1%E5%93%8D%E7%A0%94%E7%A9%B6",
    keywords: ["稳定币", "锚定稳定", "套利行为", "抵押资产", "DCC-GARCH"], keywordsSource: "extracted",
    tagIds: [1, 7, 26], reviewNote: "Recovered the Chinese title, author, institution and degree date from the original thesis PDF.",
  },
  389: {
    url: "https://cdo.develpress.com/?p=17246", sourceType: "journal_article", publishedDate: "2025-07",
    tagIds: [1, 2, 3, 20, 23, 24, 50], reviewNote: "Matched to the public full-text version and the China Development Observation issue.",
  },
  391: {
    title: "Independent Auditors' Report on Tether Consolidated Financial Figures and Reserves as of 30 June 2024",
    authors: ["BDO Italia S.p.A."], sourceType: "report", publishedDate: "2024-07-31",
    url: "https://assets.ctfassets.net/vyse88cgwfbl/6h4YWqZOXbwtBaPtYgICGy/d7462f312aa15b872f8474322ba90363/ISAE_3000R_-_Opinion_on_Consolidated_Financials_Figures_30.06.2024_RC134792024BD0209.pdf",
    abstract: "BDO Italia's independent reasonable-assurance report covers Tether Holdings Limited's consolidated financial figures and reserves as of 30 June 2024. It describes procedures performed under ISAE 3000 (Revised) and concludes that the report was fairly presented, in all material respects, according to Tether's stated criteria and accounting policies.",
    keywords: ["Tether", "USDT", "reserves", "independent assurance", "ISAE 3000"], keywordsSource: "generated",
    tagIds: [9, 12, 50], reviewNote: "Recovered from the original local PDF and matched to Tether's authoritative hosted report.",
  },
  392: {
    publishedDate: "2025-07", url: "https://s.wanfangdata.com.cn/periodical?q=%E7%A8%B3%E5%AE%9A%E5%B8%81%E6%94%AF%E4%BB%98%E5%B8%82%E5%9C%BA%E5%8F%91%E5%B1%95%E6%A6%82%E8%A7%88",
    tagIds: [14, 24, 25, 27, 41], reviewNote: "Confirmed author, journal issue and article content from the original PDF.",
  },
  404: {
    sourceType: "report", publishedDate: "2025-10",
    url: "https://reports.artemisanalytics.com/stablecoins/artemis-stablecoin-payments-from-the-ground-up-2025.pdf",
    tagIds: [24, 27, 28, 50, 51], reviewNote: "Matched to the official Artemis report and corrected the source type.",
  },
  414: {
    publishedDate: "2023-08-15",
    url: "https://www.mas.gov.sg/-/media/mas-media-library/publications/consultations/pd/2023/response-to-consultation-on-stablecoins-regulation_15aug2023.pdf",
    abstract: "The Monetary Authority of Singapore summarises feedback received on its proposed regulatory approach for stablecoin-related activities and states its final policy responses. The document establishes the scope and core requirements of Singapore's framework for single-currency stablecoins, including reserve composition, capital, redemption, disclosure and business restrictions.",
    keywords: ["Singapore", "single-currency stablecoins", "public consultation", "reserve assets", "redemption"], keywordsSource: "generated",
    tagIds: [1, 9, 14, 17, 40], reviewNote: "Replaced the consultation landing page with MAS's final official response PDF.",
  },
  457: {
    sourceType: "conference_paper", publishedDate: "2025",
    url: "https://cnki.istiz.org.cn/kcms/detail/frame/detaillist.aspx?cat=F821&curdbcode=&dbcode=CJFQ&dbname=CJFD2011&filename=nmgs201104024&reftype=9",
    tagIds: [1, 3, 7, 13, 14, 16, 19, 34, 37, 41, 42, 50, 51],
    reviewNote: "Confirmed the paper in the 2025 digital-transformation conference proceedings.",
  },
  459: {
    abstract: "报道香港金融管理局发出首批稳定币发行人牌照后，获牌机构筹备港元稳定币发行的进展，并介绍跨境支付、本地支付及代币化资产等预期应用场景。",
    keywords: ["香港", "稳定币发行人牌照", "港元稳定币", "跨境支付"], keywordsSource: "generated",
    tagIds: [1, 14, 24, 41], reviewNote: "CNKI newspaper DOI and bibliographic fields were consistent; removed unrelated mechanism tags.",
  },
  460: {
    abstract: "报道香港首批稳定币发行人牌照落地后的监管安排，重点说明香港金融管理局将严格控制后续牌照数量，并观察首批持牌机构的运营、储备和应用情况。",
    keywords: ["香港", "稳定币牌照", "发牌制度", "监管审慎"], keywordsSource: "generated",
    tagIds: [1, 14, 41], reviewNote: "CNKI newspaper DOI and bibliographic fields were consistent; removed unrelated CBDC/RWA tags.",
  },
  461: {
    abstract: "报道香港金融管理局发出首批稳定币发行人牌照，由获牌机构推进港元稳定币发行，并梳理跨境支付、本地支付、代币化资产交易及创新应用四类场景。",
    keywords: ["香港稳定币监管", "稳定币发行人牌照", "港元稳定币", "跨境支付", "代币化资产交易"], keywordsSource: "generated",
    tagIds: [1, 14, 24, 41], reviewNote: "Merged the matching PDF task into this CNKI newspaper record and retained the fuller abstract.",
  },
  462: {
    abstract: "报道香港发出首批稳定币发行人牌照的监管事件，介绍获牌机构、法币稳定币发行安排以及储备、赎回、风险管理等监管要求。",
    keywords: ["香港", "稳定币", "发行人牌照", "储备与赎回"], keywordsSource: "generated",
    tagIds: [1, 9, 14, 41], reviewNote: "CNKI newspaper DOI and bibliographic fields were consistent.",
  },
  472: {
    authors: ["Cheuk Hang Au", "Wen Shou Hsu", "P.-H. Shieh", "Lin Yue"], tagIds: [27],
    reviewNote: "Expanded the resolvable author names and removed the unsupported US jurisdiction tag.",
  },
  475: {
    title: "Stablecoins: Adoption and Fragility", authors: ["Christoph Bertsch"], sourceType: "working_paper", publishedDate: "2023-05-16",
    doi: "10.2139/ssrn.4466431", url: "https://www.riksbank.se/globalassets/media/rapporter/working-papers/2023/no.-423-stablecoins-adoption-and-fragility.pdf",
    abstract: "Stablecoins promise a stable and secure way to park funds in the crypto universe, but issuers are vulnerable to runs triggered by concerns about reserves and operational risks. The paper develops a framework linking payment preferences, network effects, adoption and fragility, and derives implications for risk assessment, regulation and reserve management.",
    keywords: ["stablecoins", "payment preferences", "financial stability", "global games", "network effects"], keywordsSource: "extracted",
    tagIds: [7, 8, 22, 27], reviewNote: "Replaced an AI-invented title with the authoritative Sveriges Riksbank working-paper record.",
  },
  476: {
    authors: ["Louis Bertucci", "Sébastien Choukroun", "Julien Prat"], publishedDate: "2023-04-06", doi: "10.3917/ecofi.149.0073",
    abstract: "Cet article propose une analyse économique des stablecoins mettant en évidence les liens avec la finance traditionnelle. Il se concentre principalement sur les stablecoins gérés par un système d'incitations sur une blockchain décentralisée, examine leur gouvernance et leur liquidation, puis discute les mécanismes pouvant entraîner une perte de stabilité.",
    keywords: ["stablecoins décentralisés", "gouvernance", "liquidation", "incitations", "stabilité"], keywordsSource: "extracted",
    tagIds: [2, 3, 7, 8, 11], reviewNote: "Completed DOI, full authors, date and source abstract from Cairn.",
  },
  479: { sourceType: "working_paper", tagIds: [7, 26], reviewNote: "SSRN DOI and abstract were consistent; corrected the source type." },
  482: {
    title: "Collapse of Silicon Valley Bank and USDC Depegging: A Machine Learning Experiment",
    authors: ["Papa Ousseynou Diop", "Julien Chevallier", "Bilel Sanhaji"], sourceType: "journal_article", publishedDate: "2024-12-13",
    doi: "10.3390/fintech3040030", url: "https://www.mdpi.com/2674-1032/3/4/30",
    abstract: "The collapse of Silicon Valley Bank and the subsequent USDC depeg exposed links between traditional banking and stablecoins. Using data for USDC, DAI, FRAX, USDD, Bitcoin and Tether, the study analyses depegging and contagion around the event and applies gradient boosting and random forests to examine financial stability and risk-management implications.",
    keywords: ["stablecoin", "depeg", "USDC", "Silicon Valley Bank", "bank run", "machine learning"], keywordsSource: "extracted",
    tagIds: [7, 8, 12, 13, 51, 53, 306], reviewNote: "Recovered complete metadata from the original PDF and matched it to the MDPI DOI record.",
  },
  486: {
    url: "https://www.chainargos.com/wp-content/uploads/2025/10/ChainArgos-Case-Study-The-Risks-with-Synthetic-Stablecoins-Ethana-Labs-USDe-20-October-2025.pdf",
    publishedDate: "2025-10-20", tagIds: [7, 8, 12, 13, 54, 226, 228],
    reviewNote: "Matched the local PDF to ChainArgos's official report and publication date.",
  },
  490: {
    authors: ["Gerrard Li", "Cheuk Hang Au", "Kevin K. W. Ho", "Kris M. Y. Law"], sourceType: "conference_paper", publishedDate: "2024-11-01",
    url: "https://link.springer.com/chapter/10.1007/978-3-031-74437-2_7",
    abstract: "This study uses the Technology-Organisation-Environment framework and trust literature to investigate factors influencing the perceived value of cryptocurrencies. It reports that security, transaction speed, supply, gifting, trust, user critical mass and issuer interaction affect value, while the drivers differ somewhat between stablecoins and non-stable cryptocurrencies.",
    keywords: ["perceived value", "stablecoins", "cryptocurrency adoption", "trust", "TOE framework"], keywordsSource: "extracted",
    tagIds: [17, 27, 29], reviewNote: "Completed the Springer chapter metadata and expanded all author names.",
  },
  493: {
    title: "What Keeps Stablecoins Stable?", authors: ["Richard K. Lyons", "Ganesh Viswanath-Natraj"], sourceType: "working_paper", publishedDate: "2020-05",
    doi: "10.3386/w27136", url: "https://www.nber.org/papers/w27136",
    abstract: "The paper studies the mechanisms that maintain stablecoin pegs using exchange-rate economics and detailed trade and order-book data. Focusing on Tether, it finds a limited stabilising role for issuance and stronger demand-side arbitrage, while safe-haven demand, liquidity and collateral concerns explain peg-price deviations.",
    keywords: ["stablecoins", "Tether", "arbitrage", "safe haven", "liquidity", "collateral"], keywordsSource: "extracted",
    tagIds: [7, 8, 9, 26, 50], reviewNote: "Replaced the earlier SSRN metadata with the authoritative NBER working-paper record.",
  },
  495: {
    authors: ["Ahmed Mahrous", "Maurantonio Caprolu", "Roberto Di Pietro"], keywordsSource: "extracted",
    tagIds: [7, 11, 28, 29], reviewNote: "Verified the IEEE DOI and expanded all author names.",
  },
  505: {
    title: "The Emerging Autonomy-Stability Choice for Stablecoins", authors: ["Maarten R. C. van Oordt"], sourceType: "working_paper", publishedDate: "2022-02-15",
    doi: "10.2139/ssrn.4041945", url: "https://papers.tinbergen.nl/22015.pdf",
    abstract: "The paper explains how stablecoin peg deviations may arise when an issuer loses access to the traditional payment system. It argues that reliable payment-system access gives regulators leverage over fiat-backed stablecoins and creates a choice between regulated stability and greater transactional autonomy.",
    keywords: ["stablecoins", "autonomy", "peg stability", "payment systems", "regulation"], keywordsSource: "extracted",
    tagIds: [1, 7, 14], reviewNote: "Replaced the generic book URL and abbreviated author with the Tinbergen Institute paper.",
  },
  507: {
    authors: ["Haerang Park"], publishedDate: "2026-03-17", doi: "10.1080/13504851.2026.2637686",
    url: "https://www.tandfonline.com/doi/full/10.1080/13504851.2026.2637686",
    abstract: "This article examines whether stablecoin depegging exhibits a common component across tokens. It studies co-movement in deviations from target values and discusses how shared market conditions and cross-token linkages can transmit peg instability.",
    keywords: ["stablecoins", "depegging", "commonality", "co-movement", "contagion"], keywordsSource: "generated",
    tagIds: [7, 13], reviewNote: "Completed the Taylor & Francis DOI, date and full author name; summary remains marked AI-generated.",
  },
  511: {
    title: "Regulatory Regime for Stablecoin Issuers", authors: ["Hong Kong Monetary Authority"], sourceType: "gov_document", publishedDate: "2025-08-01",
    url: "https://www.hkma.gov.hk/eng/key-functions/international-financial-centre/stablecoin-issuers/",
    abstract: "The Hong Kong regulatory regime implements the Stablecoins Ordinance (Cap. 656) and requires a licence for issuing fiat-referenced stablecoins within scope. HKMA materials set out licensing, reserve, redemption, governance, risk-management, disclosure and supervisory requirements for issuers.",
    keywords: ["Hong Kong", "Stablecoins Ordinance", "fiat-referenced stablecoins", "issuer licensing", "reserves"], keywordsSource: "generated",
    tagIds: [1, 9, 14, 17, 41], reviewNote: "Replaced a non-standard reference-list title with HKMA's official regime page.",
  },
  514: {
    authors: ["Yiping Huang", "Yang Ji", "Juan Lin", "Dan Su", "Peng Wang"], publishedDate: "2025-11",
    abstract: "The article studies risk transmission between cryptocurrency and traditional financial markets through stablecoins. It analyses how stablecoin linkages can weaken the boundary between crypto and non-crypto assets and amplify cross-market spillovers, with implications for market structure and systemic-risk monitoring.",
    keywords: ["stablecoins", "risk transmission", "crypto markets", "financial markets", "systemic risk"], keywordsSource: "generated",
    tagIds: [13, 20, 26], reviewNote: "Completed the Elsevier DOI metadata and all five author names; summary remains marked AI-generated.",
  },
  516: {
    authors: ["Lucy Huo", "Ariah Klages-Mundt", "Andreea Minca", "Frederik Christian Münter", "Mads Rude Wind"],
    keywordsSource: "extracted", tagIds: [2, 7, 11, 33, 53], reviewNote: "Verified the Springer chapter DOI and expanded all author names.",
  },
  517: {
    authors: ["Lucy Huo", "Ariah Klages-Mundt", "Andreea Minca", "Frederik Christian Münter", "Mads Rude Wind"],
    keywordsSource: "extracted", tagIds: [2, 7, 11, 33, 53], reviewNote: "Verified the arXiv record, expanded authors and decoded the stored abstract.",
  },
  537: {
    title: "On the Relationship between Tether and Other Cryptocurrencies", authors: ["Danusha Rajapaksa", "Enchuan Shao"], sourceType: "working_paper", publishedDate: "2025",
    url: "https://www.danusharajapaksa.com/research",
    abstract: "The study examines the relationship between Tether's price, Bitcoin and Tether's circulating supply across distinct volatility regimes. It proposes triangular arbitrage as a mechanism explaining the market structure and Tether's ability to maintain its peg.",
    keywords: ["Tether", "Bitcoin", "triangular arbitrage", "price stability", "circulating supply"], keywordsSource: "extracted",
    tagIds: [7, 26, 50], reviewNote: "Matched the item to the author's research page and expanded both names.",
  },
  545: {
    authors: ["Gregory Gadzinski", "Alessio Castello", "Florie Mazzorana"], sourceType: "journal_article", publishedDate: "2023",
    doi: "10.1016/j.frl.2022.103611", url: "https://doi.org/10.1016/j.frl.2022.103611",
    abstract: "The article tests whether protocol design affects stablecoin price dynamics. It distinguishes custodial coins backed by fiat from non-custodial coins relying on crypto collateral or algorithms, then uses community detection to compare observed price clusters with design categories and identifies several important exceptions.",
    keywords: ["stablecoins", "protocol design", "custodial", "collateralization", "algorithmic", "community detection"], keywordsSource: "extracted",
    tagIds: [1, 2, 3, 7], reviewNote: "Updated the SSRN draft to the published Finance Research Letters DOI and full author names.",
  },
};

const rejected: Record<number, { reasonId: number; note: string }> = {
  350: { reasonId: 8, note: "No publisher, journal issue, DOI, repository record or independently verifiable bibliographic record was found. The generic author list and ResearchGate-only upload are insufficient to establish scholarly authenticity." },
  454: { reasonId: 8, note: "No authoritative publisher, DOI, repository or independent bibliographic record could be found for this title and author list." },
  512: { reasonId: 8, note: "No standalone HKMA document with this title could be found. The reference appears to combine requirements from several real guidelines into a generated title." },
  518: { reasonId: 8, note: "The submitted IEEE DOI is invalid, IEEE Access was entered as an author, and no matching publication could be found." },
  552: { reasonId: 8, note: "No publisher, author profile, working-paper series or independent bibliographic record could be found for this title and author." },
};

const duplicateJobIds = [368, 413, 465, 468, 480, 485, 501, 560];

function manualReport(note: string) {
  return {
    checks: [
      { field: "source", status: "✅", detail: note },
      { field: "metadata", status: "✅", detail: "Title, authors, date and source type were reconciled during administrator review." },
    ],
    hasFailure: false,
    hasWarning: false,
  };
}

async function insertReviewedJob(jobId: number, patch: ReviewPatch): Promise<"approved" | "duplicate" | "missing"> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${jobId})`);
    const [job] = await tx.select().from(uploadJobsTable).where(eq(uploadJobsTable.id, jobId)).limit(1);
    if (!job) return "missing";
    const draft = ((job.result as any)?.draft ?? {}) as JobDraft;
    const title = patch.title?.trim() || draft.title?.trim() || (job.input as any)?.fileName || `Upload job ${jobId}`;
    const authors = patch.authors ?? draft.authors ?? [];
    const doi = cleanDoi(patch.doi !== undefined ? patch.doi : draft.doi);
    const url = patch.url !== undefined ? patch.url : (draft.url ?? null);
    const publishedDate = patch.publishedDate !== undefined
      ? patch.publishedDate
      : (draft.publishedDate ?? (draft.year ? String(draft.year) : null));
    const abstract = cleanText(patch.abstract !== undefined ? patch.abstract : draft.abstract);
    const keywords = patch.keywords ?? draft.keywords ?? [];
    const keywordsSource = keywords.length > 0 ? (patch.keywordsSource ?? draft.keywordsSource ?? "manual") : null;

    const duplicateConditions = [
      doi ? eq(resourcesTable.doi, doi) : undefined,
      url ? eq(resourcesTable.url, url) : undefined,
    ].filter(Boolean) as any[];
    if (duplicateConditions.length > 0) {
      const [existing] = await tx.select({ id: resourcesTable.id }).from(resourcesTable)
        .where(duplicateConditions.length === 1 ? duplicateConditions[0] : or(...duplicateConditions)).limit(1);
      if (existing) {
        await tx.delete(uploadJobsTable).where(eq(uploadJobsTable.id, jobId));
        return "duplicate";
      }
    }

    const [resource] = await tx.insert(resourcesTable).values({
      title,
      authors,
      sourceType: patch.sourceType ?? draft.sourceType ?? "journal_article",
      url,
      doi,
      abstract,
      keywords,
      keywordsSource,
      publishedDate,
      status: "approved",
      createdBy: job.createdBy,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      adminEdited: true,
      verificationReport: manualReport(patch.reviewNote),
      verifiedAt: new Date(),
      aiReviewStatus: "safe",
      aiReviewSummary: patch.reviewNote,
      aiReviewDetails: { source: "administrator_batch_reconciliation", sourceJobId: jobId },
      aiReviewedAt: new Date(),
    }).returning();

    await syncResourceAuthors(resource.id, authors, tx);
    if (patch.tagIds.length > 0) {
      await tx.insert(resourceTagsTable).values(patch.tagIds.map((tagId) => ({
        resourceId: resource.id,
        tagId,
        source: "manual" as const,
      }))).onConflictDoNothing();
    }
    await tx.delete(uploadJobsTable).where(eq(uploadJobsTable.id, jobId));
    return "approved";
  });
}

async function rejectJob(jobId: number, decision: { reasonId: number; note: string }): Promise<boolean> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${jobId})`);
    const [job] = await tx.select().from(uploadJobsTable).where(eq(uploadJobsTable.id, jobId)).limit(1);
    if (!job) return false;
    const draft = ((job.result as any)?.draft ?? {}) as JobDraft;
    const title = draft.title?.trim() || (job.input as any)?.title || (job.input as any)?.fileName || `Upload job ${jobId}`;
    const authors = draft.authors ?? [];
    const [resource] = await tx.insert(resourcesTable).values({
      title,
      authors,
      sourceType: draft.sourceType ?? "report",
      url: draft.url ?? null,
      doi: cleanDoi(draft.doi),
      abstract: cleanText(draft.abstract),
      keywords: draft.keywords ?? [],
      keywordsSource: draft.keywords?.length ? (draft.keywordsSource ?? "generated") : null,
      publishedDate: draft.publishedDate ?? (draft.year ? String(draft.year) : null),
      status: "rejected",
      createdBy: job.createdBy,
      rejectionReasonId: decision.reasonId,
      rejectionNote: decision.note,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      adminEdited: true,
      verificationReport: {
        checks: [{ field: "source", status: "❌", detail: decision.note }],
        hasFailure: true,
        hasWarning: false,
      },
      verifiedAt: new Date(),
      aiReviewStatus: "risk",
      aiReviewSummary: decision.note,
      aiReviewDetails: { source: "administrator_batch_reconciliation", sourceJobId: jobId },
      aiReviewedAt: new Date(),
    }).returning();
    await syncResourceAuthors(resource.id, authors, tx);
    await tx.delete(uploadJobsTable).where(eq(uploadJobsTable.id, jobId));
    return true;
  });
}

const summary = { approved: [] as number[], rejected: [] as number[], duplicatesDeleted: [] as number[], alreadyHandled: [] as number[] };

for (const [idText, patch] of Object.entries(approved)) {
  const id = Number(idText);
  const result = await insertReviewedJob(id, patch);
  if (result === "approved") summary.approved.push(id);
  else if (result === "duplicate") summary.duplicatesDeleted.push(id);
  else summary.alreadyHandled.push(id);
}

for (const [idText, decision] of Object.entries(rejected)) {
  const id = Number(idText);
  if (await rejectJob(id, decision)) summary.rejected.push(id);
  else summary.alreadyHandled.push(id);
}

for (const id of duplicateJobIds) {
  const removed = await db.delete(uploadJobsTable).where(eq(uploadJobsTable.id, id)).returning({ id: uploadJobsTable.id });
  if (removed.length > 0) summary.duplicatesDeleted.push(id);
  else if (!summary.alreadyHandled.includes(id)) summary.alreadyHandled.push(id);
}

console.log(JSON.stringify(summary, null, 2));
await pool.end();
