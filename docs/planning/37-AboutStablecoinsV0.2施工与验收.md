# About Stablecoins V0.2｜本地施工与验收

- 日期：2026-10-16。
- 状态：**APPROVED_FOR_MERGE**。2026-10-16 用户明确确认最终内容、英文文案与视觉验收通过。
- 范围：10 个 About 路由，以及满足导航硬约束所必需的全局 sidebar、AboutSectionNav 和 `/regulatory` 导航关联清理。
- 用户已授权创建一次独立本地 commit；不 push、不部署 Render。未修改后端、数据库、API、密钥、托管配置，也未修改其他已批准专题的正文或研究状态。

## 1. 唯一施工源与完整性

唯一输入：根目录 `About_Stablecoins_Codex_Ready_Package_V0.2.zip`，原样解压于 `docs/source-packages/about_stablecoins_codex_package_v0.2/`。

先完整读取 00_README、CODEX_HANDOFF、PACKAGE_STATUS、NAVIGATION_SPEC、FINAL_COPY_QA、RESEARCH_BASELINE_V0.1；随后完整读取中英文 Content Master、ABOUT_NAV、两份矩阵、HISTORY_TIMELINE、REGULATORY_EVOLUTION、PAGE/SOURCE/ASSET Manifest、VISUAL_SCRIPTS、VISUAL_QA 和 PACKAGE_INVENTORY。旧页面只用于检查集成方式，未作为事实源。旧 reference 正文未导入新页面。

39 个解压文件逐字节匹配原 ZIP；九张 public SVG 逐字节匹配包内 final 文件；生成 JSON 中保存原始 Masters、Manifest、结构化数据、SVG 和 SHA-256。导航、历史、监管阶段及 CSV 矩阵均可通过 `node scripts/prepare-about-package.mjs` 重复导入，无网络请求或旧正文依赖。

来源状态和核验日期表示施工包记录，不代表本轮重新联网核验。仅使用 SOURCE Manifest 的 26 个原始 URL，未替换来源、补充外部事实或创建假图片。History 与 Applications 使用数据组件，不生成静态截图替代。

包内 `PACKAGE_INVENTORY.json` 对自身记录的字节数是 1108，ZIP 中实际为 3027；该自记录元数据不一致原样保留，完整性以原 ZIP 的逐文件字节对比为准，不推测修写，不阻塞页面实现。

## 2. 修改文件

### 实现与集成

| 文件（仓库根目录起） | 作用 |
| --- | --- |
| `artifacts/stablecoin-hub/src/data/about-stablecoins-v02.generated.json` | 39 文件施工包中的网页数据、Masters、Manifest 与九张冻结图的机械导入 |
| `artifacts/stablecoin-hub/src/data/about-stablecoins.ts` | 10 页模块、双语展示内容、忠实补译、机制边界与链接 |
| `artifacts/stablecoin-hub/src/components/about-stablecoins-ui.tsx` | 轻量页面框架、TypeNav、来源 tooltip/mobile popover、机制图与展开窗口 |
| `artifacts/stablecoin-hub/src/components/about-section-nav.tsx` | 用 ABOUT_NAV 构建五项 SectionTopNav；移除 Regulatory Status 子项 |
| `artifacts/stablecoin-hub/src/pages/about-stablecoins-v02.tsx` | 通用模块渲染；History、Applications、分类矩阵、监管阶段和类型详情组件 |
| `artifacts/stablecoin-hub/src/pages/about.tsx` | 概览入口，转出 V0.2 页面组件 |
| `artifacts/stablecoin-hub/src/pages/about-history.tsx` | 历史入口，转出 V0.2 页面组件 |
| `artifacts/stablecoin-hub/src/pages/about-types.tsx` | 类别入口，转出 V0.2 页面组件 |
| `artifacts/stablecoin-hub/src/pages/about-applications.tsx` | 应用入口，转出 V0.2 页面组件 |
| `artifacts/stablecoin-hub/src/pages/about-regulatory-evolution.tsx` | 监管演进入口，转出 V0.2 页面组件 |
| `artifacts/stablecoin-hub/src/pages/stablecoin-mechanism.tsx` | 五个类型详情入口，转出 V0.2 页面组件；不再请求旧机制市场数据 |
| `artifacts/stablecoin-hub/src/components/layout.tsx` | About 单入口不展开、Regulatory Status 独立入口；更新相关面包屑术语 |
| `artifacts/stablecoin-hub/src/pages/regulatory.tsx` | 仅删除 AboutSectionNav import/调用两行；监管正文不变 |

