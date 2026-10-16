# Agentic Payments｜Codex-ready Content & Asset Package V0.2

项目：Stablecoin Research Hub  
整理日期：2026-10-15
视觉资产状态：6 张核心机制图 READY；Timeline 数据 READY；官方产品视觉为非阻塞参考素材  
状态：REVIEW  
用途：Codex 前端施工前的“内容 + 素材 + 来源 + 页面规则”交接包。

## 这个包已经完成什么

本包把三批研究底稿压缩成可施工结构，不要求 Codex 自行重新研究、判断协议层级或从长报告中提炼网页内容。

包含：
- 页面级中文/英文内容主稿；
- 路由与模块清单；
- 协议卡片、生态卡片结构化数据；
- 7 张核心解释图的画面脚本；
- 官方截图获取清单；
- Asset Manifest；
- Source Manifest；
- 旧页面路由处理建议；
- 研究底稿到施工包的修正说明；
- Codex 实施边界。

## 核心内容原则

1. 稳定币是网站主线；Agentic Payment 不等于 Stablecoin Payment。
2. Protocol、Product、Infrastructure、Pilot、Partnership、Research 必须分开。
3. Blockchain 不等于 Stablecoin；Token 不一定是 crypto token。
4. 普通用户先看“我怎么授权、AI 能花多少、钱走哪条 rail”；研究者再看 protocol spec。
5. 不把研究计划、试点、白名单验证写成大规模生产。
6. 不展示无法证实的“实时风险概率”“合作机构已接入”等旧陈述。
7. 来源靠近事实；重要时间、版本、规模陈述要保留 last_verified。
8. Codex 不得用占位假数据或自行补全 UNKNOWN 字段。

## 当前路线

保留现有主栏目：
- /agentic-payments
- /agentic-payments/protocols
- /agentic-payments/scenarios
- /agentic-payments/ecosystem

保留并重做：
- /protocols/ap2
- /protocols/acp
- /protocols/amp
- /protocols/x402
- /protocols/apop
- /protocols/ucp

建议新增：
- /protocols/mpp
- /protocols/act

建议暂停或重定向：
- /protocols/a2p2

A402 当前作为“支付宝 Machine Pay 内的 402/A2M 支付方法/规范”进入页面与卡片，不在 V0.1 中强制新增独立一级协议页。

## 文件说明

- `content/CONTENT_MASTER.zh-CN.md`：中文网页内容主稿
- `content/CONTENT_MASTER.en.md`：英文网页内容主稿
- `manifests/PAGE_MANIFEST.csv`：页面/路由/模块/状态
- `manifests/ASSET_MANIFEST.csv`：视觉素材状态
- `manifests/SOURCE_MANIFEST.csv`：来源台账
- `cards/PROTOCOL_CARDS.csv|json`：协议卡片数据
- `cards/ECOSYSTEM_CARDS.csv|json`：企业/产品生态卡片
- `visuals/VISUAL_SCRIPTS.md`：7 张核心图精确画面脚本
- `visuals/SCREENSHOT_ACQUISITION.md`：官方截图获取清单
- `CODEX_HANDOFF.md`：Codex 实施规则
- `RESEARCH_CORRECTIONS.md`：相对于研究底稿 V0.3 的修正
- `reference/current-site-not-to-copy/`：现有页面截图，仅用于理解现状，禁止高保真照搬
- `reference/research/`：研究底稿与审计文件，只作证据库

## Ready Gate

只有当页面在 `PAGE_MANIFEST.csv` 中标记 `READY_FOR_CODEX` 时才允许直接施工。
当前 V0.1 中：
- Overview / Protocols / Scenarios / Ecosystem：CONTENT_READY，视觉素材尚需制作；
- Protocol detail：CONTENT_READY / SOURCE_READY，视觉资产待制作；
- A2P2：HOLD。


## V0.2 visual freeze

The six mechanism visuals are now content-frozen and available under `visuals/final/`.

`TIMELINE_DATA.json` replaces a static timeline image so Codex can build a responsive component.

Official product screenshots are non-blocking evidence assets. Follow `visuals/OFFICIAL_VISUAL_STATUS.md`; never substitute third-party screenshots just to fill space.

## Handoff readiness

This package is now suitable to send to Codex **as a single ZIP** for implementation, provided the user accepts the six visual concepts. Individual manifest/content files do not need to be uploaded separately.
