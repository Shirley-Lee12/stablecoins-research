import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import {
  ASIA_NAV,
  PATHS,
  MISCONCEPTIONS,
  UNKNOWN_ITEMS,
  productsFor,
  type Bilingual,
  type AsiaKey,
} from "@/data/asia-developments";
import { useLanguage } from "@/lib/language-context";
import {
  AsiaShell,
  AsiaSection,
  AsiaTimeline,
  Cite,
  Copy,
  FrozenDiagram,
  Note,
  ProductMatrix,
  RegulatoryMatrix,
} from "@/components/asia-development-ui";

function Lines({ items, ids = [] }: { items: Bilingual[]; ids?: string[] }) {
  return (
    <>
      <ul className="space-y-3 text-sm leading-7 sm:text-base">
        {items.map((item, i) => (
          <li className="flex gap-3" key={item[0]}>
            <span className="shrink-0 pt-0.5 font-mono text-xs text-primary">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>
              <Copy value={item} />
            </span>
          </li>
        ))}
      </ul>
      <Cite ids={ids} />
    </>
  );
}
function TextBlock({
  title,
  body,
  ids = [],
}: {
  title: Bilingual;
  body: Bilingual;
  ids?: string[];
}) {
  return (
    <article className="min-w-0 border-l-2 border-primary/40 pl-4">
      <h3 className="text-lg font-semibold">
        <Copy value={title} />
      </h3>
      <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">
        <Copy value={body} />
        <Cite ids={ids} />
      </p>
    </article>
  );
}
function Unknowns({ page }: { page: AsiaKey }) {
  const { t } = useLanguage();
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-muted-foreground">
        {t("What remains UNKNOWN", "仍未确认的信息")}
      </h3>
      {UNKNOWN_ITEMS.filter((i) => i.key === page).map((i) => (
        <p className="mt-2 text-sm leading-7" key={i.copy[0]}>
          <Copy value={i.copy} />
          <Cite ids={i.ids} />
        </p>
      ))}
    </div>
  );
}
function PathSummaries() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {PATHS.map((p, i) => (
        <TextBlock
          key={p.title[0]}
          title={ASIA_NAV[i + 1].label}
          body={p.detail}
          ids={p.sources}
        />
      ))}
    </div>
  );
}