### 素材、测试与文档

- `scripts/prepare-about-package.mjs`：确定性本地数据导入脚本。
- `scripts/tests/about-stablecoins.test.ts`：本专题 10 项回归测试。
- `artifacts/stablecoin-hub/public/about-stablecoins/v0.2/`：九张原始 SVG 副本。
- `docs/source-packages/about_stablecoins_codex_package_v0.2/`：原包 39 文件存档。
- `About_Stablecoins_Codex_Ready_Package_V0.2.zip`：原始施工包不变。
- `outputs/about-stablecoins-v02-qa-2026-10-16/`：本地浏览器截图与三组 10 路由检查记录。
- 本文：实现范围、内容与工程验收结果。

工作区原有的 About 子菜单简化已满足单入口方向，本轮保留并完善为不关联 `/regulatory`；该文件与既有未提交改动存在交叠，今后提交时需将本次必要导航结果作为一体核对。`.gitkeep` 删除、audit-import-folders、规划 32/33、ChatGPT 交接包/脚本等无关变更未处理。完整 build 按现有脚本重打包 connector ZIP，属于已知非专题构建产物，不应混入未来专题 commit。

## 3. 十个路由

| 路由 | 实现与模块顺序 | 状态 |
| --- | --- | --- |
| `/about-stablecoins` | Hero → 四问题 → 为什么出现 → 数字货币边界 → 后续入口 | 完成 |
| `/about-stablecoins/history` | Hero → 因果时间线 → 机制教训 → 后续入口 | 完成 |
| `/about-stablecoins/types` | Hero → 三轴分类矩阵 → 五类机制 → 分类提醒 → 类型入口 | 完成 |
| `/about-stablecoins/applications` | Hero → 应用不等于采用 → 应用矩阵 → 证据边界 → 数据/智能体入口 | 完成 |
| `/about-stablecoins/regulatory-evolution` | Hero → 五阶段 → 时间坐标 → 独立监管/亚洲入口 | 完成 |
| `/about-stablecoins/types/fiat-backed` | Hero → 机制 → 锚定 → 检查清单 → USDC/USDT/PYUSD → 风险 | 完成 |
| `/about-stablecoins/types/crypto-backed` | Hero → 机制 → 当前 BOLD → 历史 Dai/Sai → 压力路径 → 风险 | 完成 |
| `/about-stablecoins/types/synthetic` | Hero → 机制 → USDe → 用户权利 → 风险依赖 → 边界 | 完成 |
| `/about-stablecoins/types/algorithmic` | Hero → 预期机制 → 压力循环 → UST 历史案例 → 教训 → 边界 | 完成 |
| `/about-stablecoins/types/other` | Hero → 机制迁移 → 当前 frxUSD → 相邻货币 → 判断清单 | 完成 |

既有 App 路由与路径不变；六个旧入口文件仅转出新专题组件。五个合法详情 slug 以包内 TypeNav 校验，未知 slug 显示明确未找到状态与返回 Types 链接，不退回旧事实正文。

## 4. 导航行为

