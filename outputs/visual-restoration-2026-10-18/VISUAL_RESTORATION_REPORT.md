# Visual Baseline Restoration — Phase 1 LOCAL ONLY

2026-10-18 · 用户视觉验收待完成。

## 结果与边界

已恢复旧版首页六段结构、竖线标题区、1024px 内容宽度、侧栏样式及可展开导航；移植已核验研究、智能体支付和新版目录功能。未将项目整体回退。研究页恢复旧版双栏渐变首屏，资源和研究者页面恢复旧版宽度、标题层级及分隔线。**本报告不声称所有内容页与旧版逐像素一致**；保留的必要结构差异见 [OLD_VS_NEW_UI_DIFF.md](OLD_VS_NEW_UI_DIFF.md)。

- 视觉基线：`542f53491e4df05dd153aca2b4ed397a482ecff3`
- 功能/事实基线：`c8a7b6024c0b966781ed3aa4918e22586cacfdd8`
- 分支：`fix/restore-original-ui`，从核验过的最新远端 main / 本地 HEAD c8a7b602 创建。
- 开始时 tracked clean；既有未跟踪审计文件保留。旧视觉提交是 c8a7b602 祖先；本轮仅增量修改。
- 本地提交 SHA 见本目录 `LOCAL_COMMIT.json`，也可执行 `git rev-parse fix/restore-original-ui`。
- 未 push、未更新 main、未操作 Render、未连接生产数据库。

## 具体合并

| 文件 | 修改 | 保留 |
|---|---|---|
| `pages/home-overview.tsx` | 以旧版首页介绍、使命、时间线、计划、团队、模块组成页面；恢复旧间距与卡片边线 | 已核验研究状态、55数量边界、会议日期、双语引用、导航图、全部7项未来方向 |
| `components/layout.tsx` | 恢复关于稳定币6子项，新增智能体支付4子项；真实button支持键盘；直接进入子页自动展开；收起侧栏点击分组可靠打开 | 新搜索、主题、语言、登录/通知、面包屑、地区别名及旧侧栏视觉类 |
| `components/global-search.tsx` | 恢复左侧搜索图标和⌘K提示 | 实际form提交、编码、快捷键、资源筛选 |
| `components/home-research-ui.tsx` | 添加首页编辑式呈现变体；研究章节回到旧衬线标题体系 | 原研究数据、来源弹窗、研究状态、SVG本体与放大交互 |
| `components/about-stablecoins-ui.tsx` | 恢复max-w-7xl及旧外层留白 | 新教学内容、来源、机制路由 |
| `components/agentic-payment-ui.tsx` | 在旧站1024px内容体系内呈现，去除额外双重内边距，标题沿用原字号 | 全部协议/场景/证据、双语、主题、SVG尺寸修复及弹窗 |
| `pages/research.tsx` | 旧版1480px外层及双栏首屏；渐变研究概览改放已核验的55/4/4/2026 | 概念框架边界、匿名论文链接、日期、后续研究状态 |
| `pages/academic-directory-v02.tsx` | 资源1280px、研究者max-w-7xl、旧标题和分隔线 | v0.2公开投影、筛选排序、单条ID、机构、研究者与作者边界 |

没有改动全局 index.css；旧版字体、海洋蓝、底色、暗色变量、半径与基础样式字节保持一致。未整文件替换 layout.tsx。

## 实际浏览器验收

Playwright + 本地 Chromium，desktop 1440×1000、mobile 390×844，DPR=1。每个390px单元实际测量 `window.innerWidth`、`document.documentElement.clientWidth` 均为390，document/main无横向溢出。

