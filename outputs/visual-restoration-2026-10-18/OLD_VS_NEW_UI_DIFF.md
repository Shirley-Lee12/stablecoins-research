# Old vs restored UI — 差异登记

视觉基线542f534；恢复版基于c8a7b602。**只比较视觉，旧截图中的事实与产品宣称不能作为内容恢复依据。**

| 页面/区域 | 已恢复 | 有意保留的新结构或差异 | 裁决 |
|---|---|---|---|
| 首页 | 原六段次序、1024px宽度、左竖线hero、原字号/间距、使命双栏、成果时间线、计划边线卡片、团队/页脚、模块网格、边缘目录 | 正确成果状态与边界导致时间线更高；未来计划7项；新增Agentic和研究者入口；研究导航图/五个问题及证据放在可展开区 | 核心视觉恢复；新增功能待用户视觉确认 |
| 侧栏 | 256px展开/64px收起、原背景/图标/间距/高亮、原Collapsible子项缩进及箭头 | 加入Agentic4项；使用真实button；正确的资源/研究者/风险框架名称；监管只在About子菜单出现 | 原视觉机制+必要功能修复 |
| 关于稳定币 | 旧max-w-7xl、原外层留白，恢复6子菜单 | 保留新版教学图、机制分类、来源、页内二级导航；不以旧错误事实替换 | 内容驱动差异保留，截图供确认 |
| 智能体支付 | 使用旧站同一字体/配色/1024px外层/字号及卡片设计token | 旧提交无该页面，旧截图为not-found；保留新版节导航、协议表、证据、风险说明及SVG | 无旧页面可逐像素对比；作为功能移植验收 |
| Our Research | 1480px外层、旧双栏渐变首屏、海洋蓝衬线标题 | 保留会议概念框架章节、代表性风险、状态和证据；不恢复旧完整55风险清单/预警产品宣称；修正后的55/4/4/2026概览代替旧虚假目标 | 视觉语言恢复；正确研究结构保留 |
| Risk Framework | 1280px宽度（与旧max-w-7xl等价）、旧站字体/色彩/边线 | 概念框架及T0–T3/L0–L3替代旧虚假指数/实时概率卡片 | 不恢复错误产品；结构差异待视觉确认 |
| Market Data | 原max-w-7xl及全局视觉token不变 | 保留v0.2证据、来源时间、状态和Artemis retired说明；不恢复旧不受支持的指标/旧API消费结构 | 本轮不重新设计数据模块 |
| Academic Resources | 旧max-w-screen-xl、3xl衬线标题和分隔线 | 新公开目录卡片、主题筛选、证据类型、unknown、ID定位等保留；不同于旧843作者书目式资源体验 | 功能与审核边界优先保留，差异明确登记 |
| Researchers | 旧max-w-7xl、3xl标题及分隔线 | 保留10个verified researcher投影、机构与发表时隶属区分；不将旧843书目作者当作已核验研究者 | 不重建身份关系 |
| Asia/Regulatory/作者页/登录管理页等 | 共用侧栏保持旧视觉 | 本轮未改其页面组件；其既有新内容图表与旧版差异仍在 | 登记，不扩展重设计 |

## 截图索引

每组包含：旧版/恢复版 × 1440×1000与390×844 × 中文浅色/英文深色。旧Agentic不存在的4格标N/A，不计作旧Agentic设计通过。完整索引与console/geometry证据：`VISUAL_BROWSER_MATRIX.json`。首页四个下方区块另有手机/桌面对照。

打开 [VISUAL_REVIEW.html](VISUAL_REVIEW.html) 可逐页切换比较；也可直接查看：

- [旧版首页 desktop](screenshots/baseline-home-1440-zh-light.png) / [恢复首页 desktop](screenshots/restored-home-1440-zh-light.png)
- [旧版首页 390px](screenshots/baseline-home-390-zh-light.png) / [恢复首页 390px](screenshots/restored-home-390-zh-light.png)
- [恢复菜单 390px](screenshots/sidebar-390-zh-light.png)
- [恢复研究页 desktop](screenshots/restored-research-1440-zh-light.png)

原版预览的市场快照仅做格式适配，没有为旧项目补造状态/价格。截图是本地快照，不代表当前生产版本或实时数据。