- 全局 sidebar：仅一个 About Stablecoins / 关于稳定币链接，不配置 children，不展开 History/Types/Applications/Regulatory Evolution 或五类详情。桌面与移动端共用这一配置。
- 全部 10 页：顶部使用既有 SectionTopNav，五项仅为 Overview / History / Types / Applications / Regulatory Evolution，数据来自 ABOUT_NAV。
- Types 与五类详情：第二行轻量 TypeNav，五项取包内配置；当前详情精确高亮，并继续高亮第一行 Types。Types 总览不错误选中某个详情。
- 两行页内导航均可局部横向滚动，有语义 nav、可聚焦链接、活动状态，不转为 sidebar 子树。
- `/regulatory` 维持独立路由：增加独立 Regulatory Status sidebar 入口，取消 About 活动别名；删除该页原 AboutSectionNav 两行集成。About 页通过普通交叉链接进入现行监管页，而不是将其纳入子导航。

## 5. 数据组件与轻量呈现

History 从 HISTORY_TIMELINE.json 渲染 9 条事件，每条保留日期、类型、事件、What changed 和原始来源 ID。英文 what-changed 缺少结构化字段时忠实翻译 `what_changed_zh`。不使用 logo 时间线，不将 2026 框架推进写为已经全面生效。

Applications 从 APPLICATION_MATRIX.csv 渲染 7 类任务：加密交易、DeFi、跨境转移、企业资金/B2B、商户/P2P、代币化资产结算、机器/智能体支付。桌面是任务/作用/证据状态/关键约束四列表；窄屏为逐类 definition list，保留全部字段和来源。机器支付行遵循原矩阵的内部 `/agentic-payments` 链接，不制造外部来源；实际使用数据链接 `/market-data/adoption`。

Types 使用 TYPE_MECHANISM_MATRIX.csv 的价值支撑、退出/赎回、稳定机制三轴，不按旧市场分类或项目历史声誉推定现行机制。五个教学分类不是永久、互斥或通用法律分类。

监管阶段从 REGULATORY_EVOLUTION.json 渲染；中文 Master 对稳定性义务补充的 AML/CFT、恢复/有序退出也在该阶段以短句保留。制度时间坐标仅采用包内日期与来源，现行国家制度比较留给 `/regulatory`。

没有新增实时 API、市场规模图、排名、完成率、risk score、重型研究仪表盘或装饰性图片。原市场机制详情 API 依赖从 About 页面移除，不影响独立 Market Data 页面。保持既有蓝色主色、日夜主题、系统字体和简洁线条/留白。

## 6. 九张冻结机制图

| SVG ID | 页面与说明 |
| --- | --- |
| STB-D01 | 概览：经济支撑到发行、流通、偏离、响应、销毁/结算；非所有机制都经过所有节点 |
| STB-D02 | 概览：Stablecoin、CBDC、代币化存款和基金份额的不同权利 |
| STB-D03 | Types：三轴与可重叠/变化的教学分类 |
| STB-D04 | Regulatory Evolution：监管逻辑演进，不作现行国家排名 |
| STB-D05 | Fiat：合格直接客户与二级持有人分开 |
| STB-D06 | Crypto：抵押偿付/清算与赎回/套利支撑锚定分开 |
| STB-D07 | Synthetic：支撑资产、对冲、托管/结算与用户权利分开 |
| STB-D08 | Algorithmic：预期套利循环与反身性压力循环分开；UST 为历史案例 |
| STB-D09 | Other：机制迁移与相邻货币权利分开；当前 frxUSD 为当前机制例子 |

九张全部使用，public 文件与原包逐字节一致。运行时仅映射主题颜色、作用域化 marker ID、补充 role；不改英文标签、节点、几何、连线或研究含义。日夜主题不做位图反色。窄屏提供双语机制摘要与“展开机制图”，弹窗支持横向/纵向滚动，只有一个 X 关闭按钮。

## 7. 内容、来源与边界检查

已保留：

- mechanism before label；当前机制优于历史品牌印象。
- application ≠ adoption；交易量不等于商户支付采用；稳定币是智能体支付可选轨道，不是必要条件。
- stablecoin ≠ CBDC / tokenised deposit / tokenised fund share；yield-bearing wrapper 与基础代币的权利也不自动相同。
- reserve backing ≠ 相同直接赎回权；USDC 机构 Circle Mint 准入和普通渠道不同；USDe KYC/KYB 白名单与普通持有人不同。
- attestation ≠ audit。
- synthetic/hedged ≠ 经典内生算法结构；algorithmic ≠ decentralised。
- BOLD 为当前教学案例、Dai/Sai 为历史机制里程碑、UST 为历史失败案例、frxUSD 用于当前机制迁移说明；不做推荐或主观排名。