| 检查 | 结果 | 证据 |
|---|---|---|
| 8优先页 × desktop/mobile × 中文浅色/英文深色 | 32/32 PASS | `VISUAL_BROWSER_MATRIX.json` |
| 原版对照截图 | 28个可比较页面 + 4个Agentic旧路由不存在的N/A截图 | 同上；不将旧404当作Agentic基线 |
| 关于6链接、智能体4链接、鼠标/Enter/Space、子页高亮、桌面收起展开、双语/主题 | 8/8组合 PASS | `NAVIGATION_FUNCTIONAL_QA.json` |
| 实际全局搜索提交并显示ID114 | 1/1 PASS | 同上 |
| 8个真实协议详情 × desktop/mobile × zh/en × light/dark | 64/64 PASS | `AGENTIC_ROUTE_QA.json` |
| 原3个Agentic SVG路由 × zh/en × light/dark，390px | 12/12 PASS | `after-12-cells.json` |
| SVG 768px/1440px、双语主题及图形比例 | 24/24 PASS | `after-desktop-svg.json` |
| 本地legacy/public-directory/market快照合约、POST拒绝 | 7/7 PASS | `LOCAL_API_COMPATIBILITY.json` |

所有恢复版记录均检查console.error、uncaught pageerror、实际DOM、横向尺寸；SVG另检查viewBox比例、可见尺寸及放大弹窗。没有过滤或忽略console.error。主导航的十个目标均真实点击，不只检查截图。

人工查看了新旧首页、研究首屏、关于页、智能体及资源手机截图；旧/新首页相同位置的标题区域几何值：

| 视口 | 左侧位置 / 区域宽度 | H1字号 / 颜色 |
|---|---|---|
| 1440px | 旧=新：336 / 1024px | 旧=新：36px / rgb(40,63,138) |
| 390px | 旧=新：16 / 358px | 旧=新：30px / rgb(40,63,138) |

字体栈也相同，详见 `HOME_GEOMETRY_COMPARISON.json`。新成果时间线因必须显示正确状态和边界，内容高度自然不同。

## 测试与构建

- 完整测试 **218/218 PASS**，0 fail、0 skip。原213项+新增5项。
- 原“About不得有children”断言与本次用户明确要求冲突，已替换为六目标/单一监管入口的断言；没有删测试或降低研究、隐私、数据库断言。
- `pnpm run typecheck` PASS；最终 `pnpm run build` 内再次通过类型检查并完成所有workspace构建。
- `git diff --check` PASS。构建重新生成的无关连接器ZIP已恢复为任务开始的原字节。
- 构建仍有既有bundle>500kB提示；本轮不引入打包重构。
- 真正旧/新资源API、审批隔离、当前schema、重启持久化及回退兼容测试运行在临时PGlite，**不是生产数据库**。本地快照合约不冒充生产测试。

## 事实和受保护输入

`PROTECTED_INPUT_CHECK.json`：backend、lib/schema/API、冻结source-packages、全部generated/data、public/PDF/ZIP、index.css、DEPLOYMENT.md均无差异。55 atomic risks的提交框架边界、AI-DEFIT会议研究定位、未来研究状态、Artemis historical/retired、DOI/作者/日期修正均保留。未重新生成论文；未重建作者身份关系。公开团队展示来自旧首页，不与新版verified researcher身份自动关联。

新增风险/限制：旧版Market UI依赖summary/projects，而当前API使用v0.2 metric结构，因此**不能整体回滚旧前端对接新版API**。本轮只合并视觉。旧版截图预览专用本地格式适配器，保留已有数值、未知字段为null、项目列表为空；不写入产品或生产API。新目录与风险框架必须保留新的正确内容结构，差异已登记。

## 停止点

请先审阅 [截图对照](VISUAL_REVIEW.html) 与 [本地预览指引](LOCAL_PREVIEW_INSTRUCTIONS.md)。下一阶段上线必须等待用户批准本地界面。本轮生产版本没有任何操作。

```text
OLD_UI_VISUAL_BASELINE_RESTORED = YES
ABOUT_STABLECOINS_SUBMENU_PASS = YES
AGENTIC_PAYMENTS_INTEGRATED = YES
VERIFIED_CONTENT_PRESERVED = YES
NEW_API_COMPATIBILITY_PASS = YES
FULL_TESTS = 218/218 PASS
TYPECHECK = PASS
BUILD = PASS
PUBLIC_THESIS_BOUNDARY_VIOLATIONS = 0
LEGACY_PRODUCT_CLAIMS = 0
VISUAL_REVIEW_PENDING = YES
PRODUCTION_DEPLOYED = NO
PRODUCTION_DML = 0
PUSHED = NO
MAIN_UPDATED = NO
```
