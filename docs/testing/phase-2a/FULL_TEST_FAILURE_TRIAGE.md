# FULL TEST FAILURE TRIAGE

## 结论

完整测试文件已全部加载；修复5类真实缺陷和测试环境/过时契约问题。最终 **211/232 PASS，21 FAIL，0 skipped**。剩余21项均在使用同一加载器的632基线复现，**NEW_REGRESSIONS=0**；它们主要是未整合内容与投影要求，不能以“旧版本也失败”为由豁免。**READY_FOR_RELEASE=NO**。本轮不推送、不更新main、不部署、不连接生产数据库。

当前代码从894e040增量修改；632是生产视觉基线。本轮不修改智能体页面、D01、数据、来源、样式或任何未审核设计。正式源仅修复Layout语义/搜索、资源库query参数、HTML语言属性及404功能。

## 可复现基线

隔离目录：`/private/tmp/hub-phase2a-triage-632` 与 `/private/tmp/hub-phase2a-triage-894`。原始脏仓库不动。两者使用Node v24.18.0、同一pnpm11.9.0 lockfile与已有安装；共享node_modules、受保护workspace库内容相同。先原样运行各版本tests，再在双方共同测试文件应用同一加载器/选择器修正进行因果对照；不向632复制应用修复。baseline/current测试文件数量不同是版本新增测试，不是不同runner配置。

原样命令：

```sh
GOVERNANCE_PGLITE_MODULE=/private/tmp/hub-governance-test-runtime-direct/node_modules/@electric-sql/pglite/dist/index.js node --import ./scripts/node_modules/tsx/dist/loader.mjs --test --test-reporter=tap scripts/tests/*.test.ts
```

最终命令增加相同的supplemental inventory reporter：`--test-reporter-destination=stdout --test-reporter=./scripts/tests/helpers/inventory-reporter.mjs --test-reporter-destination=<对应events.ndjson>`，TAP仍是原始runner输出。所有命令及环境见outputs/full-test-triage-2026-10-19/TEST_ENVIRONMENT.json。没有加载.env，也没有生产数据测试fixture。

## 原17项逐项裁决

A=真实缺陷；B=过时测试；C=测试环境；D=待后续模块整合；E=未知。本轮17项为A4/B6/C2/D5/E0；额外发现历史audit fixture环境问题与实际挂载搜索缺陷。