export function AsiaDevelopmentOverviewPage() {
  const { t } = useLanguage();
  return (
    <AsiaShell page="overview">
      <AsiaSection
        id="four-paths"
        eyebrow={["01 · Policy paths", "01 · 制度路径"]}
        title={["Four places, four different routes", "四地，四条不同路线"]}
      >
        <div className="grid gap-x-8 gap-y-7 md:grid-cols-2">
          {PATHS.map((p, i) => (
            <article
              className="border-l-2 border-primary/40 pl-4"
              key={p.title[0]}
            >
              <p className="text-xs text-muted-foreground">
                <Copy value={ASIA_NAV[i + 1].label} />
              </p>
              <h3 className="mt-2 text-xl font-semibold">
                <Copy value={p.title} />
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                <Copy value={p.detail} />
                <Cite ids={p.sources} />
              </p>
              <Link
                className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary"
                href={ASIA_NAV[i + 1].href}
              >
                {t("Explore this route", "了解这条路线")}
                <ArrowRight size={15} />
              </Link>
            </article>
          ))}
        </div>
        <FrozenDiagram
          id="REG-M01"
          title={[
            "Four regulatory and product paths — not an openness ranking",
            "四地制度与产品路径，不作“开放度”排名",
          ]}
          fallback={
            <details className="border-y border-border py-3">
              <summary className="cursor-pointer text-sm font-medium">
                {t("Read the map as text", "展开路径图文字版")}
              </summary>
              <div className="pt-5">
                <PathSummaries />
              </div>
            </details>
          }
        />
      </AsiaSection>
      <AsiaSection
        id="regulatory-matrix"
        eyebrow={["02 · Regulatory comparison", "02 · 监管比较"]}
        title={[
          "What the rules allow — and what they do not",
          "先看制度允许什么，再看牌照证明什么",
        ]}
      >
        <RegulatoryMatrix />
      </AsiaSection>
      <AsiaSection
        id="product-availability"
        eyebrow={["03 · Product availability", "03 · 产品可用性"]}
        title={[
          "Which products exist, who can access them, and how",
          "哪些产品已存在，谁能通过什么渠道获得",
        ]}
      >
        <p className="mb-5 text-sm leading-7 text-muted-foreground">
          {t(
            "These records include products, services and conceptual boundaries. e-CNY is a CBDC; issuer permissions and services are not automatically launched stablecoins.",
            "下列记录包含产品、服务与概念边界。e-CNY 是 CBDC；发行主体许可和服务牌照不能自动算作已上线稳定币。",
          )}
        </p>
        <ProductMatrix />
      </AsiaSection>
      <AsiaSection
        id="misconceptions"
        eyebrow={["04 · Reading the evidence", "04 · 读懂证据"]}
        title={[
          "Four shortcuts that lead to the wrong conclusion",
          "四个容易误读的地方",
        ]}
      >
        <div className="grid gap-6 md:grid-cols-2">
          {MISCONCEPTIONS.map((m, i) => (
            <p key={m[0]} className="flex gap-4 text-sm leading-7 sm:text-base">
              <span className="font-mono text-primary">0{i + 1}</span>
              <span>
                <Copy value={m} />
                <Cite ids={PATHS[i].sources} />
              </span>
            </p>
          ))}
        </div>
      </AsiaSection>
      <AsiaSection
        id="timeline"
        eyebrow={["05 · Timeline", "05 · 关键进展"]}
        title={[
          "Recent Regulatory & Product Milestones · 2025–2026",
          "把法规、发牌与上线放回各自的时间线",
        ]}
      >
        <AsiaTimeline />
        <Note>
          {t(
            "Singapore's consultation deadline on 16 October 2026 does not establish a final implementation date.",
            "新加坡咨询于 2026 年 10 月 16 日截止，不代表专门制度已在该日生效。",
          )}
        </Note>
      </AsiaSection>
    </AsiaShell>
  );
}

