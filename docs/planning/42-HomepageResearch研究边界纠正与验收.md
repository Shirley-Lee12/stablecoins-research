# Homepage / Research 研究边界纠正与验收

日期：2026-10-17。状态：LOCAL QA PASS / 待用户验收。本轮未 commit、未 push、未部署 Render。

## 范围与依据

执行用户的 `CROSS-PAGE RESEARCH BOUNDARY CORRECTION — HOME + RESEARCH ONLY`。只纠正 `/`、`/research` 及其真正依赖的 home-research 数据、翻译、组件、生成器、测试与文档。当前网站研究与硕士毕业论文是两个独立项目。本轮没有重新审查已批准会议框架，没有新增事实，没有修改数据库、API 或其他专题研究结论。

上一轮三条 `/quantitative*` 路由及 T0–T3 / L0–L3 映射保持原样。6 个受保护核心文件和上一轮 12 个实现、测试、文档文件的 SHA-256 与本轮前记录一致。详见 `outputs/home-research-boundary-qa-2026-10-17/scope-after.json`。文档 41 的历史跨页问题记录不作追改；该问题由本文记录本轮纠正结果。

## 修改前的问题及源头

- 两页共用的研究状态、英文覆盖层和旧流程图将会议框架延伸为论文方法、实证或平台建设状态。
- 原生成器把旧 Content Master、研究状态及全部图形导入运行时，关闭弹窗或隐藏响应式分支仍可能携带旧文案。
- HOME-D01 的小号 tspan 也含 TE / Hawkes；不能仅检查大标题或页面正文。

## 纠正后的研究边界

Current Study 仅指 AI-DEFIT 2026 已接收会议论文 **Establishing a Multi-Dimensional Risk Framework over the Full Lifecycle of Stablecoins** 及其直接支持的概念框架。保留一般金融风险与稳定币特有风险的区分、atomic-risk 概念、55 submitted-framework count、风险相互作用、生命周期与放大/传导映射，以及风险传导解释。

55 只作为已提交框架的风险数量；页面仅使用已批准会议材料中的 C5、C26、U18 三个代表性例子，没有重建完整 55 项名单。Atomic 不表示因果独立或统计独立。生命周期位置与因果角色不同，L0/L1、L1/L2、T0/L1、T3/L3 的边界保留。

Future Research 单独成区，共用明确的双语边界声明：不是既有成果、尚未实施、不构成已经验证的模型或运行中的监测产品。七项方向来自已批准会议施工包，不标记为完成，也不出现硕士论文具体方法名称。

### 首页

保留平台定位、AIF 支持、五个问题入口与证据导航。已完成研究只列“2026 多维风险框架”与“2026 已接收会议论文”，并明确这是同一项研究的框架与论文。Asia、Agentic、监管、市场、资源库与研究者目录均作为导航入口，不作为额外已完成研究。

### /research

采用十节：Study Overview、Research Question、Framework Architecture、Atomic Risk Framework、Lifecycle Mapping、Amplification & Transmission Mapping、Risk Transmission Logic、Research Contribution、Conference Paper、Future Research。保留 `#55-risk-framework`，支持 `#conference-paper` 与 `#future-research`，链接三条已批准映射路由。

删除/替代的公开内容类别：TE/Transfer Entropy、Hawkes 等论文方法，经验网络/模型/测量验证状态，候选指标与阶段筛选流程，压力测试/历史事件/模拟结果，以及脱锚概率、已校准模型、Q3 2024、支付网关合作、运行中预警平台等旧产品声明。清理覆盖中英文、活动数据/metadata、可访问标签及隐藏弹窗/响应式内容，不以 CSS 隐藏替代源头修正。

## 文件修改记录

| 文件 | 修改 |
| --- | --- |
| `artifacts/stablecoin-hub/src/pages/home-overview.tsx` | 首页完成成果收敛为同一会议研究，独立未来方向，保留导航 |
| `artifacts/stablecoin-hub/src/pages/research.tsx` | 会议框架十节、概念边界、公开论文链接与 hash 跳转 |
| `artifacts/stablecoin-hub/src/components/home-research-ui.tsx` | 共用当前/未来标识、来源 UI、PDF 链接、干净导航图与手机弹窗 |
| `artifacts/stablecoin-hub/src/data/home-research.ts` | 两个当前记录、框架/边界文案，复用已批准会议映射 |
| `artifacts/stablecoin-hub/src/data/home-research-v02.generated.json` | 移除旧研究状态/内部来源/污染图形，只导入允许的运行时数据 |
| `artifacts/stablecoin-hub/src/data/home-research-english-copy.ts` | 删除旧英文覆盖层 |
| `scripts/prepare-home-research-package.mjs` | 允许字段导入；仅对运行时导航 SVG 两处小文案纠正；核验原有公开 PDF |
| `scripts/tests/home-research.test.ts` | 原 11 项替换为 28 项边界与正向保留测试 |
| `artifacts/stablecoin-hub/public/home-research/v0.2/HOME-D01-research-hub-map.svg` | 删除含旧声明的公开副本；改用纠正后的内联图 |
| `artifacts/stablecoin-hub/public/home-research/v0.2/HOME-D02-research-maturity.svg` | 删除过时公开副本 |
| `artifacts/stablecoin-hub/public/home-research/v0.2/RES-D01-research-pipeline-status.svg` | 删除过时公开副本 |
| `artifacts/stablecoin-hub/public/home-research/v0.2/RES-D02-quantitative-research-map.svg` | 删除过时公开副本 |
| `artifacts/stablecoin-hub/public/home-research/v0.2/RES-D03-taxonomy-to-measurement.svg` | 删除过时公开副本 |
| 本文 | 独立施工与验收记录 |

