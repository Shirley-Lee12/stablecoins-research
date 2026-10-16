# Market Data + Dashboard V0.2 施工与验收

日期：2026-10-16。状态：`APPROVED_FOR_MERGE`。用户已通过最终数据治理、内容、动态状态与视觉验收，并授权创建独立本地 Git commit；不 push、不部署 Render。

## 唯一施工源与完整性

唯一研究施工源：项目根目录 `Market_Data_Dashboard_Codex_Ready_Package_V0.2.zip`。

- ZIP：172533 bytes；SHA-256 `29b367bc2b56a297573cfd3699dcfcc5df8c79e1757e1469bae764d6c0072e55`。
- 原样解压于 `docs/source-packages/market_data_dashboard_package_v0.2/`，31 个文件逐项 bytes / SHA-256 与 ZIP entry 一致。
- 已依次读取请求指定的 16 项治理、QA、组件、数据与图表规范，并读取双语正文及其相关 manifest。
- 非阻断 metadata discrepancy：`PACKAGE_INVENTORY.json` 对自身记录 1399 bytes，实际为 2198 bytes。其余 30 项大小一致。原始 ZIP 与解压文件均未为此修改。
- 本包无 frozen SVG；未改动先前 About V0.2 source package 或九张 frozen SVG。
- 原始 package 核验记录：`outputs/market-data-dashboard-v02-qa-2026-10-16/package-integrity.json`。

## 七个路由

| 路由 | 实现 |
| --- | --- |
| `/dashboard` | 5 个基础信号；仅在 Binance 有健康观测时加入第 6 个流动性信号。各卡独立来源、日期、单位和状态。无研究数量或脱锚 KPI。 |
| `/market-data` | 五个数据视角、口径说明和紧凑 Data Health；不复制 Dashboard。 |
| `/market-data/market` | 真实供应历史、对齐日期的候选资产与供应集中度、条件式当前价格偏离；CEX 与 DEX 分区。 |
| `/market-data/on-chain` | 真实链上供应分布；transfer、adjusted、P2P、payments、active addresses 分别解释。不可用的活动指标不画图。 |
| `/market-data/issuers-reserves` | 六个独立披露范围记录；桌面对照、手机展开，保留报告期间、发布日期、provider、范围、赎回条件和限制。 |
| `/market-data/macro` | FRED 实际日期序列；利率、曲线点、美元、VIX、RRP、亚洲 FX 分区，避免不同单位共轴。 |
| `/market-data/adoption` | Artemis dated report snapshot、分类名称、研究期/样本/限制；三类证据分开，报告数字不称实时或全球总量。 |

保留既有双语、class-based light/dark theme、学术蓝、桌面 source tooltip 与手机 popover。导航及站点级其他栏目保持原有结构。

## 数据源与 collector 复用

| 来源 | 复用/修正 | 本地真实源 QA |
| --- | --- | --- |
| DefiLlama | 现有市场 endpoints；仅采纳美元估值字段；总量、链、候选资产使用有效 dated histories；30 日变化需可比历史点 | 供应、资产、链源可用；页面真实历史可读 |
| FRED CSV | 现有 11 个 series；各序列独立失败回退、真实观测日、缺口为 null，五自然日 freshness tolerance | 真实 CSV 可用；部分美元/FX 最新观测落后，保留 Delayed 状态 |
| Binance | 现有 spot ticker / order-book collector；按 pair 区分 bid、ask、spread、2% bid/ask depth、双向模拟成交成本 | 本次三个交易对有有效观测；缺失字段/交易对仍为空缺 |
| DEX Screener | 现有 pool collector，保留 chain/pool/source date；pool liquidity/volume 不混称 CEX 深度 | 本次采集失败，紧凑 Unavailable，无空图或零线 |
| CoinGecko | 复用当前价格采集入口，增加 verified USD target / timestamp / freshness gate | 本地无可用 key 配置且无健康价格快照；当前偏离模块显示不可用 |
| Etherscan | 原 collector 保留内部；本轮关闭公开调度及数据投影 | issuance/circulation contract semantics 待核验；holder concentration 继续 HOLD / hidden |

Binance quote currency 明确为 USDT，不默认换算为 USD。2% 深度为选定交易对的 order-book 深度；100k / 1m 模拟使用 USDT quote notional。采集时间不冒充交易所事件时间；5000 档覆盖上限和不足深度的不可用状态保留。DEX 仅展示 pool 层字段。

DefiLlama provider-tracked universe 并非全世界全部稳定币；候选排序不作为法律分类。native/bridged 保留来源口径，不再次累加为总量。旧页面未被复用为研究事实来源。

## Report snapshot / Conditional / HOLD