const MAINLAND_RULES: Bilingual[] = [
  ["Virtual currencies are not legal tender.", "虚拟货币不具有法偿性。"],
  [
    "Related financial business within Mainland China is prohibited.",
    "境内相关金融业务被禁止。",
  ],
  [
    "Offshore entities must not illegally provide related services into Mainland China.",
    "境外主体不得非法向境内提供相关服务。",
  ],
  [
    "Offshore issuance of RMB-referenced stablecoins requires consent.",
    "未经同意不得在境外发行挂钩人民币的稳定币。",
  ],
  [
    "Mainland entities and their controlled offshore entities must not issue virtual currencies offshore without consent.",
    "未经同意，境内主体及其控制的境外主体不得在境外发行虚拟货币。",
  ],
  [
    "Financial/payment institutions must not provide account, transfer, clearing or settlement support.",
    "金融 / 支付机构不得提供账户、划转、清算结算支持。",
  ],
  [
    "RWA tokenisation is brought within clearer regulatory boundaries.",
    "RWA 代币化进入更明确的监管边界。",
  ],
];
const MAINLAND_BOUNDARIES: { title: Bilingual; body: Bilingual }[] = [
  {
    title: ["Private stablecoin", "私人稳定币"],
    body: [
      "There is currently no lawful public private-stablecoin issuance/trading market in Mainland China.",
      "当前内地不存在面向公众的合法私人稳定币发行交易市场。",
    ],
  },
  {
    title: ["e-CNY", "数字人民币 e-CNY"],
    body: [
      "Issued by PBOC as CBDC / legal digital currency. It is not a stablecoin.",
      "中国人民银行发行的 CBDC / 法定数字货币，不是稳定币。",
    ],
  },
  {
    title: ["Approved tokenised infrastructure", "经同意的代币化基础设施"],
    body: [
      "RWA tokenisation is restricted in principle, with boundaries for competent-authority consent and specified financial infrastructure.",
      "RWA 代币化原则受限，但存在主管部门同意、特定金融基础设施边界。",
    ],
  },
];
export function MainlandChinaDevelopmentPage() {
  const { t } = useLanguage();
  const boundaryText = (
    <div className="grid gap-5 md:grid-cols-3">
      {MAINLAND_BOUNDARIES.map((b) => (
        <TextBlock key={b.title[0]} {...b} />
      ))}
    </div>
  );
  return (
    <AsiaShell page="mainland" heroIds={["SRC-CN-01", "SRC-CN-02"]}>
      <AsiaSection
        id="2026-rule"
        eyebrow={["01 · Current rule", "01 · 当前规则"]}
        title={[
          "The 2026 notice sets the current baseline",
          "2026 年规则：先明确业务与发行边界",
        ]}
        ids={["SRC-CN-01"]}
      >
        <Note>
          {t(
            "Current baseline: 银发〔2026〕42号. The 2021 notice has been superseded.",
            "当前基线：银发〔2026〕42号；2021 旧通知已废止。",
          )}
        </Note>
        <Lines items={MAINLAND_RULES} />
      </AsiaSection>
      <AsiaSection
        id="boundary-diagram"
        eyebrow={["02 · Conceptual boundaries", "02 · 概念边界"]}
        title={[
          "Private stablecoins, e-CNY and approved infrastructure are not the same",
          "私人稳定币、数字人民币与特定基础设施不能混为一谈",
        ]}
        ids={["SRC-CN-01", "SRC-CN-02"]}
      >
        <div className="hidden lg:block">{boundaryText}</div>
        <FrozenDiagram
          id="REG-D01"
          title={["Mainland digital-money boundary", "中国内地数字货币边界"]}
          fallback={boundaryText}
        />
      </AsiaSection>
      <AsiaSection
        id="e-cny"
        eyebrow={["03 · Cross-border retail pilot", "03 · 跨境零售试点"]}
        title={[
          "What a Hong Kong e-CNY wallet can do",
          "香港数字人民币钱包能做什么",
        ]}
        ids={["SRC-CN-02"]}
      >
        <Lines
          items={[
            [
              "Open a wallet with a Hong Kong phone number, without a Mainland bank account.",
              "支持香港手机号开立钱包，无需内地银行账户。",
            ],
            [
              "Top up through FPS and use the wallet for cross-border retail payments.",
              "通过 FPS 增值，进行跨境零售支付。",
            ],
            [
              "Hong Kong wallets do not currently support P2P transfers.",
              "香港钱包当前不支持 P2P 转账。",
            ],
          ]}
        />
      </AsiaSection>
      <AsiaSection
        id="user-meaning"
        eyebrow={["04 · What this means", "04 · 如何理解这条路线"]}
        title={[
          "The dividing line is the issuer and legal nature",
          "关键不是“有没有数字货币”，而是谁发行、是什么法律属性",
        ]}
      >
        <Note ids={["SRC-CN-01", "SRC-CN-02"]}>
          {t(
            "China's policy does not reject digital money; it makes different choices about issuers and legal attributes. e-CNY retail use is not private-stablecoin adoption.",
            "中国的政策不是“拒绝数字货币”，而是对发行主体与法律属性作出不同选择。数字人民币零售使用不计作私人稳定币采用。",
          )}
        </Note>
      </AsiaSection>
    </AsiaShell>
  );
}

