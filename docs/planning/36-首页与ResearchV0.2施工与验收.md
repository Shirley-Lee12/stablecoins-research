# 首页 + Research V0.2｜本地施工与验收

- 日期：2026-10-16
- 状态：`APPROVED_FOR_MERGE`（用户于 2026-10-16 明确批准最终内容与英文文案验收）。
- 范围：`/`、`/research`。没有修改路由、左侧导航、日夜主题体系、市场/量化/关于稳定币/资源/专家页面或已批准的亚洲与智能体支付正文。
- 初次施工及英文 QA 未 commit、未 push、未部署；用户最终批准后授权一次独立本地 commit，仍不 push、不部署。不修改数据库、后端、API、环境变量或托管配置。

## 1. 唯一施工源

输入为项目根目录 `Homepage_Research_Codex_Ready_Package_V0.2.zip`，原样解压于 `docs/source-packages/home_research_codex_package_v0.2/`。

已先完整读取：00_README、CODEX_HANDOFF、PACKAGE_STATUS、FINAL_COPY_QA；随后读取中英文 Home/Research Content Master、RESEARCH_STATUS、STATUS_LABELS、PAGE/SOURCE/ASSET Manifest、VISUAL_SCRIPTS、VISUAL_QA 与 CURRENT_SITE_REFERENCE。旧网页只检查集成方式，没有继承其事实或研究状态。旧截图保留为参考存档，不作为新页面展示素材。

29 个解压文件与 ZIP 逐字节一致。包内 7 条研究记录、7 类状态标签、9 条来源记录、2 页 Manifest、6 条素材记录及四份 Content Master 均由本地脚本导入。五张冻结 SVG 原样复制，没有重绘其研究关系或状态。没有引入外部事实、实时量化结果或图片。

来源 VERIFIED / last_verified 是施工包的研究记录，不表示本次重新联网核验。内置文案为包内 Masters、状态记录及其忠实翻译；英文 Master 未详述的模块从中文 Master 对译，不补充额外结论。

## 2. 修改与新增文件

| 文件（仓库根目录起） | 作用 |
| --- | --- |
| `artifacts/stablecoin-hub/src/pages/home-overview.tsx` | 重构首页，以用户问题和可查看证据为入口 |
| `artifacts/stablecoin-hub/src/pages/research.tsx` | 按 Manifest 重构 Research，分别呈现研究阶段与尚未上线的能力 |
| `artifacts/stablecoin-hub/src/components/home-research-ui.tsx` | 双语状态标签、研究记录、来源 tooltip/popover、可展开主题适配 SVG |
| `artifacts/stablecoin-hub/src/data/home-research.ts` | 本轮双语展示数据、入口路由、研究流程与明确边界 |
| `artifacts/stablecoin-hub/src/data/home-research-v02.generated.json` | 原包结构化数据、Masters、SVG 与哈希的机械导入 |
| `scripts/prepare-home-research-package.mjs` | 可重复的纯本地导入脚本，不读取旧正文或访问网络 |
| `scripts/tests/home-research.test.ts` | 本专题 8 项一致性、状态边界与集成测试 |
| `docs/source-packages/home_research_codex_package_v0.2/` | 原包 29 文件完整存档 |
| `artifacts/stablecoin-hub/public/home-research/v0.2/` | 五张冻结 SVG 的原样副本 |
| `outputs/home-research-v02-qa-2026-10-16/` | 本地浏览器验收截图 |
| 本文 | 施工范围、内容边界与验收记录 |

五张 public SVG：

- `HOME-D01-research-hub-map.svg`
- `HOME-D02-research-maturity.svg`
- `RES-D01-research-pipeline-status.svg`
- `RES-D02-quantitative-research-map.svg`
- `RES-D03-taxonomy-to-measurement.svg`