- Artemis：保留报告快照。$136B 累计与 Aug 2025 $122B 年化分开，研究期 Jan 2023–Aug 2025，Oct 2025 发布，22 家受访加 11 家估算；不称 2026 live 市场。包中仅有 B2B/P2P/Card/B2C/Prefunding 分类名称，无分类金额，故不补旧数值、不画假条形图，提供原报告入口。
- Raw / adjusted / P2P / active-address 动态数据：没有现有合法可用的 Artemis API/key/licensing 配置，展示来源与紧凑不可用状态，不从 raw transfer 推导 payments 或 users。
- Circle：未发现已验证动态透明度 parser；保留 12 Oct 2026 页面范围记录及源链接，不展示未经集成验证的当前储备数字。
- Issuer disclosures：所有记录按包内 dated snapshot / report scope 呈现。包内没有可直接发布的逐项数值，不从其他页面拼接储备金额。
- FDUSD：不硬编码未经 report-level QA 的组成比例；provider/发布日期未核实之处明确保留未知。
- Observed price deviation：只有当前健康且目标已验证的价格观测才可展示。公开接口不返回历史 threshold events、count/ranking/duration、probability、risk score；Dashboard 无 depeg KPI。旧 detector 仅保留内部研究用途。
- Holder concentration：HOLD / hidden；即使未来有 holder API，也不自动公开。issuance/circulation 不作为同义词。

## Issuer disclosure 验收

- Tether Q2 2026 reserve attestation：30 Jun 2026 报告期、31 Jul 2026 发布、BDO；与 2025 年度公司财务报表 KPMG U.S. audit 独立记录，后者 13 Aug 2026 announcement。年度公司审计不把季度鉴证变成 audit。
- Circle：动态透明度页面范围、月度鉴证与公司财务报表分开；公司利润不代替 reserve backing。
- Paxos：issuer self-report 与 independent attestation / examination 分列；KPMG independent scope 不覆盖所有自报材料，未补缺失月份。
- FDUSD：保留报告范围、日期限制及来源，不加入未经核验的 reserve composition percentages。
- 各项均保留 direct redemption eligibility；普通 token holder 不等于可直接向发行人赎回的客户。

## Data Health 与 missing != 0

统一合同携带 source/source_url/source_id、observation/report period、publication date（若有）、freshness state、unit、methodology、coverage、estimate/adjustment scope。获取时间独立存放，不覆盖观测日期。报告未给准确发布日时显示包内月份/未知，不编造日期。

前后端拒绝 null、缺失、空白、无效数字/日期、布尔值和非法结构。明确的真实 0 可以显示；缺失或 failed/rate-limit/parse-error/empty 不转为 0。缺少可比 30 日点不计算变化；FRED 非发布日保留 null 缺口；不 connectNulls，不画 placeholder trend。

- 首次无有效观测：紧凑 Unavailable / Unknown，不占大块图表高度。
- 来源观测过旧：Delayed，显示原日期。
- 刷新失败且有旧值：Last successful snapshot、弱化数字、保留原值/原观测日和方法；后续缓存读取也保持该状态，直到真正成功。
- 报告：始终 Report snapshot，不因页面刷新升级为 Live。
- DefiLlama/FRED 使用进程缓存；重启后若没有成功数据，显示不可用，不承诺跨进程历史回退。现有流动性持久化适配保留。

真实源故障演练使用本机 `scripts/market-data-qa-runtime.mjs`，加载实际生产 collector/router，但持久化由内存替代、写入认证接口被拒绝、只绑定 127.0.0.1:3001，不连接或改写数据库。正常获取后强制外部 fetch 失败：市场 23 项、宏观 11 项、流动性 26 项有效指标的值和原日期全部保持，状态为 Last successful snapshot；原不可用字段仍 Unavailable。Dashboard 此时为 5 个核心信号；恢复后为 6 个，报告仍 Report snapshot。

证据：`failure-before.json`、`failure-after.json`、`failure-summary.json`、`dashboard-last-successful-desktop.png`。演练结束已恢复真实采集。

## Desktop / mobile / theme QA

7 路由 × Desktop English light / Desktop English dark / Mobile English light / Mobile Chinese dark，共 28 次实际渲染检查；390px 手机和 1440px 桌面均未发现整页横向溢出。另测 320px 市场及发行方页面，通过。

- 市场为真实供应历史；宏观六张真实序列图，缺失日断开，不从静态示意图模拟行情。
- 图表展示实际时间窗、单位、source/state/date；FX 序列切换保留原始 local currency / USD 报价，归一化基准明确为首个有效非零观测，不能生成假基准。
- 手机来源 popover 在 390px 内可读；Artemis Chinese popover 已实测。报告来源与样本信息可点击/展开。
- 发行方桌面比较与手机展开均保留关键信息；手机折叠态亦分别显示报告期间和发布日期。
- Dark 下文字/曲线/坐标可读；没有装饰币、机器人、stock image、数量 KPI 或风险排名。
- 真实 DEX / current-price unavailable 与强制失败后的 last-successful 均实测；没有零线或空白占位图。