英文简版 Master 未逐句覆盖的细节，依据中文 Master/矩阵做忠实翻译，没有自行新增结论。主要术语使用 fiat-reserve-backed、crypto-collateralised、synthetic / hedged、stabilisation、tokenised；官方原名保留原拼写。

引用复用既有桌面 tooltip、手机 popover 交互模式：显示官方标题、组织、原日期/状态与施工包核验日期，点击原 URL 新窗口跳转；外链使用 noopener/noreferrer。页面不插入大型参考文献墙，不公开本地文件路径。全部引用 ID 有对应 Manifest 来源，无未解析引用。

## 8. FINAL LOCAL QA

| 检查 | 结果 |
| --- | --- |
| 本专题回归 | 10/10 通过 |
| 全部专题联合回归 | 39/39 通过（About 10 + Home/Research 11 + 亚洲 11 + 智能体支付 7） |
| 原包完整性 | 39/39 文件逐字节匹配 ZIP |
| 冻结图 | 9/9 文件与原包一致；网页映射使用全部九图 |
| 矩阵/Manifest | 逐项解析比较原 CSV 与生成 JSON 一致；历史、监管、导航 JSON 和中英文 Masters 一致 |
| 路由/顺序 | 10 页模块顺序与 PAGE Manifest 一致；旧 canonical 路由不变 |
| typecheck | `pnpm run typecheck` 通过 |
| build | `pnpm run build` 通过，含全工作区 typecheck/build |
| diff | `git diff --check` 通过 |

回归命令：

```sh
node --test scripts/tests/about-stablecoins.test.ts scripts/tests/home-research.test.ts scripts/tests/asia-development.test.ts scripts/tests/agentic-payments.test.ts
```

完整构建仍有既有 shadcn sourcemap 原位置提示和大 bundle 警告；退出码为 0，本轮未扩展为全站打包优化。

### 浏览器实测

- 实际遍历全部 10 页桌面英文、293px 中文窄屏和 390px 中文手机视口，标题、模块、5 项顶导航及条件式 TypeNav 正常；各页均无整页横向溢出，About 内容无缺失引用提示。
- 六个 Types 页面第一行 Types 活动正确，五个详情第二行精确高亮；顶部行和类型行可以分别横向滚动。
- History 九条事件含可读的 What changed 与引用；Applications 七类任务的所有字段在桌面和手机保留。
- 桌面来源支持键盘聚焦 tooltip；手机 USDe 条款 popover 显示 2025-08、Ethena、施工包核验日期和正确链接。
- 夜间监管机制图内容/箭头与文字可读；手机合成机制图展开与单 X 关闭正常，窄屏正文保留机制摘要。
- About 验收标签页 error/warn 为空。截图与路由记录保存在 `outputs/about-stablecoins-v02-qa-2026-10-16/`。
- 本轮复用已有 5173 开发服务，不停止用户既有服务；验收结束恢复默认视口、英文和浅色主题。

## 9. 仍需人工确认

无工程阻塞或需要自行补全的 UNKNOWN。需要用户/研究负责人对本轮 10 页内容呈现及英文补译作最终验收；本地施工不自行标记内容批准。原包自记录字节数问题已注明并原样保留，如需修正应由内容包维护方在后续版本处理。

本轮没有新增外部事实，没有把可用机制或应用场景推断为 mass adoption，也没有把当前框架推进改成全面上线。没有改动其他已批准专题的研究结论或状态。

本地查看：`http://localhost:5173/about-stablecoins`。若开发服务已关闭，在项目根目录运行 `pnpm --filter @workspace/stablecoin-hub dev`。没有 commit、push 或部署。

## 10. FINAL CONTENT / ENGLISH / VISUAL QA