运行时只映射背景/文字/线条颜色、作用域化 marker ID 并补充无障碍角色，不改图中的文字、几何、连线、虚线和研究含义。窄屏提供文字说明与展开窗口，避免把 1600px 宽图缩为不可读小字。

已存在的 About 菜单简化、`.gitkeep` 删除、audit-import-folders、规划文档 32/33、ChatGPT 交接文件等无关改动未纳入本轮施工。完整 build 依项目原有流程重打包 connector 下载 ZIP，它不是本轮内容变更，不应在未来专题 commit 中混入。

## 3. 实现模块与路由

### `/`

1. Hero：保留 Stablecoin Research Hub / 稳定币学术研究平台；价值说明；准确 AIF 支持文案；“从稳定币开始”“查看我们的研究”两个 CTA。
2. 五个问题入口：稳定机制 → 亚洲发展 → 智能体支付 → 市场/链上数据 → 风险研究；配套 HOME-D01。
3. 当前可查看的研究与证据：概念风险框架、亚洲专题、智能体支付专题，分别显示完成类别；明确 55 项风险不是 55 个直接模型节点。
4. 研究成熟度：已完成/公开、中期实证、验证进行中、未来计划四层，使用 HOME-D02；不使用完成百分比或资源数量 KPI。
5. 证据原则：区分规则、牌照、上线、Beta/试点、分销、观测采用和研究推断；UNKNOWN 不推测补齐。
6. 平台与支持说明：普通用户、研究者、产业参与者；无团队名单墙、合作方 logo 墙或机构背书扩张。

### `/research`

1. Hero：从概念框架到测量和实证阶段；监测/预警明确不是已部署产品。
2. 六阶段研究流程：概念完成 → 测量设计完成主要部分/持续修订 → 研究数据链建立 → 模型中期结果 → 验证进行中 → 监测计划；使用 RES-D01。
3. 55 项概念风险：生命周期 × 放大/传导作用；筛选依据为经济含义、可测量代理、质量、频率与可比较性；使用 RES-D03，不发布固定当前节点数。
4. 当前量化研究：TE、Hawkes、压力情景/历史案例分别展示问题、阶段结果和边界；使用 RES-D02，保留未来监测虚线路径含义。
5. 证据模块：链接既有批准的亚洲与智能体支付实现，不重复详细正文，不塞进同一风险分数。
6. 研究产出：AI-DEFIT 2026 论文/汇报、中期量化结果、阶段性案例结果、未来监测计划分开。
7. 明确没有上线的能力：不宣称实时风险概率、实时脱锚概率、已校准实时评分、生产级预警或实时 TE/Hawkes 引擎；不声称支付网关数据合作。
8. 下一阶段：测量有效性、可复现性、稳健性、样本外、事件解释与情景一致性。

路由保持 `/` 和 `/research` 不变。复用既有目标 `/about-stablecoins`、`/regional-developments`、`/agentic-payments`、`/market-data`，新增的页内定位为 `/research#55-risk-framework`。浏览器发现主滚动容器的全局复位使 hash 无法定位，已仅在 Research 本页用渲染后定位修正，不改变共享导航或布局文件。

## 4. 冻结研究状态与来源边界

| 对象 | 保留的状态 |
| --- | --- |
| 55 原子风险 | COMPLETED_CONCEPTUAL_OUTPUT；概念分类，不是直接模型节点数 |
| AI-DEFIT 2026 | PUBLIC_PRESENTED_OUTPUT；论文议程/汇报，不代表量化系统完成 |
| 亚洲、智能体支付 | COMPLETED_EVIDENCE_MODULE；并列证据模块 |
| TE/Hawkes | INTERIM_EMPIRICAL_RESULTS；不作实时预测或生产因果系统宣称 |
| 压力/案例 | INTERIM_RESEARCH_RESULTS；不是已部署服务 |
| 验证 | VALIDATION_IN_PROGRESS |
| 持续监测/早期预警 | PLANNED |

