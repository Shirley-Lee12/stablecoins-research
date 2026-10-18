import { useLanguage } from "@/lib/language-context";
import { useDataset } from "@/hooks/use-market-data";
import {
  LENSES,
  PAYMENT_REPORT,
  STATES,
  readMetric,
  unavailable,
  displayValue,
  readPoints,
  type Copy,
  type DataMetric,
} from "@/data/market-data-model";
import {
  supplyMetrics,
  macroSeries,
  ISSUER_DISCLOSURES,
  DISCLOSURE_FIELDS,
} from "@/data/market-data";
import {
  DataFrame,
  Section,
  Note,
  MetricCard,
  MetricValue,
  Metadata,
  Text,
  Source,
  DataLink,
  SeriesChart,
  CompactHealth,
} from "@/components/market-data-ui";

function SourceHealth() {
  const supply = useDataset("stablecoin-market"),
    macro = useDataset("stablecoin-macro"),
    liq = useDataset("stablecoin-liquidity");
  const m = supplyMetrics(supply.data),
    rate = macroSeries(macro.data, ["DGS3MO"])[0].metric;
  const row = Array.isArray(liq.data?.venues)
    ? liq.data.venues.find((v: any) => v.kind === "CEX")
    : null;
  const book = readMetric(
    row?.metrics?.find((m: any) => m.metric_id === "MKT_CEX_SPREAD_BPS"),
    unavailable(
      "MKT_CEX_SPREAD_BPS",
      "Selected Binance pair",
      "SRC-MD-02",
      "Binance",
      "bps",
    ),
  );
  const { t } = useLanguage();
  return (
    <div data-source-health className="grid gap-5 md:grid-cols-2">
      {[m.total, rate, book, PAYMENT_REPORT.runrate].map((metric) => (
        <div key={metric.metric_id} className="border-l-2 border-border pl-4">
          <strong className="text-sm">
            {metric.source}
            {metric.source === "FRED" ? " · DGS3MO" : ""}
          </strong>
          <Metadata metric={metric} />
        </div>
      ))}
      <p className="col-span-full text-xs leading-6 text-muted-foreground">
        {t(
          "Each source has its own observation time. Source availability is not a system uptime claim.",
          "每个来源都有自己的观测时间。数据可用状态不代表系统可用率。",
        )}
      </p>
    </div>
  );
}
function Links() {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-2">
      {LENSES.map(([slug, en, zh]) => (
        <DataLink key={slug} href={`/market-data/${slug}`} copy={[en, zh]} />
      ))}
    </div>
  );
}
export function DashboardV02() {
  const { data } = useDataset("stablecoin-market"),
    macro = useDataset("stablecoin-macro"),
    liquidity = useDataset("stablecoin-liquidity");
  const m = supplyMetrics(data),
    rate = macroSeries(macro.data, ["DGS3MO"])[0];
  const row = Array.isArray(liquidity.data?.venues)
    ? liquidity.data.venues.find((v: any) => v.kind === "CEX")
    : null;
  const book = readMetric(
    row?.metrics?.find((m: any) => m.metric_id === "MKT_CEX_SPREAD_BPS"),
    unavailable(
      "MKT_CEX_SPREAD_BPS",
      "Selected CEX quoted spread",
      "SRC-MD-02",
      "Binance",
      "bps",
    ),
  );
  return (
    <DataFrame
      dashboard
      title={[
        "Stablecoin signals worth checking today",
        "今天值得看的稳定币信号",
      ]}
      lead={[
        "A small set of defined signals, each with its own source, observation date and coverage. Different cards can have different observation times.",
        "少量定义清楚的信号，分别标明来源、观测日期和范围。不同卡片的观测时间可以不同。",
      ]}
    >
      <Section id="core-signals" title={["Core signals", "核心信号"]}>
        <div
          data-core-signals
          className="grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          <MetricCard
            metric={m.total}
            title={["Tracked circulating value (USD)", "追踪流通价值（USD）"]}
          />
          <MetricCard
            metric={m.top2}
            title={["Top-2 supply concentration", "Top-2 供应集中度"]}
          />
          <MetricCard
            metric={m.change}
            title={[
              "30-day net change in tracked circulating value",
              "30 日追踪流通价值净变化",
            ]}
          />
          <MetricCard metric={rate.metric} title={rate.title} />
          {book.value !== null && book.freshness_state === "FRESH" && (
            <MetricCard
              metric={book}
              title={[
                `Selected CEX spread · ${row.market}`,
                `选定 CEX 价差 · ${row.market}`,
              ]}
            />
          )}
          <MetricCard
            metric={PAYMENT_REPORT.runrate}
            title={[
              "Dated adoption evidence · Aug 2025 sample",
              "带日期采用证据 · 2025 年 8 月样本",
            ]}
          />
        </div>
        <Note
          copy={[
            "The Treasury yield is macro context, not an issuer's realised reserve return. The payments figure is a report sample, not a live market total.",
            "美债收益率是宏观背景，不是发行方已实现储备回报。支付数字是报告样本，不是实时市场总额。",
          ]}
        />
        <p className="text-xs leading-6 text-muted-foreground">
          <Text copy={PAYMENT_REPORT.period} /> ·{" "}
          <Text copy={PAYMENT_REPORT.sample} />
        </p>
      </Section>
      <Section id="data-health" title={["Data health", "数据状态"]}>
        <SourceHealth />
      </Section>
      <Section id="links" title={["Explore the evidence", "查看完整证据"]}>
        <Links />
      </Section>
    </DataFrame>
  );
}
export function MarketDataV02() {
  return (
    <DataFrame
      title={[
        "Define the metric before showing the chart",
        "先定义指标，再看图表",
      ]}
      lead={[
        "Supply, trading liquidity, on-chain activity, reserves, macro conditions and adoption come from different data systems. They do not form one interchangeable measure of market activity.",
        "供应、交易流动性、链上活动、储备、宏观环境和采用来自不同数据体系，不能压成一个统一的市场活跃度。",
      ]}
    >
      <Section
        id="five-questions"
        title={["Five questions, five evidence lenses", "五个问题，五类证据"]}
      >
        <div className="divide-y divide-border">
          {LENSES.map(([slug, en, zh, body, bodyZh], i) => (
            <article
              key={slug}
              className="grid gap-3 py-5 sm:grid-cols-[12rem_minmax(0,1fr)]"
            >
              <h3 className="font-semibold">
                <span className="mr-3 font-mono text-xs text-primary">
                  0{i + 1}
                </span>
                <Text copy={[en, zh]} />
              </h3>
              <div>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                  <Text copy={[body, bodyZh]} />
                </p>
                <DataLink
                  href={`/market-data/${slug}`}
                  copy={[`Explore ${en.toLowerCase()}`, `查看${zh}`]}
                />
              </div>
            </article>
          ))}
        </div>
      </Section>
      <Section
        id="methodology"
        title={[
          "Read the definitions before comparing values",
          "比较数字之前先看定义",
        ]}
      >
        <Note
          copy={[
            "Supply ≠ trading volume ≠ transfer volume ≠ payment volume. Raw, adjusted and P2P transfers are different scopes; they are never added together.",
            "供应 ≠ 交易成交额 ≠ 转移额 ≠ 支付额。原始、调整后与 P2P 转移是不同范围，不相加。",
          ]}
        />
        <Note
          copy={[
            "Source coverage, sample periods and update frequencies differ. An unavailable observation is not zero. A report opened today remains a dated report.",
            "来源覆盖、样本期间和更新频率不同。不可用观测不是零；今天打开的报告仍是带日期的报告。",
          ]}
        />
      </Section>
      <Section id="source-status" title={["Source status", "来源状态"]}>
        <SourceHealth />
      </Section>
    </DataFrame>
  );
}
function RankedValues({
  rows,
  kind,
}: {
  rows: any[];
  kind: "asset" | "chain";
}) {
  const { t } = useLanguage();
  const items = rows.flatMap((row: any) => {
    const fallback = unavailable(
      kind === "chain" ? `CHAIN_${row.name}` : `MKT_ASSET_${row.id}`,
      row.symbol || row.name,
      "SRC-MD-01",
      "DefiLlama",
      "USD",
    );
    const m = readMetric(row.metric, fallback);
    return m.value === null ? [] : [{ row, metric: m }];
  });
  if (!items.length)
    return (
      <CompactHealth
        metric={unavailable(
          kind === "chain" ? "CHAIN_SUPPLY_USD" : "ASSET_SUPPLY",
          "Tracked value",
          "SRC-MD-01",
          "DefiLlama",
          "USD",
        )}
      />
    );
  const max = Math.max(...items.map((i) => i.metric.value!));
  return (
    <ol className="divide-y divide-border">
      {items.map(({ row, metric: m }) => (
        <li key={row.id || row.name} className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">{row.symbol || row.name}</h3>
            <span className="font-mono text-sm tabular-nums">
              {displayValue(m)} USD
            </span>
          </div>
          {max > 0 && (
            <div aria-hidden="true" className="my-3 h-1.5 bg-muted">
              <div
                className="h-full bg-primary"
                style={{ width: `${(m.value! / max) * 100}%` }}
              />
            </div>
          )}
          <Metadata metric={m} />
        </li>
      ))}
    </ol>
  );
}
function SupplyPanel() {
  const { data } = useDataset("stablecoin-market");
  const m = supplyMetrics(data);
  return (
    <>
      <div className="grid gap-7 sm:grid-cols-3">
        <MetricCard
          metric={m.total}
          title={["Tracked circulating value (USD)", "追踪流通价值（USD）"]}
        />
        <MetricCard
          metric={m.top2}
          title={["Top-2 supply concentration", "Top-2 供应集中度"]}
        />
        <MetricCard
          metric={m.change}
          title={["30-day net change", "30 日净变化"]}
        />
      </div>
      <div className="mt-8">
        <SeriesChart
          series={[
            {
              id: "supply",
              title: ["Tracked circulating value history", "追踪流通价值历史"],
              metric: m.total,
              points: m.history,
            },
          ]}
        />
      </div>
      <div className="mt-8">
        <h3 className="font-semibold">
          <Text
            copy={[
              "Ranked provider-tracked USD-target assets",
              "来源追踪的美元目标资产排序",
            ]}
          />
        </h3>
        <Note
          copy={[
            "Selected USD-target candidates with valid source amounts and prices; dated USD histories are aligned to the aggregate observation. Missing histories are omitted. Provider inclusion does not establish a legal instrument type. This is supply concentration, not trading or liquidity concentration.",
            "仅选来源数量与价格有效的美元目标候选；各币 USD 历史与总量观测日对齐。缺失历史不展示。来源收录不决定法律工具类型。这是供应集中度，不是交易或流动性集中度。",
          ]}
        />
        <RankedValues
          kind="asset"
          rows={Array.isArray(data?.ranked) ? data.ranked : []}
        />
      </div>
    </>
  );
}
function PriceDeviation() {
  const { data } = useDataset("stablecoin-depegs");
  const rows = Array.isArray(data?.tokens) ? data.tokens : [];
  return (
    <>
      {!rows.length ? (
        <CompactHealth
          metric={unavailable(
            "MKT_PRICE_DEV_BPS",
            "Observed price deviation",
            "SRC-MD-04",
            "CoinGecko",
            "bps",
          )}
        />
      ) : (
        <div className="divide-y divide-border">
          {rows.map((row: any) => {
            const m = readMetric(
              row.deviation,
              unavailable(
                "MKT_PRICE_DEV_BPS",
                "Observed price deviation",
                "SRC-MD-04",
                "CoinGecko",
                "bps",
              ),
            );
            const price = readMetric(
              row.price,
              unavailable(
                "PRICE_" + row.symbol,
                "Observed price",
                "SRC-MD-04",
                "CoinGecko",
                "USD",
              ),
            );
            return m.value !== null &&
              m.freshness_state === "FRESH" &&
              row.target === 1 ? (
              <article
                key={row.symbol}
                className="grid gap-4 py-4 sm:grid-cols-[10rem_1fr]"
              >
                <h3 className="font-semibold">{row.symbol}</h3>
                <div>
                  <p className="text-sm">
                    <Text
                      copy={[
                        "Observed price / verified target",
                        "观测价格 / 已核验目标",
                      ]}
                    />
                    : {displayValue(price)} / $1 USD
                  </p>
                  <MetricValue metric={m} />
                  <Metadata metric={m} />
                </div>
              </article>
            ) : null;
          })}
        </div>
      )}
      <Note
        copy={[
          "Observed price deviation is a price observation, not a depeg probability. Only verified USD targets with healthy timestamped observations are shown.",
          "观测价格偏离是价格观测，不是脱锚概率。仅展示目标已核验且来源与时点有效的美元目标代币。",
        ]}
      />
    </>
  );
}
const LIQ_LABELS: Record<string, Copy> = {
  CEX_BID: ["Best bid", "最优买价"],
  CEX_ASK: ["Best ask", "最优卖价"],
  MKT_CEX_SPREAD_BPS: ["Quoted spread", "报价价差"],
  MKT_CEX_BID_DEPTH_2PCT: ["Bid depth within 2%", "2% 内买方深度"],
  MKT_CEX_ASK_DEPTH_2PCT: ["Ask depth within 2%", "2% 内卖方深度"],
  MKT_CEX_BUY_100K: ["Simulated buy · 100,000 USDT", "模拟买入 · 100,000 USDT"],
  MKT_CEX_SELL_100K: [
    "Simulated sell · 100,000 USDT",
    "模拟卖出 · 100,000 USDT",
  ],
  MKT_CEX_BUY_1M: [
    "Simulated buy · 1,000,000 USDT",
    "模拟买入 · 1,000,000 USDT",
  ],
  MKT_CEX_SELL_1M: [
    "Simulated sell · 1,000,000 USDT",
    "模拟卖出 · 1,000,000 USDT",
  ],
  MKT_DEX_POOL_LIQ: ["Pool liquidity", "池流动性"],
  MKT_DEX_VOL_24H: ["Pool 24h trading volume", "池 24h 成交额"],
  DEX_PRICE: ["Pool price", "池价格"],
};
function Liquidity({ kind }: { kind: "CEX" | "DEX" }) {
  const { t } = useLanguage();
  const { data } = useDataset("stablecoin-liquidity");
  const rows = Array.isArray(data?.venues)
    ? data.venues.filter((v: any) => v.kind === kind)
    : [];
  return (
    <div data-liquidity-kind={kind}>
      <Note
        copy={
          kind === "CEX"
            ? [
                "Selected venue/pair only. Orders and depth are denominated in USDT, without assuming a USD conversion. Book observation time is the collector's sampling time; the venue event timestamp is unavailable.",
                "仅选定场所 / 交易对。订单与深度以 USDT 计价，不假定美元换算。订单簿观测为采样时点；场所事件时间不可用。",
              ]
            : [
                "DEX pool liquidity ≠ CEX order-book depth ≠ route-level executable slippage. Pool-level volume is trading activity, not payment volume.",
                "DEX 池流动性 ≠ CEX 订单簿深度 ≠ 路径级可执行滑点。池成交额是交易活动，不是支付额。",
              ]
        }
      />
      {!rows.length ? (
        <CompactHealth
          metric={unavailable(
            kind === "CEX" ? "MKT_CEX_SPREAD_BPS" : "MKT_DEX_POOL_LIQ",
            kind,
            kind === "CEX" ? "SRC-MD-02" : "SRC-MD-03",
            kind === "CEX" ? "Binance" : "DEX Screener",
            kind === "CEX" ? "bps / USDT" : "USD",
          )}
        />
      ) : (
        <div className="divide-y divide-border">
          {rows.map((row: any) => {
            const metrics: DataMetric[] = (
              Array.isArray(row.metrics) ? row.metrics : []
            )
              .filter((raw: any) => LIQ_LABELS[raw.metric_id])
              .map((raw: any) =>
                readMetric(
                  raw,
                  unavailable(
                    raw.metric_id,
                    raw.label,
                    kind === "CEX" ? "SRC-MD-02" : "SRC-MD-03",
                    row.venue,
                    raw.unit,
                  ),
                ),
              );
            const shared = metrics.find((m) => m.value !== null) || metrics[0];
            return (
              <article key={row.pool || row.market} className="min-w-0 py-5">
                <h3 className="font-semibold leading-7">
                  {row.venue} · {row.market}
                </h3>
                {kind === "DEX" && (
                  <p className="mt-1 break-all text-xs leading-6 text-muted-foreground">
                    {t("Chain / pool", "链 / 池")}: {row.chain} · {row.pool}
                  </p>
                )}
                {shared && (
                  <Metadata
                    metric={{
                      ...shared,
                      unit:
                        kind === "CEX"
                          ? "bps / USDT / USDT per base token"
                          : "USD / USD per base token",
                    }}
                  />
                )}
                <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-3">
                  {metrics.map((m) => (
                    <div key={m.metric_id} data-liquidity-metric={m.metric_id}>
                      <dt className="text-xs font-medium">
                        <Text copy={LIQ_LABELS[m.metric_id]} />
                      </dt>
                      <dd className="mt-1 text-sm font-semibold tabular-nums">
                        {displayValue(m) === null
                          ? t("Unavailable", "不可用")
                          : `${displayValue(m)} ${m.unit}`}
                      </dd>
                      {m.freshness_state !== shared?.freshness_state && (
                        <p className="text-xs leading-6 text-muted-foreground">
                          <Text copy={STATES[m.freshness_state]} />
                        </p>
                      )}
                    </div>
                  ))}
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
export function MarketStructureV02() {
  return (
    <DataFrame
      title={[
        "Supply, price stability and trading liquidity are different concepts",
        "供应规模、价格稳定与交易流动性是三件不同的事",
      ]}
      lead={[
        "Compare only measures with defined units, observation times and coverage. Selected venues and pools do not describe global liquidity.",
        "只比较单位、观测时点与覆盖明确的指标。选定场所与池不代表全市场流动性。",
      ]}
    >
      <Section
        id="supply"
        title={["Supply · tracked circulating value", "供应 · 追踪流通价值"]}
      >
        <SupplyPanel />
      </Section>
      <Section
        id="price-stability"
        title={["Observed price deviation", "观测价格偏离"]}
      >
        <PriceDeviation />
      </Section>
      <Section
        id="cex-liquidity"
        title={["Selected CEX pairs", "选定 CEX 交易对"]}
      >
        <Liquidity kind="CEX" />
      </Section>
      <Section id="dex-liquidity" title={["Selected DEX pools", "选定 DEX 池"]}>
        <Liquidity kind="DEX" />
      </Section>
      <Section id="method" title={["Interpretation boundaries", "解释边界"]}>
        <Note
          copy={[
            "Missing values are not zero. Supply, trading volume, transfer volume and payment volume answer different questions and are not aggregated.",
            "缺失值不是零。供应、成交额、转移额与支付额回答不同问题，不汇总相加。",
          ]}
        />
      </Section>
    </DataFrame>
  );
}
export function MarketOnChainV02() {
  const { data } = useDataset("stablecoin-market");
  return (
    <DataFrame
      title={[
        "High on-chain transfer activity does not automatically imply high payment adoption",
        "链上转移很多，不等于支付很多",
      ]}
      lead={[
        "Separate the location of tracked supply from transfer activity, active addresses and attributable payments. Native and bridged representations require careful coverage definitions.",
        "追踪供应分布、转移活动、活跃地址和可归因支付分别理解。原生与跨链表示需要明确覆盖口径。",
      ]}
    >
      <Section
        id="chain-supply"
        title={["Tracked supply by chain", "按链追踪供应"]}
      >
        <RankedValues
          kind="chain"
          rows={Array.isArray(data?.chains) ? data.chains : []}
        />
        <Note
          copy={[
            "Provider native/bridged classifications are retained. Do not add these chain representations to aggregate supply or infer unique economic value across bridges.",
            "保留来源原生 / 跨链分类，不把各链表示再次加到总供应中，也不据此推断桥接后的唯一经济价值。",
          ]}
        />
      </Section>
      <Section
        id="activity-hierarchy"
        title={["Transfer activity: distinct scopes", "转移活动：不同口径"]}
      >
        <div className="space-y-6">
          {(
            [
              [
                "CHAIN_RAW_TRANSFER",
                ["Raw transfer volume", "原始转移额"],
                [
                  "Can include internal exchange movements, protocol interactions, bots, MEV and repeated economic activity.",
                  "可能包括交易所内部流转、协议交互、机器人、MEV 和重复经济活动。",
                ],
                "SRC-MD-07",
              ],
              [
                "CHAIN_ADJ_TRANSFER",
                ["Artemis-adjusted transfer volume", "Artemis 调整后转移额"],
                [
                  "Historical / retired methodology. Artemis-adjusted volume deduplicated activity and excluded intra-exchange transfers and MEV. This flavor is no longer maintained and its endpoint is retired. Gross volume is not a continuous replacement.",
                  "历史 / 已退役口径。Artemis 调整后转移额曾去重并剔除交易所内部转移和 MEV；该口径已不再维护，接口已退役。Gross 转移额不是原指标的连续替代。",
                ],
                "SRC-MD-08",
              ],
              [
                "CHAIN_P2P_TRANSFER",
                ["P2P transfer volume", "P2P 转移额"],
                [
                  "Historical / retired methodology. The P2P flavor is no longer maintained and its endpoint is retired. Wallet-to-wallet / EOA activity is not merchant or attributable payment activity.",
                  "历史 / 已退役口径。P2P 口径已不再维护，接口已退役。钱包 / EOA 间活动不等于商户支付或可归因支付。",
                ],
                "SRC-MD-09",
              ],
            ] as const
          ).map(([id, title, note, source]) => (
            <div key={id as string}>
              <h3 className="font-semibold">
                <Text copy={title as Copy} />
              </h3>
              <Note copy={note as Copy} />
              <CompactHealth
                metric={unavailable(
                  id as string,
                  (title as Copy)[0],
                  source as string,
                  "Artemis",
                  "USD",
                )}
              />
            </div>
          ))}
        </div>
        <Note
          copy={[
            "No licensed dynamic observations are available here. Raw, adjusted and P2P volumes are alternative scopes and must not be added. Attributable payments require separate evidence.",
            "此处暂无已获许可的动态观测。原始、调整后与 P2P 是不同口径，不可相加；可归因支付需要额外证据。",
          ]}
        />
        <DataLink
          href="/market-data/adoption"
          copy={["Attributable payment evidence", "可归因支付证据"]}
        />
      </Section>
      <Section
        id="addresses"
        title={["Active addresses are not users", "活跃地址不是用户"]}
      >
        <CompactHealth
          metric={unavailable(
            "CHAIN_ACTIVE_ADDR",
            "Active addresses",
            "SRC-MD-07",
            "Artemis",
            "addresses",
          )}
        />
        <Note
          copy={[
            "One person can control multiple addresses; a custodial address may represent multiple people. No address count is relabelled as a user count.",
            "一人可以控制多个地址；托管地址可以代表多人。地址数量不改称用户数量。",
          ]}
        />
      </Section>
      <Section id="issuance" title={["Ethereum issuance", "以太坊发行"]}>
        <CompactHealth
          metric={unavailable(
            "ETH_NET_ISSUANCE",
            "Ethereum issuance",
            "SRC-MD-05",
            "Etherscan",
            "tokens",
            "UNKNOWN_TO_VERIFY",
          )}
        />
        <Note
          copy={[
            "Issuance is not published until each contract's mint/burn, treasury flow and circulating-supply semantics are verified. Raw events alone do not establish circulating issuance.",
            "各合约铸造 / 销毁、Treasury 流与流通供应含义核验完成前，不发布发行量。仅有原始事件不足以认定流通发行。",
          ]}
        />
      </Section>
    </DataFrame>
  );
}
export function MarketIssuersV02() {
  return (
    <DataFrame
      title={[
        "Compare disclosure scopes before comparing reserve numbers",
        "比较储备之前，先比较披露口径",
      ]}
      lead={[
        "Backing claims need a report period, assurance scope, publication date and direct-redemption eligibility. Issuer disclosures are not automatically comparable.",
        "储备声明需要报告期间、核验范围、发布日期与直接赎回资格。发行方披露不自动具有可比性。",
      ]}
    >
      <Section id="issuer-table" title={["Disclosure comparison", "披露比较"]}>
        <Note
          copy={[
            "Report snapshot · source review: 16 Oct 2026. Dates below identify the disclosed period or recorded page snapshot; opening this page does not refresh a report.",
            "报告快照 · 来源核验日：2026-10-16。以下日期对应披露期间或已记录页面快照；打开本页不会刷新报告。",
          ]}
        />
        <div className="hidden lg:block">
          <table
            data-issuer-table
            className="w-full table-fixed text-left text-sm"
          >
            <caption className="sr-only">
              <Text
                copy={[
                  "Issuer disclosures, periods and scope",
                  "发行方披露、期间与范围",
                ]}
              />
            </caption>
            <thead>
              <tr className="border-y border-border">
                <th className="w-1/5 py-3">
                  <Text copy={["Token / issuer", "代币 / 发行方"]} />
                </th>
                <th className="py-3">
                  <Text
                    copy={[
                      "Period, publication and assurance",
                      "期间、发布与核验",
                    ]}
                  />
                </th>
                <th className="py-3">
                  <Text
                    copy={[
                      "Coverage, reserves and eligibility",
                      "覆盖、储备与资格",
                    ]}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {ISSUER_DISCLOSURES.map((row) => (
                <tr
                  key={row.id}
                  data-issuer-disclosure={row.id}
                  className="border-b border-border align-top"
                >
                  <th scope="row" className="py-5 pr-5 font-normal">
                    <strong>
                      <Text copy={row.issuer} />
                    </strong>
                    <p className="mt-2 text-xs text-muted-foreground">
                      <Text copy={STATES.REPORT_SNAPSHOT} />
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {row.sources.map((id) => (
                        <Source key={id} id={id} />
                      ))}
                    </div>
                  </th>
                  <td className="py-5 pr-6">
                    <DisclosureFields
                      row={row}
                      fields={DISCLOSURE_FIELDS.filter(([key]) =>
                        [
                          "scope",
                          "period",
                          "publication",
                          "provider",
                          "frequency",
                        ].includes(key),
                      )}
                    />
                  </td>
                  <td className="py-5">
                    <DisclosureFields
                      row={row}
                      fields={DISCLOSURE_FIELDS.filter(([key]) =>
                        [
                          "covered",
                          "composition",
                          "redemption",
                          "limitation",
                        ].includes(key),
                      )}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-border lg:hidden">
          {ISSUER_DISCLOSURES.map((row) => (
            <article key={row.id} data-issuer-mobile={row.id} className="py-5">
              <h3 className="font-semibold">
                <Text copy={row.issuer} />
              </h3>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                <Text copy={STATES.REPORT_SNAPSHOT} /> ·{" "}
                <Text copy={row.scope} />
              </p>
              <p className="text-xs leading-6">
                <Text copy={row.period} />
              </p>
              <p className="text-xs leading-6">
                <Text copy={["Published", "发布"]} />:{" "}
                <Text copy={row.publication} />
              </p>
              <div className="my-2 flex flex-wrap gap-3">
                {row.sources.map((id) => (
                  <Source key={id} id={id} />
                ))}
              </div>
              <details>
                <summary className="cursor-pointer py-2 text-sm text-primary underline">
                  <Text
                    copy={[
                      "Disclosure scope and redemption terms",
                      "披露范围与赎回条款",
                    ]}
                  />
                </summary>
                <DisclosureFields row={row} fields={DISCLOSURE_FIELDS} />
              </details>
            </article>
          ))}
        </div>
      </Section>
      <Section
        id="assurance-ladder"
        title={["Assurance scopes are different", "核验范围不同"]}
      >
        <Note
          copy={[
            "Attestation does not mean financial-statement audit.",
            "鉴证不等于财务报表审计。",
          ]}
        />
        <ol className="grid gap-6 sm:grid-cols-3">
          {(
            [
              [
                ["Issuer self-report", "发行方自报"],
                [
                  "The issuer reports its own figures.",
                  "发行方报告自己的数字。",
                ],
              ],
              [
                ["Attestation / examination", "鉴证 / examination"],
                [
                  "An independent provider examines specified assertions at a specified time.",
                  "独立机构核验特定时点的特定声明。",
                ],
              ],
              [
                ["Financial-statement audit", "财务报表审计"],
                [
                  "An audit covers company financial statements; its scope differs from a reserve assertion.",
                  "审计覆盖公司财务报表，与储备声明的范围不同。",
                ],
              ],
            ] as const
          ).map(([title, body]) => (
            <li key={title[0]} className="border-l-2 border-primary/30 pl-4">
              <h3 className="font-semibold">
                <Text copy={title as Copy} />
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                <Text copy={body as Copy} />
              </p>
            </li>
          ))}
        </ol>
        <Note
          copy={[
            "These categories explain scope; they are not a reserve-quality ranking or score.",
            "这些类别解释核验范围，不是储备质量排名或评分。",
          ]}
        />
      </Section>
      <Section
        id="issuer-profiles"
        title={["Issuer-specific reading notes", "各发行方阅读提示"]}
      >
        <Note
          copy={[
            "Tether's Q2 2026 reserve attestation and 2025 annual audit are separate. Circle's changing transparency values are available on its source page; this comparison records the disclosure scope. Paxos self-reports and independent attestations remain separate. FDUSD composition percentages are not reproduced without report-level verification.",
            "Tether 2026 Q2 储备鉴证与 2025 年度审计分开。Circle 持续变化的透明度数字见原始来源；此处记录披露范围。Paxos 自报与独立鉴证分开。FDUSD 构成比例未经报告级核验不展示。",
          ]}
        />
      </Section>
      <Section
        id="economics-boundary"
        title={["Company-level financial result", "公司级财务结果"]}
      >
        <Note
          copy={[
            "Company income or profit is not stablecoin reserve backing or stablecoin product profit. Circle company reporting is a separate disclosure layer; this page does not infer reserve values from company financial results.",
            "公司收入或利润不是稳定币储备支持，也不是稳定币产品利润。Circle 公司财报是独立披露层；本页不由公司财务结果推定储备值。",
          ]}
        />
        <Source id="SRC-MD-20" />
      </Section>
    </DataFrame>
  );
}
function DisclosureFields({
  row,
  fields,
}: {
  row: (typeof ISSUER_DISCLOSURES)[number];
  fields: typeof DISCLOSURE_FIELDS;
}) {
  return (
    <dl className="space-y-3">
      {fields.map(([key, title]) => (
        <div key={key}>
          <dt className="text-xs font-semibold text-primary">
            <Text copy={title} />
          </dt>
          <dd className="mt-1 text-sm leading-7 text-muted-foreground">
            <Text copy={row[key]} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
export function MarketMacroV02() {
  const { data } = useDataset("stablecoin-macro");
  return (
    <DataFrame
      title={[
        "Macro data describe the environment; they do not establish stablecoin causality.",
        "宏观数据提供环境，不提供稳定币因果结论。",
      ]}
      lead={[
        "Official FRED observations retain their units and dates. Market yields are not issuers' realised portfolio returns, and co-movement is not causal evidence.",
        "FRED 官方观测保留单位与日期。市场收益率不是发行方已实现组合回报，同步变动不构成因果证据。",
      ]}
    >
      {(
        [
          [
            "short-rates",
            ["USD short-rate environment", "美元短端利率环境"],
            ["SOFR", "DGS3MO", "EFFR"],
          ],
          [
            "curve",
            ["Treasury curve points", "美债收益率曲线点"],
            ["DGS3MO", "DGS2", "DGS10"],
          ],
          ["dollar", ["Broad USD", "广义美元"], ["DTWEXBGS"]],
          ["stress", ["Market-stress context", "市场压力背景"], ["VIXCLS"]],
          [
            "rrp",
            [
              "Money-market liquidity · separate USD bn axis",
              "货币市场流动性 · 独立 USD bn 轴",
            ],
            ["RRPONTSYD"],
          ],
          [
            "asia-fx",
            ["Asia FX · local currency per USD", "亚洲汇率 · 本币 / 美元"],
            ["DEXCHUS", "DEXHKUS", "DEXSIUS"],
          ],
        ] as const
      ).map(([id, title, ids]) => (
        <Section key={id as string} id={id as string} title={title as Copy}>
          <SeriesChart
            series={macroSeries(data, [...ids] as string[])}
            normalise={id === "asia-fx"}
          />
          {id === "asia-fx" && (
            <Note
              copy={[
                "The selected FX series is normalised to its first valid non-zero observation = 100. Tooltips retain the raw local-currency-per-USD quote.",
                "所选汇率序列按首个有效非零观测 = 100 归一化；提示保留每美元对应本币的原始报价。",
              ]}
            />
          )}
        </Section>
      ))}
    </DataFrame>
  );
}
export function MarketAdoptionV02() {
  return (
    <DataFrame
      title={[
        "Adoption evidence must identify who is using stablecoins, for what, and in what sample.",
        "采用证据必须回答：谁在用、用于什么、样本有多大。",
      ]}
      lead={[
        "Keep attributable payment research, on-chain activity and issuer-defined metrics separate. No combined adoption total is calculated.",
        "可归因支付研究、链上活动与发行方定义指标分开。不计算综合采用总额。",
      ]}
    >
      <Section
        id="payment-sample"
        title={[
          "Attributable payment research · dated sample",
          "可归因支付研究 · 带日期样本",
        ]}
      >
        <p className="text-sm font-semibold">
          <Text copy={PAYMENT_REPORT.period} />
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          <Text copy={PAYMENT_REPORT.sample} /> ·{" "}
          <Text copy={["Published: Oct 2025", "发布：2025 年 10 月"]} />
        </p>
        <div className="mt-5 grid gap-8 sm:grid-cols-2">
          <MetricCard
            metric={PAYMENT_REPORT.cumulative}
            title={[
              "Attributable sampled payments · study total",
              "可归因支付样本 · 研究期累计",
            ]}
          />
          <MetricCard
            metric={PAYMENT_REPORT.runrate}
            title={[
              "Annualised run rate · Aug 2025 sample",
              "年化运行规模 · 2025 年 8 月样本",
            ]}
          />
        </div>
        <Note
          copy={[
            "This dated, sampled estimate is not a live 2026 total or the entire global stablecoin payment market.",
            "这是带日期的样本估算，不是 2026 年实时总额，也不是全球稳定币支付全市场。",
          ]}
        />
      </Section>
      <Section
        id="categories"
        title={["Payment categories in the report", "报告中的支付类别"]}
      >
        <p className="text-sm leading-8">B2B · P2P · Card · B2C · Prefunding</p>
        <Note
          copy={[
            "Read category estimates in the report using its Aug 2025 annualised period and sample definitions.",
            "请在报告中按其 2025 年 8 月年化期间与样本定义阅读分类估算。",
          ]}
        />
        <Source id="SRC-MD-10" />
      </Section>
      <Section
        id="evidence-classes"
        title={[
          "Three evidence classes · never added together",
          "三类证据 · 不相加",
        ]}
      >
        <div className="divide-y divide-border">
          {(
            [
              [
                ["Attributable payment research", "可归因支付研究"],
                [
                  "Payer, recipient, merchant, invoice or payment-service evidence within an explained research sample.",
                  "在明确研究样本中，采用付款方、收款方、商户、发票或支付服务证据。",
                ],
              ],
              [
                ["On-chain activity", "链上活动"],
                [
                  "Transfers, transactions and active addresses describe network activity, not automatically payment use.",
                  "转移、交易与活跃地址描述网络活动，不自动等于支付使用。",
                ],
              ],
              [
                ["Issuer-reported activity", "发行方报告活动"],
                [
                  "Wallets, network participants and payment-network activity retain issuer definitions and dates.",
                  "钱包、网络参与机构与支付网络活动保留发行方定义和日期。",
                ],
              ],
            ] as const
          ).map(([title, body]) => (
            <article
              key={title[0]}
              className="grid gap-3 py-5 sm:grid-cols-[14rem_1fr]"
            >
              <h3 className="font-semibold">
                <Text copy={title as Copy} />
              </h3>
              <p className="text-sm leading-7 text-muted-foreground">
                <Text copy={body as Copy} />
              </p>
            </article>
          ))}
        </div>
        <Note
          copy={[
            "Transfer volume, wallet counts, partner counts and circulation alone do not establish merchant adoption or broad payment adoption.",
            "仅有转移额、钱包数、合作方数或流通量，不足以证明商户采用或广泛支付采用。",
          ]}
        />
      </Section>
      <Section
        id="issuer-activity"
        title={[
          "Issuer-defined activity needs its own evidence",
          "发行方活动需要独立证据",
        ]}
      >
        <Note
          copy={[
            "Issuer reporting is kept separate from the Artemis sample. No issuer wallet, on-chain volume or payment-network statistic is reproduced here without a dated, verified observation and its definition.",
            "发行方报告与 Artemis 样本分开。没有带日期且已核验的观测及定义时，不复制发行方钱包、链上交易额或支付网络统计。",
          ]}
        />
        <Source id="SRC-MD-20" />
      </Section>
      <Section
        id="links"
        title={["Applications and observed use", "应用与实际使用"]}
      >
        <div className="flex flex-wrap gap-x-8">
          <DataLink
            href="/about-stablecoins/applications"
            copy={["What stablecoins can do", "稳定币可以做什么"]}
          />
          <DataLink
            href="/market-data/on-chain"
            copy={["On-chain activity and its limits", "链上活动与局限"]}
          />
        </div>
      </Section>
    </DataFrame>
  );
}
