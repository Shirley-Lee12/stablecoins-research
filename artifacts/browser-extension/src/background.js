function captureActivePage() {
  const clean = (value) => typeof value === "string" ? value.replace(/\s+/gu, " ").trim() : "";
  const metas = [...document.querySelectorAll("meta")];
  const metaValues = (keys) => {
    const wanted = new Set(keys.map((key) => key.toLowerCase()));
    return metas.flatMap((meta) => {
      const key = (meta.getAttribute("name") || meta.getAttribute("property") || meta.getAttribute("itemprop") || "").toLowerCase();
      const value = clean(meta.getAttribute("content") || "");
      return wanted.has(key) && value ? [value] : [];
    });
  };
  const firstMeta = (keys) => metaValues(keys)[0] || "";
  const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
  const jsonObjects = [];
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const parsed = JSON.parse(script.textContent || "null");
      const queue = asArray(parsed);
      while (queue.length) {
        const value = queue.shift();
        if (!value || typeof value !== "object") continue;
        jsonObjects.push(value);
        if (Array.isArray(value["@graph"])) queue.push(...value["@graph"]);
      }
    } catch { /* Ignore malformed publisher markup. */ }
  }
  const scholarlyTypes = new Set([
    "scholarlyarticle", "article", "report", "dataset", "thesis", "book", "chapter", "creativework",
    "legislation", "newsarticle", "governmentservice",
  ]);
  const jsonRecord = jsonObjects.find((entry) => asArray(entry["@type"]).some((type) => scholarlyTypes.has(String(type).toLowerCase()))) || null;
  const jsonType = clean(asArray(jsonRecord?.["@type"])[0]);
  const jsonAuthors = asArray(jsonRecord?.author).flatMap((author) => {
    if (typeof author === "string") return [clean(author)];
    if (!author || typeof author !== "object") return [];
    const name = clean(author.name || [author.givenName, author.familyName].filter(Boolean).join(" "));
    return name ? [name] : [];
  });
  const citationAuthors = metaValues(["citation_author", "eprints.creators_name"]);
  const dcAuthors = metaValues(["dc.creator", "dc.creator.personalname", "dcterms.creator"]);
  let authors = citationAuthors.length ? citationAuthors : jsonAuthors.length ? jsonAuthors : dcAuthors;
  if (authors.length === 1 && /[;；|]/u.test(authors[0])) authors = authors[0].split(/[;；|]/u).map(clean);
  authors = [...new Set(authors.filter(Boolean))].slice(0, 50);

  const title = firstMeta(["citation_title", "dc.title", "dcterms.title", "og:title", "twitter:title"])
    || clean(jsonRecord?.headline || jsonRecord?.name)
    || clean(document.querySelector("h1")?.textContent)
    || clean(document.title);
  const abstract = firstMeta(["citation_abstract", "dc.description", "dcterms.abstract", "description", "og:description"])
    || clean(jsonRecord?.abstract || jsonRecord?.description);
  const doi = firstMeta(["citation_doi", "dc.identifier", "dcterms.identifier"])
    || clean(typeof jsonRecord?.identifier === "string" ? jsonRecord.identifier : jsonRecord?.identifier?.value);
  const publishedDate = firstMeta([
    "citation_publication_date", "citation_date", "citation_online_date", "dc.date", "dcterms.issued",
    "article:published_time", "date", "datepublished",
  ]) || clean(jsonRecord?.datePublished || jsonRecord?.dateCreated);
  const keywordValues = metaValues(["citation_keywords", "keywords", "news_keywords", "dc.subject"])
    .flatMap((value) => value.split(/[;,；，|]/u));
  const jsonKeywords = Array.isArray(jsonRecord?.keywords)
    ? jsonRecord.keywords
    : typeof jsonRecord?.keywords === "string" ? jsonRecord.keywords.split(/[;,；，|]/u) : [];
  const keywords = [...new Set([...keywordValues, ...jsonKeywords].map(clean).filter(Boolean))].slice(0, 30);
  const publisher = firstMeta(["citation_publisher", "dc.publisher", "dcterms.publisher"])
    || clean(typeof jsonRecord?.publisher === "string" ? jsonRecord.publisher : jsonRecord?.publisher?.name);
  const siteName = firstMeta(["og:site_name", "application-name"]);
  const canonical = clean(document.querySelector('link[rel="canonical"]')?.href)
    || firstMeta(["citation_abstract_html_url", "og:url"])
    || location.href;

  let sourceType = "journal_article";
  const typeSignal = `${jsonType} ${firstMeta(["citation_dissertation_institution", "citation_technical_report_institution"])} ${title} ${canonical}`.toLowerCase();
  if (/dataset|data set|数据集/u.test(typeSignal)) sourceType = "dataset";
  else if (/thesis|dissertation|学位论文/u.test(typeSignal)) sourceType = "thesis";
  else if (/bookchapter|book chapter|chapter in|\.ch\d+\b|图书章节/u.test(typeSignal)) sourceType = "book_chapter";
  else if (/\bbook\b|monograph|专著/u.test(typeSignal)) sourceType = "book";
  else if (/legislation|government|regulation|congress\.gov|europarl\.europa\.eu|法案|条例/u.test(typeSignal)) sourceType = "gov_document";
  else if (/newsarticle|\/news\/|新闻/u.test(typeSignal)) sourceType = "news";
  else if (/federalreserve\.gov\/econres\/notes\/feds-notes|feds notes/u.test(typeSignal)) sourceType = "report";
  else if (/report|whitepaper|white paper|报告/u.test(typeSignal)) sourceType = "report";
  else if (/ssrn\.com|arxiv\.org|working paper/u.test(typeSignal)) sourceType = "working_paper";
  else if (/conference|proceedings|会议/u.test(typeSignal)) sourceType = "conference_paper";

  const root = document.querySelector("article, main, [role='main']") || document.body;
  const clone = root?.cloneNode(true);
  if (clone instanceof Element) {
    clone.querySelectorAll("script, style, nav, header, footer, aside, form, input, textarea, select, button, noscript, iframe").forEach((node) => node.remove());
  }
  const visibleText = clean(clone?.innerText || clone?.textContent || "").slice(0, 30_000);
  const hasHighwire = Boolean(firstMeta(["citation_title", "citation_author", "citation_doi"]));
  const hasDublinCore = Boolean(firstMeta(["dc.title", "dc.creator", "dcterms.title"]));
  const hasOpenGraph = Boolean(firstMeta(["og:title", "og:description"]));
  const methodCount = [hasHighwire, Boolean(jsonRecord), hasDublinCore, hasOpenGraph].filter(Boolean).length;
  const extractionMethod = methodCount > 1 ? "mixed"
    : hasHighwire ? "highwire"
      : jsonRecord ? "json_ld"
        : hasDublinCore ? "dublin_core"
          : hasOpenGraph ? "open_graph" : "visible_text";

  return {
    pageUrl: canonical,
    capturedAt: new Date().toISOString(),
    metadata: { title, authors, abstract, doi, publishedDate, keywords, sourceType, publisher, siteName, extractionMethod },
    visibleText,
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "CAPTURE_ACTIVE_TAB") return false;
  (async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:/u.test(tab.url || "")) throw new Error("请先打开一个普通网页，再使用采集工具。 / Open a regular web page first.");
    const results = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: captureActivePage });
    const capture = results[0]?.result;
    if (!capture?.pageUrl) throw new Error("无法读取当前页面。 / This page could not be read.");
    return capture;
  })().then((capture) => sendResponse({ ok: true, capture })).catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  return true;
});