内部研究状态可公开摘要，不附私有文档下载；所有 `public:false` 记录均不生成研究文件链接。公开外链仅使用 SOURCE Manifest 中有 URL 的 SRC-HR-02/03（机构官方资料）和 SRC-HR-04（会议官方议程）。界面不会暴露本地绝对路径、内部基线文件、commit hash 或未知的论文下载地址。

机构支持英文逐字使用：`Sponsored by the Academy of Internet Finance (AIF), Zhejiang University.`；中文使用“由浙江大学金融科技研究院（AIF）支持。”不延伸为对全部结论背书、数据所有权、商业授权或监管批准。来源 tooltip 中的官方组织原名保留，不把来源组织名称当作新的平台隶属声明。

## 5. FINAL LOCAL QA

| 检查 | 结果 |
| --- | --- |
| 本专题测试 | 8/8 通过 |
| 联合回归 | `node --test scripts/tests/home-research.test.ts scripts/tests/asia-development.test.ts scripts/tests/agentic-payments.test.ts`：26/26 通过（8 + 11 + 7） |
| 类型检查 | `pnpm run typecheck` 通过 |
| 完整构建 | `pnpm run build` 通过，包含再次 typecheck；前端/API/extension/mockup 完成 |
| 原包完整性 | 29/29 文件与 ZIP 逐字节一致 |
| 冻结素材 | 5/5 public SVG 与包内原文件逐字节一致，生成 JSON 哈希一致 |
| diff | `git diff --check` 通过 |
| 浏览器日志 | 本轮预览 tab 的 error / warn 为空 |

既有 shadcn sourcemap 原位置提示与大 bundle 警告仍存在，不影响本轮构建；未扩展为全站打包优化。

### 实际浏览器验收

- 两页的桌面英文/中文标题、模块顺序、状态和链接已核对。
- 首页主 CTA 进入 About；次 CTA 进入 Research。亚洲/智能体支付证据入口均进入已批准页面。
- 首页风险框架入口进入 `/research#55-risk-framework` 后，目标区块在主滚动容器可视区域内，未停在研究页顶端。
- TE/Hawkes 均为中期实证结果；验证和监测分别为进行中与计划。未出现模型节点个数 KPI、实时概率数字或模拟监测图。
- 桌面与约 391px 有效 CSS 宽度均无整页横向溢出；移动端五问题入口可读、六阶段流程完整，宽图以文本解释和展开窗口提供。
- 日夜主题正常，冻结图未做位图反色；手机机制图弹窗单 X 关闭正常。
- 桌面来源提示支持键盘聚焦；手机点击可见来源标题、官方组织、原日期、包内核验日期与外链。
- 研究状态摘要未出现私有路径，内部结果未生成下载链接；仅有包内三个公开来源 URL。
- 验收后恢复原英文、浅色、默认视口。临时验收服务按本地流程清理，不代表已部署。

截图目录：`outputs/home-research-v02-qa-2026-10-16/`，含首页昼/夜与中/英、Research 昼/夜、两页移动端截图。这些是本地 UI 验收证据，不是新增研究素材或第三方截图。

## 6. 仍需人工确认

没有阻塞工程交付的问题。需要研究负责人/用户对本轮文案呈现和忠实补译进行最终内容验收，当前不自动标记 APPROVED_FOR_MERGE。

研究层面的开放事项仍按原包保留：测量修订、复现、稳健性、样本外、解释及情景一致性验证未结束，监测/预警仍是计划。不能由网站施工将其升级为已完成能力。

包内只有会议官方议程外链，没有授权的全文/内部中期结果下载文件；本轮不自行添加。将来若需要公开内部成果，须另行确认公开范围和新的施工源。本轮未新增事实型 UNKNOWN，也未补全其他专题的 UNKNOWN。

再次预览（在项目根目录执行）：

```sh
pnpm --filter @workspace/stablecoin-hub dev
```