const HK_CHECKS: Bilingual[] = [
  ["Issuer licence", "发行人牌照"],
  ["Token launch", "token 是否发行"],
  ["Authorised distributor / channel", "授权分销商 / 渠道"],
  ["User eligibility", "用户是否符合准入条件"],
];
export function HongKongDevelopmentPage() {
  const { t } = useLanguage();
  return (
    <AsiaShell page="hong-kong" heroIds={["SRC-HK-01", "SRC-HK-03"]}>
      <AsiaSection
        id="licensees"
        eyebrow={["01 · Licensed issuers", "01 · 持牌发行人"]}
        title={[
          "Two licences; two different product states",
          "同日发牌，产品状态却不同",
        ]}
        ids={["SRC-HK-02", "SRC-HK-03"]}
      >
        <div className="grid gap-7 md:grid-cols-2">
          <TextBlock
            title={[
              "Anchorpoint Financial · FRS01",
              "Anchorpoint Financial · FRS01",
            ]}
            body={[
              "Licensed on 10 Apr 2026. HKDAP offers Beta Access for institutional and corporate users.",
              "2026-04-10 获牌。HKDAP：机构 / 企业 Beta Access 已开放。",
            ]}
            ids={["SRC-HK-04"]}
          />
          <TextBlock
            title={["HSBC · FRS02", "HSBC · FRS02"]}
            body={[
              "Licensed on 10 Apr 2026. HSBC RedCoin: forthcoming / not issued.",
              "2026-04-10 获牌。HSBC RedCoin：即将推出 / 尚未发行。",
            ]}
            ids={["SRC-HK-08"]}
          />
        </div>
      </AsiaSection>
      <AsiaSection
        id="hkdap"
        eyebrow={["02 · HKDAP", "02 · HKDAP"]}
        title={[
          "Beta Access for institutional and corporate users",
          "Beta 已开放，但当前不是零售产品",
        ]}
        ids={["SRC-HK-04", "SRC-HK-05", "SRC-HK-06", "SRC-HK-07"]}
      >
        <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-3xl font-semibold tracking-tight text-primary">
              1 HKDAP = HKD 1
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {t(
                "Beta Access began on 2026-08-12",
                "Beta Access 开始于 2026-08-12",
              )}
            </p>
            <Note>
              {t(
                "Do not read Beta Access as retail availability.",
                "Beta Access 不等于零售开放。",
              )}
            </Note>
          </div>
          <Lines
            items={[
              [
                "Ethereum mainnet during Beta; access through selected authorised distributors.",
                "Beta 期间使用 Ethereum 主网，通过选定授权分销商提供。",
              ],
              [
                "Current access is limited to institutional and corporate users.",
                "当前面向机构 / 企业用户。",
              ],
              [
                "Reserve assets are held in a trust structure for holders' benefit.",
                "储备资产为持有人利益按信托结构持有。",
              ],
              [
                "Standard Chartered is the first bank authorised distributor.",
                "渣打为首家银行授权分销商。",
              ],
            ]}
          />
        </div>
      </AsiaSection>
      <AsiaSection
        id="redcoin"
        eyebrow={["03 · HSBC RedCoin", "03 · HSBC RedCoin"]}
        title={["Named, but not yet issued", "已命名，不等于已发行"]}
        ids={["SRC-HK-08", "SRC-HK-09"]}
      >
        <p className="max-w-4xl text-base leading-8">
          {t(
            "As of 2026-09-30, HSBC explicitly stated that it had not yet issued a stablecoin in Hong Kong. PayMe, HSBC HK App, P2P, payments to participating merchants and tokenised investment are planned uses — not evidence of current availability.",
            "截至 2026-09-30，HSBC 明确尚未在香港发行稳定币。PayMe、HSBC HK App、P2P、参与商户的 P2M 及代币化投资属于计划，不是当前已可用的证据。",
          )}
        </p>
      </AsiaSection>
      <AsiaSection
        id="licence-vs-availability"
        eyebrow={["04 · From licence to access", "04 · 从牌照到可用"]}
        title={[
          "Check all four steps before calling a product available",
          "判断产品可用，依次看四件事",
        ]}
      >
        <FrozenDiagram
          id="REG-D02"
          title={[
            "Hong Kong: licence versus availability",
            "香港：牌照与产品可用性的区别",
          ]}
          fallback={<Lines items={HK_CHECKS} />}
        />
        <ProductMatrix rows={productsFor("hong-kong")} filters={false} />
        <Unknowns page="hong-kong" />
      </AsiaSection>
    </AsiaShell>
  );
}