日期：2026-10-16。本轮为提交前收尾，检查原范围内的 10 个实际路由，不重新设计、不补充外部研究事实、不修改中文研究结论。没有 commit、push 或部署，也没有自行改变内容审批状态。

### 实际修正

仅修改展示适配层、机制图展示组件及现有回归中的一条英文断言；没有重写原施工包或生成数据存档。

| 位置 | 修正及目的 |
| --- | --- |
| 全部页面页脚 | `Content baseline` 改为 `As of 16 Oct 2026`，将核验说明改为面向读者的 source dates / review details；日期不变。 |
| 引用 tooltip / mobile popover | `Last verified in package` 改为 `Source review date`。显示的日期仍取原 Manifest，不能解释为本轮重新联网核验。 |
| Types 总页 | 明确五组属于 `mechanism-based teaching framework, not a universally binding legal taxonomy`；保留类别可重叠、可随机制改变的限定。 |
| 轻量 TypeNav | 按本轮冻结要求显示 `Synthetic-hedged`，其余四项与顺序不变；正文和图中的 `Synthetic / hedged` 保留机制术语。 |
| Applications 表格 | `Authorization` → `Authorisation`；`major/current dominant use` → `the main use case`；`Potential/growing use case` → `Potential or developing use case`；改善 `non-bank-hour transfer`、`Digital-native transferability` 两处生硬表达；将 `!=` 显示为 `≠`。没有增强采用程度。 |
| Fiat 标题 | `redeemable reserves` 简化为 `reserves`，避免把储备资产本身与持有人赎回权混写。 |
| Crypto 历史说明 | 将 `not a pure classification of the current system` 改为清晰的历史机制不决定当前系统分类，保留原边界。 |
| Synthetic 用户权利 | 将 `holding user / direct mint user` 改为 `Secondary holders / eligible direct counterparties`；KYC/KYB、白名单及不同权利不变。 |
| History / Regulatory | FSB 的 `common international baseline` 改为 `common international framework`；监管阶段及 STB-D04 显示层使用 `International standards`。未改变日期、事件、阶段含义或来源。 |

公开英文检查覆盖桌面浅色 10 页、桌面深色 10 页、390px 手机 10 页，共 30 次实际渲染检查，并打开英文来源弹层核对。最终渲染正文未发现 `package`、`baseline`、`result package`、`source record`、`current implementation`、`teaching group status` 等施工措辞；`collateralised / stabilisation / tokenised / authorisation` 保持 British English。官方来源、协议与产品原名不改写。

### 导航与内容边界

- 桌面和手机 sidebar 实测均只有一个 `About Stablecoins`，没有 About 子树；SectionTopNav 仍为固定五项。
- Types 总页及五个详情页使用固定顺序的五项 TypeNav，六页顶部 Types 状态正确。TypeNav 仅为页内导航，手机可以局部横向滚动。
- `/regulatory` 的实际页面不含 About 页面框架或 About 顶导航，继续为独立站点级栏目。
- Fiat：issuer、reserve、eligible direct customer 与 secondary holder 分开；USDC / USDT / PYUSD 仍只解释机制；`Attestation ≠ audit` 保留。
- Crypto：抵押、清算/偿付能力与赎回/套利支撑锚定分开；BOLD 为当前教学案例，Dai/Sai 为历史机制案例；没有将 decentralised 与 algorithmic 等同。
- Synthetic：backing、hedge、custody/settlement 三层关系和直接交易对手准入均保留；没有写成 unbacked 或经典内生算法机制。
- Algorithmic：UST 仍只是历史失败案例；不推广为全部 non-fiat-backed 机制的共同结论。
- Hybrid & boundary：围绕 today's mechanism；frxUSD 为当前机制迁移/分类例子，不恢复旧 FRAX 标签；CBDC、tokenised deposit、tokenised fund / Treasury share、yield-bearing wrapper 的权利边界保留。
- History 逐项保留 9 条事件的 date、event、What changed、source：2014 Tether；2017-12 Dai/Sai；2018-09-26 USDC；2020–2021 DeFi；2022-05 UST；2023-07-17 FSB；2024-06-30 MiCA；2025-07/08 US/HK；2026 systemic/cross-border monitoring。未新增日期或推断性结论。
- Applications 保留 7 类任务、证据状态、约束及来源；`Application ≠ Adoption` 仍明确。真实用量、地区和用户规模继续导向 `/market-data/adoption`，没有从可能用途推导 broad adoption。