另增本轮 QA 目录 `outputs/home-research-boundary-qa-2026-10-17/`，包含逐文件 hash、执行日志、公开渲染文本、截图与检查矩阵。原始 Home/Research source package 的 29 个文件逐字节不变；原始归档仍保留旧历史内容，不继续进入运行时。生成器两次输出一致。

现有公开 PDF 保持原 URL 与字节不变：`/media/research/ai-defit-2026-stablecoin-risk-framework.pdf`，11,838,783 bytes，SHA-256 `25eaf2418c2cb6c1a3fb20302203608973650f736893bd4b66811fe8bc54344d`。没有读取或发布新的私人论文材料。机构与会议官方来源沿用原记录日期，本轮没有声称重新核验外部事实。

## 自动化验证

- Targeted：28/28 PASS。React 实际渲染中英文，测试替身展开所有 tooltip/popover/dialog 子内容；额外扫描活动 metadata。
- 检测方法使用精确短语与 word boundary，不以字符串内部的 TE 命中普通单词；包含防误伤测试。
- 正向检查论文完整标题、接收身份、55 submitted count、T/L、当前与未来区分、代表风险来源、公开 PDF 完整性与链接。
- 全专题回归：153/153 PASS（原 136 项中的 Home/Research 11 项替换为 28 项，其余 125 项保留；会议路由 27 项继续通过）。
- `pnpm run typecheck`：PASS。
- `pnpm run build`：PASS；现有 sourcemap / >500 kB chunk 提示非阻断，本轮未扩大为构建优化任务。
- `git diff --check`：PASS，最终日志见 QA 目录。
- 最终测试命令：在 `scripts/` 执行 `pnpm exec node --import tsx --test tests/home-research.test.ts` 及 `pnpm exec node --import tsx --test tests/*.test.ts`。直接 tsx CLI 的 IPC 在沙箱被拒，改用同一 tsx loader 后通过，不需要更改权限。

## 实际浏览器与视觉 QA

- `/` 与 `/research`：320、390、768、1440 px × en/zh × light/dark，共 32/32 组合 PASS。实际 innerWidth、主题 class、scrollWidth、当前/未来、7 个方向与禁用声明扫描全部记录。
- 来源桌面 keyboard-focus tooltip、手机 tap popover 可读，来源日期与最后核验保留。
- 手机导航图使用摘要 + 展开，保留图形关系与局部滚动。截图复核发现标题被图形 min-width 撑出可视区，已将滚动限制在图形容器，标题/关闭按钮独立保留；最终 320px 中文与 390px 英文验证通过。较早失败截图以 `before-header-fix` 标记，最终截图及 `popup-checks.json` 记录修正后结果。
- 主要界面截图、`research-future-en-dark.png`、`research-mobile-source-popover-zh-dark.png`、`home-mobile-navigation-dialog-zh-dark-320.png` 和最终英文弹窗截图提供可审查证据。
- 三条 `/quantitative*` 路由：1440/en/light 与 390/zh/dark，共 6/6 smoke PASS；标题、无横向溢出及禁用项扫描通过。原页面实现和映射没有修改。
- 浏览器 console error/warn：0（见 `browser-console.json`）。

## 专项扫描与剩余事项

```text
HOME_THESIS_BOUNDARY_VIOLATIONS = 0
RESEARCH_THESIS_BOUNDARY_VIOLATIONS = 0
LEGACY_PRODUCT_CLAIMS = 0
CONFERENCE_STUDY_PRESERVED = YES
CURRENT_FUTURE_BOUNDARY_CLEAR = YES
QUANTITATIVE_ROUTES_REGRESSION = PASS
```

未发现新的需人工裁决的研究概念冲突。旧来源归档中的论文语言保留为历史原文，不作为当前公开页面输入；本轮没有扩展为全站资料清理。现有构建体积提示仍保留。

工作区原有其他修改（包括上一轮 conference routes、本来已修改的 connector ZIP、导入审计脚本、两个 .gitkeep 删除、历史规划与 handoff 输出）保持未提交，没有 reset/checkout 覆盖。索引没有暂存变更。本轮在本地验证后停止，未 commit、未 push、未部署 Render。