|ID / 原测试名称|632原样结果/失败信息|894原样结果/失败信息|归类与根因|处理建议与本轮结果|
|---|---|---|---|---|
|F01 `all ten pages preserve manifest module order and existing canonical routes`|FAIL · The input did not match the regular expression /export \{ AboutOverviewPage as default \}/. Input: 'import React from "react";\n' + 'import { Link } from "wouter";\n' + 'import { useLanguage（632-before.tap:15）|FAIL · The input did not match the regular expression /export \{ AboutOverviewPage as default \}/. Input: 'import React from "react";\n' + 'import { Link } from "wouter";\n' + 'import { useLanguage（894-before.tap:15）|B. STALE_TEST：632恢复了真正default页面，不再是V0.2重导出wrapper；冻结模块计划本身未变。|更新绑定/路由断言，保留十页数据顺序与所有URL验证。 **PASS**|
|F02 `sidebar has one About entry with no children; regulatory remains independent`|FAIL · The input was expected to not match the regular expression /children:/activeAliases:/\/regulatory/history/types/. Input: 'href: "/about-stablecoins",\n' + ' labelEn: "About Stablecoins",\n' （632-before.tap:374）|FAIL · The input was expected to not match the regular expression /children:/activeAliases:/\/regulatory/history/types/. Input: 'href: "/about-stablecoins",\n' + ' labelEn: "About Stablecoins",\n' （894-before.tap:374）|B. STALE_TEST：已批准的632仅一个About入口，监管位于顶部二级栏，sidebar没有独立监管项。|按632的NAV_ITEMS和顶栏核验；不恢复旧侧边栏。 **PASS**|
|F03 `SectionTopNav has five frozen entries; TypeNav is page-local and scrollable`|FAIL · The input did not match the regular expression /ABOUT.nav.section_top_nav.map/. Input: 'import React from "react";\n' + 'import { SectionTopNav } from "@/components/section-top-nav";\n' + 'i（632-before.tap:415）|FAIL · The input did not match the regular expression /ABOUT.nav.section_top_nav.map/. Input: 'import React from "react";\n' + 'import { SectionTopNav } from "@/components/section-top-nav";\n' + 'i（894-before.tap:415）|B. STALE_TEST：冻结资料五项导航与已批准Friday六项顶栏混淆。|分别检查冻结五项和正式六项，保留TypeNav滚动/可访问性检查。 **PASS**|
|F04 `ten events retain dates and classifications; consultation is not enactment`|FAIL · The input did not match the regular expression /does not establish a final implementation date/. Input: 'import React, { useMemo } from "react";\n' + 'import { Link } from "wouter";\n' + 'im（632-before.tap:2942）|FAIL · The input did not match the regular expression /does not establish a final implementation date/. Input: 'import React, { useMemo } from "react";\n' + 'import { Link } from "wouter";\n' + 'im（894-before.tap:771）|D. PENDING_MODULE_INTEGRATION：Asia frozen事件数据正确保留，但正式Friday页面没有移植所要求的咨询实施未知边界文案。|保留有效语义断言；需后续在原UI中核对/移植日期证据。 **FAIL**|
|F05 `five canonical pages and four compatibility redirects are wired`|FAIL · The expression evaluated to a falsy value: assert.ok(（632-before.tap:3796）|FAIL · The expression evaluated to a falsy value: assert.ok(（894-before.tap:1625）|B. STALE_TEST：Friday批准的兼容URL复用同一个React组件，不使用旧redirect实现；另有共享通用页面函数。|检查两URL绑定同组件及五个公开导出，不以函数总数/redirect字符串当合同。 **PASS**|
|F06 `required modules are ordered, mobile equivalents and bilingual accessible sources exist`|FAIL · '0: four-paths'（632-before.tap:3822）|FAIL · '0: four-paths'（894-before.tap:1651）|D. PENDING_MODULE_INTEGRATION：Asia正式页面仍是Friday叙事，V0.2模块、来源交互和证据字段尚未整合。|保持失败；不为通过测试替换整页布局。 **FAIL**|
|F07 `final English copy uses the authorised wording without changing Chinese strings`|FAIL · artifacts/stablecoin-hub/src/pages/asia-development.tsx 173 !== 106（632-before.tap:3846）|FAIL · artifacts/stablecoin-hub/src/pages/asia-development.tsx 173 !== 106（894-before.tap:1675）|D. PENDING_MODULE_INTEGRATION：旧QA的中文hash基于c8布局；Friday恢复获批后中文结构不同，而新核验英文边界尚未移植。|旧中文QA继续对c8 Git对象校验；正式页对632校验；缺失英文仍失败，不静默覆盖内容。 **FAIL**|
|F08 `three existing URLs resolve to conference pages and old quantitative placeholders are removed`|FAIL · The input did not match the regular expression /@\/pages\/risk-framework/. Input: 'import { Switch, Route, Router as WouterRouter } from "wouter";\n' + 'import { QueryClient, QueryClientProv（632-before.tap:3890）|FAIL · The input did not match the regular expression /@\/pages\/risk-framework/. Input: 'import { Switch, Route, Router as WouterRouter } from "wouter";\n' + 'import { QueryClient, QueryClientProv（894-before.tap:1719）|D. PENDING_MODULE_INTEGRATION：/quantitative三路径仍使用Friday指标/占位页，保留的会议框架页未接入。|保留路由整合断言；未来内容接入须保留正式视觉并单独审核。 **FAIL**|
|F09 `navigation exposes one framework parent and lightweight exact-route links`|FAIL · The input did not match the regular expression /Risk Framework/. Input: '\n' + ' labelEn: "Quantitative Indicators",\n' + ' labelZh: "量化指标",\n' + ' icon: BarChart,'（632-before.tap:4334）|FAIL · The input did not match the regular expression /Risk Framework/. Input: '\n' + ' labelEn: "Quantitative Indicators",\n' + ' labelZh: "量化指标",\n' + ' icon: BarChart,'（894-before.tap:2165）|B. STALE_TEST：量化一级入口在批准的632中仍称Quantitative Indicators；未批准改为Risk Framework。|保留正式命名，继续核验保留框架的exact links与单一一级入口。 **PASS**|
|F10 `404 is bilingual, theme-compatible and offers working canonical return links`|FAIL · 'Unexpected import @/components/ui/card'（632-before.tap:4403）|FAIL · 'Unexpected import @/components/ui/card'（894-before.tap:2234）|A. REAL_DEFECT：真实404页是英文开发提示、固定浅色/深色文字且无返回入口。|修复为双语主题tokens和两个真实返回链接，保留Card布局。 **PASS**|
|F11 `language provider applies exact HTML language codes on switching locale`|FAIL · Expected values to be strictly equal: '' !== 'zh-CN'（632-before.tap:4428）|FAIL · Expected values to be strictly equal: '' !== 'zh-CN'（894-before.tap:2259）|A. REAL_DEFECT：语言Provider只写localStorage，没有同步document.documentElement.lang。|更新lang=zh-CN/en；实际语言切换浏览器验证。 **PASS**|
|F12 `author breadcrumb targets the verified directory and adoption has a bilingual label`|FAIL · The input did not match the regular expression /href: "\/experts"/. Input: ''（632-before.tap:4466）|FAIL · The input did not match the regular expression /href: "\/experts"/. Input: ''（894-before.tap:2297）|A. REAL_DEFECT：通用路径拆分为作者详情生成不存在的/authors链接；adoption缺少标签。|作者返回/experts，解码名称且不推断身份；补Adoption双语标签。 **PASS**|
|F13 `mobile icon controls expose names, navigation relationship and expanded state`|FAIL · 'Close navigation'（632-before.tap:4492）|FAIL · 'Close navigation'（894-before.tap:2323）|A. REAL_DEFECT：侧栏关闭/账户/消息缺accessible name，开关没有expanded/controls关联。|只补aria/id状态和名称，不改className或导航结构。 **PASS**|
|F14 `scripts/tests/home-research.test.ts`|FAIL · 'test failed'（632-before.tap:4590）|FAIL · 'test failed'（894-before.tap:2421）|C. TEST_ENVIRONMENT：VM白名单只覆盖旧UI依赖，遇到实际ContentEdgeNav/研究映射依赖时整文件加载中止。|递归解析真实本地模块、保留SSR内容扫描；30个测试全部执行。 **LOADED: 25 PASS / 5 FAIL**|
|F15 `author page retains publication links and guards legacy metadata display`|FAIL · The input did not match the regular expression /ResearcherCard researcher=\{author.verifiedProfile\}/. Input: 'import { useEffect, useState } from "react";\n' + 'import { useLocation } from （632-before.tap:4809）|FAIL · The input did not match the regular expression /ResearcherCard researcher=\{author.verifiedProfile\}/. Input: 'import { useEffect, useState } from "react";\n' + 'import { useLocation } from （894-before.tap:2640）|D. PENDING_MODULE_INTEGRATION：旧作者页没有接入后端verifiedProfile及共享研究者投影；不是后端权限放宽。|保留失败，不重建作者身份；后续迁移实际投影/legacy标记。 **FAIL**|
|F16 `scripts/tests/phase-c-agentic-svg.test.ts`|FAIL · 'test failed'（632-before.tap:5569）|FAIL · 'test failed'（894-before.tap:3400）|B. STALE_TEST：632换掉了PaymentVisual组件API；旧VM import错误掩盖了目标已退役事实。|完整保留14项历史Phase C renderer断言，明确归档范围；另2项对实际D01执行，不复活旧UI。 **LOADED: 14/14 archived + 2 active D01 elsewhere PASS**|
|F17 `scripts/tests/regulatory-overview.test.ts`|FAIL · 'test failed'（632-before.tap:5594）|FAIL · 'test failed'（894-before.tap:3461）|C. TEST_ENVIRONMENT：CJS VM未转换Vite import.meta.env且旧依赖白名单不足，整文件未执行。|解析真实正式页面与依赖，行选择器读实际HTML，不伪造响应；17项全部执行，11项待整合。 **LOADED: 6 PASS / 11 FAIL**|

### 额外发现，不并入原17项掩盖数量

- **ENV-18 / C**：`dry-run preserves public counts and all non-target records` 在两个隔离工作区均因未跟踪的outputs/ACADEMIC_DATA_DRY_RUN.json缺失而失败。将真实原始离线报告原字节纳入tracked historical fixture，锁定SHA256，保留所有计数/无DML断言。它只证明历史模拟审计，不是今天生产计数或数据库安全证明；实际权限/隔离另由PGlite HTTP测试执行。
- **DEFECT-19 / A**：原GlobalSearch测试指向未挂载组件而假阳性；实际Layout搜索框是div，无提交逻辑，资源库也不消费q。修复实际表单及同路径q更新，外观不变；将原测试改为加载实际Layout函数。统一测试在632中新增暴露此FAIL，修复版PASS；此前894和632搜索函数源码相同。该功能缺陷在之前就存在，不是894引入。
- **环境记录**：默认sandbox中的一次排查运行因本地HTTP listen EPERM导致治理fixture失败；正式验收均以正常审批的本地监听权限执行，不skip、不改权限断言。pnpm11在共享依赖worktree触发auto-install预检，未执行依赖重装；`pnpm_config_verify_deps_before_run=false`仅关闭自动重装预检，实际typecheck/build仍完整执行。原失败日志保留。

F10原样运行最先被缺失Card依赖遮蔽；递归加载修复后，在632正式404上仍复现双语/主题/链接缺陷，故归A并同时修复其C层问题。

## 三个加载失败的真实处置

|文件|修复后执行数|覆盖/限制|
|---|---|---|
|home-research.test.ts|30：25 PASS / 5 FAIL|递归SSR真实页面依赖；UI primitives透明包含popup文字，未伪造API返回；两个实际mapping状态分别渲染|
|phase-c-agentic-svg.test.ts|14/14 PASS|原14断言保留，对已接受c8历史renderer回归，明确是archived；实际D01的2项另在post-release测试执行并有浏览器验证，不谎称D02–D06当前挂载|
|regulatory-overview.test.ts|17：6 PASS / 11 FAIL|转换Vite env、提供显式匿名context并读真实当前table；数据/日期/来源断言照常失败，不造V0.2表格响应|

## 剩余21项：均为D，不能当成新增21个应用回归

保留断言并逐项列出实际错误；以下是同一环境的632也失败的共同集合。来源/日期为仓库内保留快照的差异，不是本轮对现势法律的新核验；冲突应回到第一方来源复核。

|测试名称|实际失败信息|影响与处理|
|---|---|---|
|`ten events retain dates and classifications; consultation is not enactment`|The input did not match the regular expression /does not establish a final implementation date/. Input: 'import React, { useMemo } from "react";\n' + 'import { Link } from "wouter";\n' + 'import {\n' + ' ArrowLeft,\n' + ' ArrowRight,\n' + ' BarChart3,\n' + ' B（894-complete.tap:321）|Asia模块文案/字段/日期未移植；维持原UI，逐项核验后整合。|
|`required modules are ordered, mobile equivalents and bilingual accessible sources exist`|'0: four-paths'（894-complete.tap:1181）|Asia模块文案/字段/日期未移植；维持原UI，逐项核验后整合。|
|`final English copy uses the authorised wording without changing Chinese strings`|The expression evaluated to a falsy value: assert.ok(（894-complete.tap:1205）|Asia模块文案/字段/日期未移植；维持原UI，逐项核验后整合。|
|`three existing URLs resolve to conference pages and old quantitative placeholders are removed`|The input did not match the regular expression /@\/pages\/risk-framework/. Input: 'import { Switch, Route, Router as WouterRouter } from "wouter";\n' + 'import { QueryClient, QueryClientProvider } from "@tanstack/react-query";\n' + 'import { Toaster } from "@/（894-complete.tap:1249）|研究页面/会议日期/方法定义/量化路由仍未接完整内容；不改UI或把未来工作写成成果。|
|`current study is only the framework and its accepted conference paper; future has a separate state`|The input did not match the regular expression /data-home-current-study/. Input: '<div class="max-w-5xl mx-auto space-y-14 pb-12"><nav aria-label="On this page" class="group fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 xl:block"><div class="relative h-72（894-complete.tap:1929）|研究页面/会议日期/方法定义/量化路由仍未接完整内容；不改UI或把未来工作写成成果。|
|`existing public paper and official programme remain accessible without private file links`|The input did not match the regular expression /https:\/\/www\.lait\.fe\.uni-lj\.si\/AI-DEFIT\/program\.html/. Input: '<div class="mx-auto max-w-[1480px]"><p class="mb-6 border-l-2 border-primary pl-4 text-sm leading-7">55 is the submitted-framework count. The（894-complete.tap:1985）|研究页面/会议日期/方法定义/量化路由仍未接完整内容；不改UI或把未来工作写成成果。|
|`framework logic and atomic interactions remain; representative examples are source-provided`|The input did not match the regular expression /minimum useful risk unit for identification and measurement/. Input: '55 is the submitted-framework count. The examples shown here are representative risks from the conference study, not a reconstructed complete （894-complete.tap:2017）|研究页面/会议日期/方法定义/量化路由仍未接完整内容；不改UI或把未来工作写成成果。|
|`research en displays the approved preliminary programme and anonymised download without stale presentation claims`|The input did not match the regular expression /Listed in the preliminary programme:/. Input: '<div class="mx-auto max-w-[1480px]"><p class="mb-6 border-l-2 border-primary pl-4 text-sm leading-7">55 is the submitted-framework count. The examples shown here are（894-complete.tap:2055）|研究页面/会议日期/方法定义/量化路由仍未接完整内容；不改UI或把未来工作写成成果。|
|`research zh displays the approved preliminary programme and anonymised download without stale presentation claims`|The input did not match the regular expression /初步节目表所列场次：/. Input: '<div class="mx-auto max-w-[1480px]"><p class="mb-6 border-l-2 border-primary pl-4 text-sm leading-7">55 是已提交框架的风险数量。这里仅展示会议研究提供的代表性风险，不补造完整名单。</p><nav aria-label="本页目录" class="group fixed rig（894-complete.tap:2081）|研究页面/会议日期/方法定义/量化路由仍未接完整内容；不改UI或把未来工作写成成果。|
|`author page retains publication links and guards legacy metadata display`|The input did not match the regular expression /ResearcherCard researcher=\{author.verifiedProfile\}/. Input: 'import { useEffect, useState } from "react";\n' + 'import { useLocation } from "wouter";\n' + 'import { useLanguage } from "@/lib/language-context";\（894-complete.tap:2299）|研究者verified projection未接旧作者页，必须区分书目作者与已验证身份；不推断关系。|
|`US is enacted and not yet effective; enactment and conditional future effectiveness stay distinct`|The input did not match the regular expression /2025-07-18/. Input: 'United States Federal framework enacted U.S. Congress (2025) Permitted payment stablecoins; federal and qualifying state supervision routes. Permitted issuers include regulated subsidiaries, （894-complete.tap:3187）|监管状态/日期/来源覆盖与保留核验快照不一致；影响事实可信度，发布前须复核与整合。|
|`EU remains applicable despite the 2026 review`|The input did not match the regular expression /MiCA in force \/ applicable/. Input: 'European Union MiCA applies European Union (2023) Distinguishes e-money tokens (EMTs) from asset-referenced tokens (ARTs). EMT and ART issuers require the authorisation appli（894-complete.tap:3213）|监管状态/日期/来源覆盖与保留核验快照不一致；影响事实可信度，发布前须复核与整合。|
|`UK final rules are published, not pending; full commencement is 25 October 2027`|The input was expected to not match the regular expression /final rules pending/fully in force/already live/final code pending/i. Input: 'United Kingdom Policy set; final code pending Bank of England / FCA (2026) FCA framework for UK-issued qualifying stableco（894-complete.tap:3239）|监管状态/日期/来源覆盖与保留核验快照不一致；影响事实可信度，发布前须复核与整合。|
|`Singapore consultation dates and future dedicated regime do not convert DPT/MPI products into MAS-SCS`|The input did not match the regular expression /dedicated MAS-SCS regime not yet in force/. Input: 'Singapore Framework finalised MAS (2023) Regional development Singapore-issued single-currency stablecoins pegged to SGD or a G10 currency. Banks and nonbank is（894-complete.tap:3265）|监管状态/日期/来源覆盖与保留核验快照不一致；影响事实可信度，发布前须复核与整合。|
|`HK register names, licence numbers and effective dates do not imply product launch`|The input did not match the regular expression /Anchorpoint Financial Limited/. Input: 'Hong Kong Issuer licensing in force HKMA (2025) Regional development In-scope fiat-referenced stablecoins offered in Hong Kong or issued by Hong Kong entities. Issuers must（894-complete.tap:3291）|监管状态/日期/来源覆盖与保留核验快照不一致；影响事实可信度，发布前须复核与整合。|
|`Japan keeps its statutory Electronic Payment Instrument and intermediary terminology`|The input did not match the regular expression /Electronic Payment Instrument regime in force/. Input: "Japan Electronic payment instrument regime in force Japan FSA (2023) Fiat-linked, par-redeemable stablecoins are treated as electronic payment instruments. （894-complete.tap:3317）|监管状态/日期/来源覆盖与保留核验快照不一致；影响事实可信度，发布前须复核与整合。|
|`UAE row is explicitly limited to CBUAE onshore; VARA ADGM DIFC remain separate`|The input did not match the regular expression /CBUAE onshore/. Input: ''（894-complete.tap:3343）|监管状态/日期/来源覆盖与保留核验快照不一致；影响事实可信度，发布前须复核与整合。|
|`Mainland current instrument is 银发〔2026〕42号, replacing the 2021 notice`|The input did not match the regular expression /银发〔2026〕42号/. Input: ''（894-complete.tap:3369）|监管状态/日期/来源覆盖与保留核验快照不一致；影响事实可信度，发布前须复核与整合。|
|`every expandable mobile card preserves all ten comparison fields and regional link scope`|The input did not match the regular expression /<details>/. Input: ''（894-complete.tap:3401）|监管状态/日期/来源覆盖与保留核验快照不一致；影响事实可信度，发布前须复核与整合。|
|`timeline renders exactly eleven frozen JSON events with date jurisdiction type change and citation`|Expected values to be strictly equal: 0 !== 11（894-complete.tap:3445）|监管状态/日期/来源覆盖与保留核验快照不一致；影响事实可信度，发布前须复核与整合。|
|`public English and Chinese copy is complete, dated and contains no construction or scoring language`|The input did not match the regular expression /Regulatory status last verified: 16 October 2026/. Input: " About Stablecoins Overview History Types Applications Regulatory Evolution Regulatory Status On this page On this page 01 Introduction 02 Jurisdiction c（894-complete.tap:3471）|监管状态/日期/来源覆盖与保留核验快照不一致；影响事实可信度，发布前须复核与整合。|

未通过这些检查时，不以保持已上线Friday版本为理由声明整站发布就绪。修复事实、补接内容或修订具体整合范围需下一阶段明确处理；本轮不得为了全绿擅自移植未审核的内容布局。没有删除、skip、反转这些有效断言。

## 证据

outputs/full-test-triage-2026-10-19/保存：632-before.tap、894-before.tap、632-complete.tap、894-complete.tap、完整runner events、FILE_LOAD_INVENTORY.json、CASE_COMPARISON.json、真实UI/搜索QA、截图、typecheck/build和定向日志。中间失败结果保留。最终本地commit与parent见LOCAL_COMMIT_RECEIPT.json。