### 九图视觉 QA

全部九图逐张检查 Desktop light、Desktop dark、Mobile 三种状态；手机逐张展开并横向分段滚动、纵向查看底部说明。桌面实测内容视口宽 1309px，手机为 390 × 843px。

本轮发现并修正的显示问题：

1. 原通用箭头被映射为较暗的 border token；改用 `muted-foreground`，提高深色连线与箭头可读性。原有颜色含义、箭头方向、虚实线和节点关系不变。
2. 原浅色标签底色被映射为饱和 secondary token；改用中性 `muted`，保持明暗主题下的文字对比度，不增加 badge。
3. STB-D07 的 `Synthetic dollar exposure` 超出节点边框；仅在显示层将同一标签换为两行，节点和连线不动。
4. 原手机弹窗的宽图会把标题、摘要一起横向撑开；现改为图表自身的独立滚动区域，弹窗标题、摘要和关闭按钮保持在视口内，长标题预留关闭按钮空间。
5. 手机展开图保留至少 1200px 宽度，正文仍提供摘要，不把整图压入手机宽度。图表滚动区域可聚焦并有双语 accessible label；没有删减图中关键关系。

| 图 | 最终核对结果 |
| --- | --- |
| STB-D01 | 明示并非每种稳定币经过所有节点；压力损失由谁吸收的问题保留。 |
| STB-D02 | Stablecoin、CBDC、tokenised deposit、tokenised fund share 四组分开，未混为同一权利。 |
| STB-D03 | 三轴及五个教学入口可读；正文和展开摘要明确可重叠、可变化，不是永久互斥法律分类。 |
| STB-D04 | 监管演进的五阶段可读，未变为现行许可状态或国家排名。 |
| STB-D05 | Eligible direct customer 与 Secondary holders 为分开的节点，赎回路径和权利限定可读。 |
| STB-D06 | SAFE / UNSAFE、清算、压力点与单独的 peg-support 说明均保留。 |
| STB-D07 | Backing、Custody / OES、Derivative hedge、hedge maintenance、直接交易对手及二级持有人完整可读；长标题不再越界。 |
| STB-D08 | Intended arbitrage loop 与 Reflexive stress loop 上下分区、不同边框色及反馈虚线保留，手机滚动能查看完整循环。 |
| STB-D09 | Mechanism migration 与 Adjacent digital money 两组分开；frxUSD 仅在当前机制说明中出现。 |

30 次页面检查均无整页横向溢出，9 个手机图弹窗外层均无横向溢出，宽图仅在内部滚动。About 保持分隔线、短段落、列表、矩阵和留白，没有新增大白卡墙、KPI、team/dashboard 组件、装饰性币图、机器人或 stock image。

另将实际 DOM 中两种桌面主题下的 18 份 SVG 与原图比较：矩形、路径、连线、节点坐标、方向、虚线及文字锚点保持一致；标签仅有上述 `International standards` 同义修订和 STB-D07 换行。

### 原包完整性与非阻断差异

- ZIP 压缩内容检查通过；原 ZIP 为 **807876 bytes**，SHA-256：`37b0b92391381d6bbb9514cf36e3fe7a498877055b3aeb6523f8981b210055e9`。
- 原包解压的 **39/39** 文件逐字节匹配 ZIP，记录每个文件 bytes / SHA-256。
- public 中 **9/9** frozen SVG 逐字节匹配原包；生成数据存档没有修改。
- `PACKAGE_INVENTORY.json` 自记录 **1108 bytes**，实际 **3027 bytes** 的 metadata discrepancy 继续原样记录为**非阻断**。没有修改原始 package 来修正该数字。

