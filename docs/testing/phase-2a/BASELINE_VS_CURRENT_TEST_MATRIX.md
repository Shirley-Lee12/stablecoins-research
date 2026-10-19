# BASELINE VS CURRENT TEST MATRIX

## 两阶段结果，不能混淆测试环境修复与应用缺陷修复

|阶段|632源码|894/修复后源码|解释|
|---|---|---|---|
|各自Git版本原样测试，相同Node/依赖/命令|141/162 PASS，21 FAIL|150/168 PASS，18 FAIL|三文件加载失败；比原工作区多1个未跟踪audit fixture缺失|
|共同加载器/有效选择器修正，632不改应用|191/220 PASS，29 FAIL|211/232 PASS，21 FAIL|所有应运行文件已加载；源码修复使5真实缺陷通过；894先前3个Agentic改进也通过|
|Agentic定向及治理|—|51/51 PASS，0skip|含14项明确归档的历史SVG renderer保护；实际D01另有测试与浏览器检查|
|Production UI unit|—|26/26 PASS|实际挂载搜索、语言、404、面包屑、移动aria、视觉契约|
|真实浏览器|—|8/8 主回归 + 8/8 搜索矩阵|1440/390双语主题；搜索1660/390，纯本地GET缓存，无生产请求|

## 为什么不是168，也不是照搬213

- 原632有14个文件，原894增加post-release测试文件为15个；3个失败加载文件各只计一个失败占位，隐藏了真正的内部测试。
- 恢复加载后，home30 + phaseC14 + regulatory17 = 61项，替代原来的3个失败占位。632：162−3+61=220。
- 原894：168−3+61=226；本轮新增6个用例（视觉功能例外保护1、实际D01双语2、triage回归3），最终232。
- 本轮增加triage文件，当前共16个；Node events与磁盘glob逐文件对照，16/16已加载；基线14/14已加载；0个文件级加载失败，0skip。治理的11个子测试真实执行，包含在14项该文件计数中。
- 相同测试环境不意味着版本新增用例必须存在于旧Git版本。比较回归使用双方共同的有效断言；当前12项版本/新回归用例在632文件集中不存在，标记N/A而非伪造失败。

## 实际每文件计数

|文件|632 PASS / FAIL|当前 PASS / FAIL|
|---|---|---|
|`about-stablecoins.test.ts`|10 / 0|10 / 0|
|`academic-directory-manual.test.ts`|10 / 0|10 / 0|
|`academic-directory.test.ts`|21 / 0|21 / 0|
|`agentic-payments.test.ts`|4 / 3|7 / 0|
|`asia-development.test.ts`|8 / 3|8 / 3|
|`conference-risk-framework.test.ts`|26 / 1|26 / 1|
|`final-site-corrections-phase-a.test.ts`|9 / 5|14 / 0|
|`friday-ui-release.test.ts`|7 / 0|7 / 0|
|`home-research.test.ts`|25 / 5|25 / 5|
|`market-data-dashboard.test.ts`|22 / 0|22 / 0|
|`phase-b-corrections.test.ts`|15 / 1|15 / 1|
|`phase-c-agentic-svg.test.ts`|14 / 0|14 / 0|
|`post-release-agentic-integration.test.ts`|N/A|9 / 0|
|`regulatory-overview.test.ts`|6 / 11|6 / 11|
|`release-governance.test.ts`|14 / 0|14 / 0|
|`triage-production-ui.test.ts`|N/A|3 / 0|

## 逐用例对照与新回归

机器可读CASE_COMPARISON.json及两个runner events保存全部用例名称、状态、实际源文件和失败原文。当前失败集合是632共同失败集合的子集，差集为空，故NEW_REGRESSIONS=0；这并不将剩余21项判为可忽略。原17项逐项裁决与新发现见FULL_TEST_FAILURE_TRIAGE.md。