全部截图及 `browser-routes.json` 位于 `outputs/market-data-dashboard-v02-qa-2026-10-16/`。本机 QA 前端 5183 与 API 3001 独立于原有 5173；未修改环境配置或生产服务。

## 修改文件范围

- API：新增 `dataGovernance.ts`；修正 `stablecoinMarket.ts`、`macroContext.ts`、`stablecoinLiquidity.ts`、`depegEvents.ts`、`stablecoinDataScheduler.ts` 及 `routes/stablecoinMarket.ts`。
- 前端：新增 `market-data-v02.tsx`、`market-data-ui.tsx`、`use-market-data.ts`、`market-data-model.ts`、`market-data.ts`、`market-data-v02.generated.json`；五个现有页面入口/共享导航文件转接新实现。
- 合同：OpenAPI 增加/明确五个已有公开数据 endpoint 合同，运行 codegen；纳入生成的 API client 与 Zod/type 文件。
- 来源/验证：原始 ZIP、31 文件原样副本、`prepare-market-data-package.mjs`、`market-data-qa-runtime.mjs`、22 项测试、本验收文档及 outputs 证据。
- 未把预先存在的 layout activeAliases、audit-import-folders、.gitkeep 删除、规划32/33、内容交接包等无关改动纳入专题实现。build 会重新产生既有 connector ZIP，该工作区改动亦非本专题实现。

完整逐文件列表见同目录 QA outputs 的 `changed-files.json`。

## 最终验证

- 全专题自动回归：**61/61 passed**（原有 About + Homepage/Research + Asia + Agentic **39/39**，新增数据治理 **22/22**），无 skip。
- 命令：在 `scripts/` 下，以 Node 24 环境执行 `node --import tsx --test tests/*.test.ts`；日志 `regression-final.log`。覆盖缺失/零、429/parse/empty、时间语义、回退持续状态、真实组件 SSR、七页无空图、issuer 边界、depeg/holder 隐藏、Artemis 证据不相加。
- `pnpm run typecheck`：通过，日志 `typecheck-final.log`。
- `pnpm run build`：通过，日志 `build-final.log`；现有 UI sourcemap 与大 chunk 警告仍存在，不阻断构建。
- OpenAPI codegen：通过，日志 `codegen.log`。
- `git diff --check`：通过；新增文本文件亦单独检查尾随空白。
- ZIP / extracted 31 files 原文完整性：通过；inventory 自身大小差异保留记录。

## 后续条件与需要的配置

本地施工无需新增 key 即可完成。若后续要求动态 Artemis，需用户提供合法可用 API/key 及展示/再分发授权确认；本轮不索取、猜测或伪造 live 数据。若要求当前 CoinGecko deviation，需要可用源/key 与健康时间戳观测通过；key 本身不跳过 freshness/target QA。Etherscan issuance 仍需 contract/event/circulation semantics 与可用计划核验，holder concentration 的公开决定保持 HOLD。Circle 需要独立验证动态集成后才能从 dated scope record 升级。

内容判断仍待后续材料：Artemis 分类金额、可比较的 issuer 数值与 FDUSD report-level composition QA；现阶段均明确缺失，不影响已实现的来源边界和 Data Health 行为。本轮不新增包外研究结论。

## APPROVED_FOR_MERGE / 本地提交前复核

用户于 2026-10-16 确认最终数据治理、内容、动态状态与视觉验收通过，状态为 `APPROVED_FOR_MERGE`；授权独立本地提交，提交信息 `feat: rebuild market data and dashboard v0.2`。不 push、不部署 Render。

提交前重新执行全专题测试 **61/61 passed**，其中 missing / failed / 429 / parse error / empty response、原观测日期、旧快照持续回退、当前价格投影及报告边界测试全部通过；`pnpm run typecheck`、`pnpm run build`、`git diff --check` 均通过。日志为 QA outputs 下的 `precommit-regression.log`、`precommit-typecheck.log`、`precommit-build.log`。

原 ZIP SHA-256 与 31 个解压文件重新逐字节核验通过，inventory 自身大小 discrepancy 原样保留，见 `precommit-integrity.json`。新增 `.gitattributes` 仅防止该 source package 的原始换行被 Git 转换；不改动包内文本。

按 `changed-files.json` 的专题路径逐文件暂存并检查精确集合及 Git index blob；排除预先存在的 layout、audit-import-folders、connector ZIP、.gitkeep 删除、规划32/33和其他内容交接包。暂存范围及源包 index bytes 核对结果见 `precommit-scope.json`。所有批准的数据边界保持不变，本次收尾仅更新验收状态及本地提交记录。