### 最终验证与证据

| 检查 | 结果 |
| --- | --- |
| About 回归 | 10/10 |
| Homepage / Research 回归 | 11/11 |
| Asia 回归 | 11/11 |
| Agentic 回归 | 7/7 |
| 全专题联合回归 | **39/39 通过** |
| `pnpm run typecheck` | 通过 |
| `pnpm run build` | 通过；包含全工作区 typecheck / build |
| `git diff --check` | 通过 |
| About 浏览器 console | error / warn 为空 |

构建仍有既有 UI 组件 sourcemap 原位置提示和大 bundle 警告，退出码为 0；本轮不扩展为打包优化。已有工作区其他未提交改动保留；构建按既有流程重打包 connector ZIP，不作为 About 文案修订。

本轮记录位于 `outputs/about-stablecoins-final-qa-2026-10-16/`：

- `rendered-before-main.json`、`rendered-before-types.json`：修订前实际英文。
- `rendered-final.json`、`mobile-final.json`：最终 30 次页面检查及实际英文。
- `visual-records.json`、`mobile-visual-records.json`：18 次桌面及 9 次手机展开图记录。
- `STB-D01` 至 `STB-D09` 的 light / dark / mobile 分段截图、contact sheets、手机 sidebar 和英文 source popover 截图。
- `final-qa-checks.json`、`integrity-final.json`：公开文案/导航/溢出/机制图坐标对比及文件完整性结果。
- `regression.log`、`typecheck.log`、`build.log`、`console-final.json`：最终验证记录。

结论：本轮未发现仍需人工裁决的内容冲突、翻译错误或机制边界问题。metadata discrepancy 保留为非阻断事项；内容最终批准仍由用户/研究负责人决定，本轮不自行标记为 APPROVED_FOR_MERGE。验收结束恢复英文、浅色主题和默认视口，复用的本地开发服务保持运行。

## 11. APPROVED_FOR_MERGE 与独立本地提交

2026-10-16，用户明确确认 About Stablecoins V0.2 最终内容、英文文案与视觉验收通过，并授权创建一次独立本地 Git commit，状态更新为 **APPROVED_FOR_MERGE**。以上施工及 QA 阶段的“等待批准 / 不 commit”记录保留为历史过程，本节及文首状态为当前批准状态。

提交信息：`feat: rebuild about stablecoins section v0.2`。仅纳入 About 必要实现、导航与面包屑清理、原始 ZIP / 39 文件 source archive / 9 张 public frozen SVG、数据导入脚本、相关测试、验收文档及两轮 About QA 证据。`.gitattributes` 为本专题 source archive 和 public SVG 禁用文本换行转换；源包原有 Markdown hard breaks / CSV CRLF / reference 文件末尾空行原样保留，仅对原包存档设置相应 whitespace 属性，不修写原始文件以消除空白检查提示。

提交前再次运行并确认：

- 全专题联合回归 **39/39 通过**（About 10 + Homepage/Research 11 + Asia 11 + Agentic 7）。
- `pnpm run typecheck` 通过。
- `pnpm run build` 通过，包含全工作区 typecheck/build；仅有既有 sourcemap / bundle 提示。
- `git diff --check` 与 `git diff --cached --check` 通过。
- 原 ZIP 仍为 807876 bytes，SHA-256 与本节之前记录相同；39 个源文件及 9 张 public SVG 逐字节一致。metadata discrepancy 仍仅为验收记录中的非阻断事项。

本次不纳入 `.gitkeep` 删除、connector ZIP 构建产物、audit-import-folders、规划 32/33、ChatGPT 内容交接包/脚本等其他工作区改动。`layout.tsx` 仅暂存 About 必需的导航和面包屑改动，原有 `activeAliases` 字段与判断改动留在工作区。不会 push，也不会部署 Render。

重新检查日志：`outputs/about-stablecoins-final-qa-2026-10-16/pre-commit-regression.log`、`pre-commit-typecheck.log`、`pre-commit-build.log`。