const SG_TRACKS = (
  <div className="grid gap-6 md:grid-cols-2">
    <TextBlock
      title={["Future MAS-SCS", "未来 MAS-SCS 制度"]}
      body={[
        "2023 framework design → 2026 legislative consultation → future MAS-regulated issuer/token label.",
        "2023 年框架设计 → 2026 年立法咨询 → 未来 MAS 监管的发行人 / token 标签。",
      ]}
      ids={["SRC-SG-01", "SRC-SG-02", "SRC-SG-03"]}
    />
    <TextBlock
      title={["Existing market", "已运行的市场"]}
      body={[
        "The existing PSA framework for Major Payment Institutions and DPT services → XSGD, XUSD and Circle services.",
        "PSA → MPI / DPT → XSGD、XUSD 与 Circle 服务。",
      ]}
      ids={["SRC-SG-04", "SRC-SG-05", "SRC-SG-06", "SRC-SG-07"]}
    />
  </div>
);
export function SingaporeDevelopmentPage() {
  const { t } = useLanguage();
  return (
    <AsiaShell
      page="singapore"
      heroIds={["SRC-SG-01", "SRC-SG-02", "SRC-SG-03"]}
    >
      <AsiaSection
        id="two-tracks"
        eyebrow={["01 · Two parallel tracks", "01 · 两条并行轨道"]}
        title={[
          "Do not confuse future issuer rules with today's payment-service licences",
          "未来发行人制度与现有支付服务牌照，是两条轨道",
        ]}
      >
        <div className="hidden lg:block">{SG_TRACKS}</div>
        <FrozenDiagram
          id="REG-D03"
          title={[
            "Singapore: future framework versus existing market",
            "新加坡：未来专门框架与现有市场",
          ]}
          fallback={SG_TRACKS}
        />
      </AsiaSection>
      <AsiaSection
        id="xsgd-xusd"
        eyebrow={["02 · StraitsX products", "02 · StraitsX 产品"]}
        title={[
          "XSGD and XUSD already operate under the current framework",
          "XSGD / XUSD 已在现有体系下运行",
        ]}
        ids={["SRC-SG-04", "SRC-SG-05", "SRC-SG-06"]}
      >
        <div className="grid gap-7 md:grid-cols-2">
          <TextBlock
            title={["XSGD · SGD", "XSGD · 新加坡元"]}
            body={[
              "Live; 1:1 SGD backing, monthly reserve attestations and 1:1 redemption.",
              "已上线；1:1 SGD、月度储备鉴证、1:1 赎回。",
            ]}
          />
          <TextBlock
            title={["XUSD · USD", "XUSD · 美元"]}
            body={[
              "Live; 1:1 USD backing and monthly reserve attestations.",
              "已上线；1:1 USD、月度储备鉴证。",
            ]}
          />
        </div>
      </AsiaSection>
      <AsiaSection
        id="circle"
        eyebrow={["03 · Circle / USDC", "03 · Circle / USDC"]}
        title={[
          "A regulated service provider is not a token label",
          "机构受监管，不等于 token 获得专门标签",
        ]}
        ids={["SRC-SG-07", "SRC-SG-08"]}
      >
        <p className="max-w-4xl text-base leading-8">
          {t(
            "Circle Internet Singapore is a MAS Major Payment Institution providing DPT, domestic and cross-border money-transfer services. This establishes the institution's regulatory status, not automatic MAS-SCS recognition of USDC.",
            "Circle Internet Singapore 是 MAS 大型支付机构（MPI），可提供 DPT、国内和跨境转账等服务。这能证明机构受监管，不能自动证明 USDC 已获得 MAS-SCS token 标签。",
          )}
        </p>
      </AsiaSection>
      <AsiaSection
        id="framework-labels"
        eyebrow={["04 · Labels & access", "04 · 监管标签与准入"]}
        title={[
          "Use the current regulatory description, not a future label",
          "按现行监管依据描述，不提前授予未来标签",
        ]}
      >
        <Note ids={["SRC-SG-01", "SRC-SG-02", "SRC-SG-04"]}>
          {t(
            "Describe these products as live under the existing PSA framework for Major Payment Institutions and DPT services. Do not describe them as “MAS-regulated stablecoins” under the future MAS-SCS framework.",
            "应表述为“在现有 PSA / DPT / MPI 框架下运行”，不能写成“已是 MAS-SCS 下受 MAS 监管的稳定币”。",
          )}
        </Note>
        <ProductMatrix rows={productsFor("singapore")} filters={false} />
        <Unknowns page="singapore" />
      </AsiaSection>
    </AsiaShell>
  );
}