访问 `http://localhost:5173/` 和 `http://localhost:5173/research`。

## 7. FINAL ENGLISH COPY QA

- 日期：2026-10-16。
- 本轮仅收尾英文文案；页面结构、路由、样式、中文研究结论、状态分类和公开权限不变。不新增事实，不自动升级审批状态。
- 原始 ZIP、29 个解压文件、生成 JSON 和五张 public SVG 原文件保持不变。英文记录采用单独展示覆盖层；SVG 仅在渲染时替换获授权文字。本节补充前文“运行时不改文字”的初次施工记录：本次仅有下列三处文字替换，不改变研究含义。

### 实际修改

1. 首页 Hero：`real products` → `live products`。
2. 首页与 Research 共享的风险框架展示标题统一为 `Full-lifecycle stablecoin risk framework`。当前结构化记录原本使用 `Full-Lifecycle Multi-Dimensional Risk Framework`；没有修改其源记录或论文正式名称。
3. 未来计划文案使用 `Regulatory coverage mapping` 和 `Integrated research and market data`，不使用连字符或斜线缩写。
4. 首页 Critical boundary（及 Research 共享边界）逐字使用：`The website does not currently provide real-time depeg-probability estimates or a production-grade early-warning score.`
5. Research H1 逐字改为 `From a conceptual risk framework to empirical risk-transmission analysis`。
6. Research Lead 按本轮用户提供全文替换，明确概念与证据模块完成、量化研究已有中期结果、监测与预警尚非部署产品。
7. Measurement design 阶段改为 `Core design established; refinement ongoing`；Audited data 阶段改为 `Audited research data pipeline established`。移动端流程补译同步使用同一口径；原中文不变。
8. 55-risk Boundary 逐字使用：`The number 55 refers to the conceptual taxonomy. It does not imply that 55 variables are entered directly into a single empirical model.` 共享说明与研究记录边界一致。
9. Transfer Entropy：`Interim results have been produced for directed, time-varying transmission among measured risk signals.`
10. Multivariate Hawkes：`Interim model fits and cross-excitation patterns have been obtained, while out-of-sample performance and interpretation still require further validation.`
11. Stress scenarios & historical events：`Interim stress-scenario and historical case-study results have been produced; reproducibility and integrated validation remain in progress.`
12. 标题改为 `What is not yet live`；未上线能力说明改用 `a deployed TE/Hawkes risk engine`，移除重复且容易误读的 `deployed live`。
13. 扫描并移除公开英文中的 `result packages exist`、`Stage results exist` 等内部工作语言；研究产出记录和成熟度列表均以 interim results 表达，复现、稳健性和解释验证仍为进行中。压力研究记录的指令式句子改为面向读者的研究边界说明。
14. HOME-D02 渲染文字仅三处：`Stress / case result packages` → `Interim stress / case results`；`Integrated research +` → `Integrated research and`；底部边界改为 `No real-time depeg-probability estimates or production-grade early-warning score.`。另外四张图未替换文字；所有图的标签节点、属性、几何、关系、颜色映射逻辑和状态含义不变。
15. AIF 署名继续逐字保留：`Sponsored by the Academy of Internet Finance (AIF), Zhejiang University.`

已扫描两页组件、共享展示数据、研究记录实际渲染结果和五张图的英文标签。没有将中期结果写成 validated findings，没有将 monitoring / early warning 写为现有能力，没有将 55 atomic risks 写为当前实证模型节点数量。已完成 / 中期结果 / 验证进行中 / 未来计划的状态值和标签保持原样。原始施工源中的旧文字作为存档保留，不代表网页仍显示旧文案。

### 本轮文件