const UAE_PERIMETERS: { title: Bilingual; body: Bilingual; ids: string[] }[] = [
  {
    title: ["CBUAE · onshore", "CBUAE · 境内体系"],
    body: [
      "CBUAE regulates onshore Payment Token Services outside the Financial Free Zones. This covers AED payment tokens and payment use.",
      "支付代币服务、AED 支付代币与支付用途；不含金融自由区。",
    ],
    ids: ["SRC-UAE-01", "SRC-UAE-04"],
  },
  {
    title: ["VARA · Dubai excluding DIFC", "VARA · 迪拜（不含 DIFC）"],
    body: [
      "VA / FRVA regime. AED-referenced tokens fall under CBUAE, not VARA.",
      "虚拟资产 / FRVA 制度；AED 参考代币归 CBUAE，不归 VARA。",
    ],
    ids: ["SRC-UAE-09", "SRC-UAE-10"],
  },
  {
    title: ["ADGM · FSRA", "ADGM · FSRA"],
    body: [
      "FRT issuance is regulated, with separate Accepted FRT requirements.",
      "FRT 发行属于受监管业务，另有 Accepted FRT 要求。",
    ],
    ids: ["SRC-UAE-11", "SRC-UAE-12"],
  },
  {
    title: ["DIFC · DFSA", "DIFC · DFSA"],
    body: [
      "Crypto Token framework; firms conduct documented suitability assessments.",
      "加密代币框架；机构须进行并记录适当性评估。",
    ],
    ids: ["SRC-UAE-16", "SRC-UAE-17"],
  },
];
export function UaeDevelopmentPage() {
  const { t } = useLanguage();
  const perimeterText = (
    <div className="grid gap-6 md:grid-cols-2">
      {UAE_PERIMETERS.map((p) => (
        <TextBlock key={p.title[0]} {...p} />
      ))}
    </div>
  );
  return (
    <AsiaShell
      page="uae"
      heroIds={["SRC-UAE-01", "SRC-UAE-09", "SRC-UAE-11", "SRC-UAE-16"]}
    >
      <AsiaSection
        id="four-perimeters"
        eyebrow={["01 · Regulatory perimeters", "01 · 监管边界"]}
        title={[
          "First locate the jurisdiction and the activity",
          "先定位辖区，再判断业务",
        ]}
      >
        <div className="hidden lg:block">{perimeterText}</div>
        <FrozenDiagram
          id="REG-M02"
          title={["Four UAE regulatory perimeters", "阿联酋四个监管边界"]}
          fallback={perimeterText}
        />
      </AsiaSection>
      <AsiaSection
        id="cbuae"
        eyebrow={["02 · CBUAE", "02 · CBUAE"]}
        title={[
          "Payment tokens: issuance, conversion and custody/transfer",
          "支付代币：发行、转换与托管转移",
        ]}
        ids={["SRC-UAE-01", "SRC-UAE-02", "SRC-UAE-03", "SRC-UAE-04"]}
      >
        <Lines
          items={[
            [
              "The Payment Token Services Regulation has been in force since 2024-08-31.",
              "支付代币服务监管条例自 2024-08-31 生效。",
            ],
            [
              "AED tokens are issued by licensed Dirham Payment Token Issuers, with par redemption.",
              "AED 代币由持牌迪拉姆支付代币发行人发行，并按面值赎回。",
            ],
            [
              "Time-based interest or rewards are not allowed; Financial Free Zones are excluded.",
              "不得提供基于持有时间的利息 / 奖励；制度不涵盖金融自由区。",
            ],
            [
              "The current register includes AED StableCoin, Zand Trust and AEDC Stable Coin. A register entry alone does not establish a token launch.",
              "当前登记册包括 AED StableCoin、Zand Trust 和 AEDC Stable Coin。登记记录本身不证明具体 token 已上线。",
            ],
          ]}
        />
      </AsiaSection>
      <AsiaSection
        id="ae-coin"
        eyebrow={["03 · AE Coin", "03 · AE Coin"]}
        title={[
          "A live AED product distributed through agents",
          "已上线的 AED 产品，通过代理分发",
        ]}
        ids={["SRC-UAE-02", "SRC-UAE-05", "SRC-UAE-06"]}
      >
        <p className="text-3xl font-semibold text-primary">1 AEC = 1 AED</p>
        <p className="mt-4 max-w-4xl text-base leading-8">
          {t(
            "Issuer: AED Stablecoin LLC. Status: licensed issuer + live product + agent-distributed. The issuer states that its own business is B2B-only; appointed agents provide end-user custody, transfer and conversion.",
            "发行人：AED Stablecoin LLC。状态：持牌发行人 + 产品已上线 + 代理分发。发行人第一方披露其自身仅服务 B2B；终端托管、转移和转换由指定代理承担。",
          )}
        </p>
      </AsiaSection>
      <AsiaSection
        id="aedz"
        eyebrow={["04 · Zand AED", "04 · Zand AED"]}
        title={[
          "AEDZ: public multi-chain, with dated reserve disclosure",
          "AEDZ：公开多链，储备披露须看日期",
        ]}
        ids={["SRC-UAE-02", "SRC-UAE-07", "SRC-UAE-08"]}
      >
        <p className="text-3xl font-semibold text-primary">1 AEDZ = 1 AED</p>
        <p className="mt-4 max-w-4xl text-base leading-8">
          {t(
            "CBUAE-regulated issuer; live product; public multi-chain; 1:1 redemption and reserve transparency. Reserve and circulation figures must always carry an as-of date.",
            "CBUAE 监管的发行人；产品已上线；公开多链；1:1 赎回与储备透明披露。动态储备和流通量数字必须始终带有时点日期。",
          )}
        </p>
      </AsiaSection>
      <AsiaSection
        id="vara-adgm-difc"
        eyebrow={["05 · Beyond onshore", "05 · 境内体系之外"]}
        title={[
          "Permissions do not transfer across perimeters",
          "不同监管边界的许可，不能互相替代",
        ]}
      >
        <div className="space-y-6">
          <TextBlock
            title={["VARA", "VARA"]}
            body={[
              "AED-referenced FRVA falls under CBUAE. VARA FRVA must not be used to pay for UAE goods or services.",
              "AED 参考 FRVA 归 CBUAE；VARA FRVA 不得用于阿联酋商品 / 服务支付。",
            ]}
            ids={["SRC-UAE-09", "SRC-UAE-10"]}
          />
          <TextBlock
            title={["ADGM / FSRA", "ADGM / FSRA"]}
            body={[
              "FRT issuance is a regulated activity. Paxos USDL, Universal Digital and JD Coinlink issuer permissions must be separated from specific product launches.",
              "FRT 发行是受监管业务。Paxos USDL、Universal Digital、JD Coinlink 等发行主体许可，必须与具体产品上线分开。",
            ]}
            ids={[
              "SRC-UAE-11",
              "SRC-UAE-12",
              "SRC-UAE-13",
              "SRC-UAE-14",
              "SRC-UAE-15",
            ]}
          />
          <TextBlock
            title={["DIFC / DFSA", "DIFC / DFSA"]}
            body={[
              "The updated Crypto Token framework took effect on 2026-01-12. Firms conduct documented suitability assessments.",
              "更新后的加密代币框架于 2026-01-12 生效，机构须进行并记录适当性评估。",
            ]}
            ids={["SRC-UAE-16", "SRC-UAE-17"]}
          />
        </div>
        <div className="mt-8">
          <ProductMatrix rows={productsFor("uae")} />
        </div>
        <Unknowns page="uae" />
        <Note>
          {t(
            "“Compliant in the UAE” is not enough. Ask: which jurisdiction, which activity, issuer or service licence, payment or investment use, and retail or institutional access?",
            "仅说“某 token 在阿联酋合规”还不够。应追问：哪个辖区、哪种业务、发行人还是服务牌照、支付还是投资用途、零售还是机构准入？",
          )}
        </Note>
      </AsiaSection>
    </AsiaShell>
  );
}