- `artifacts/stablecoin-hub/src/pages/home-overview.tsx`
- `artifacts/stablecoin-hub/src/pages/research.tsx`
- `artifacts/stablecoin-hub/src/data/home-research.ts`
- `artifacts/stablecoin-hub/src/data/home-research-english-copy.ts`（新增：仅允许覆盖英文记录字段及三个 SVG 文字片段）
- `artifacts/stablecoin-hub/src/components/home-research-ui.tsx`（接入英文覆盖，不改变结构或状态选择）
- `scripts/tests/home-research.test.ts`（更新文案断言，新增中文/布局哈希、英文覆盖字段和 SVG 文字可逆测试）
- 本验收文档。

本轮截图：`outputs/home-research-v02-english-copy-qa-2026-10-16/`，包括首页英文昼间、Research 英文昼/夜与成熟度机制图弹窗。

### 测试与验收结果

| 检查 | 结果 |
| --- | --- |
| 全部当前专题回归 | `node --test scripts/tests/home-research.test.ts scripts/tests/asia-development.test.ts scripts/tests/agentic-payments.test.ts`：29/29 通过（首页/Research 11 + 亚洲 11 + 智能体支付 7） |
| typecheck | `pnpm run typecheck`：通过 |
| build | `pnpm run build`：通过（包含再次 typecheck 和所有工作区构建） |
| 中文与布局 | 4 个实现文件的中文字符串 AST 哈希、布局属性哈希与本轮修改前一致 |
| 研究状态与源包 | 原始 29 文件、状态记录、标签与源包一致；没有修改 public 标志或来源 URL |
| 冻结 SVG | 原始五张文件逐字节一致；运行时英文替换可逆，非文字标记完全一致 |
| 浏览器 | 两页英文修订、Research 中文与夜间切换、六阶段状态和成熟度图弹窗核对通过；没有整页横向溢出，图中新增文字未遮挡；预览 tab error/warn 日志为空 |
| diff | `git diff --check`：通过 |

完整构建仍输出原有 shadcn sourcemap 原位置提示及大 bundle 警告，退出码为 0；没有在本轮修改打包配置。构建按原有脚本重打包的 connector ZIP 属于已知非专题改动，不作为本次文案文件。

没有新增需推断补齐的 UNKNOWN；研究验证事项继续保留原状态。本轮未 commit、未 push、未部署，也未改动其他专题内容。临时验收服务在本轮结束时关闭，可按上一节命令重新启动预览。

## 8. APPROVED_FOR_MERGE 与独立本地提交

- 用户于 2026-10-16 明确批准首页 + Research V0.2 最终内容与英文文案，状态设为 `APPROVED_FOR_MERGE`。第 5–7 节保留为当时施工与 QA 的历史记录，原“等待内容验收”已由本次批准完成。
- 提交前重新运行全部专题回归：29/29 通过；独立 `pnpm run typecheck` 通过；`pnpm run build` 通过；`git diff --check` 通过。原有 sourcemap 与 bundle 体积提示仍非阻塞，不扩展修改。
- 本次只提交两页必要实现、共享专题组件/数据、英文覆盖层、导入脚本、专题测试、本验收文档、原始 V0.2 ZIP/解压存档、五张原始 SVG 副本及专题本地 QA 截图。源包与原始 SVG 完整性测试通过，未修改冻结研究含义。
- 排除：`layout.tsx` 的 About 子菜单改动、两处 `.gitkeep` 删除、connector 下载 ZIP、`audit-import-folders.ts`、规划文档 32/33、ChatGPT 内容交接包及其生成脚本等无关工作区改动；这些改动保留在工作区。
- 提交信息：`feat: rebuild homepage and research section v0.2`。仅本地 commit，不 push、不部署 Render。
- 暂存原始存档后，Git 默认空白检查将包内 Markdown 的双空格硬换行和 CSV 的 CRLF 识别为行尾空白。为保持源包逐字节不变，增加 `.gitattributes`，只对 `docs/source-packages/home_research_codex_package_v0.2/**` 关闭行尾空白告警并禁用文本换行转换；其他实现文件继续执行默认检查。原包未清洗、未改写。
