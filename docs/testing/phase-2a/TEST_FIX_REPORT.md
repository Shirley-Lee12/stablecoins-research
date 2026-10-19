# TEST FIX REPORT

## 实际修复5类缺陷

|缺陷|最小改动|验证|
|---|---|---|
|404双语/主题/返回入口|保留Card结构，使用theme tokens、t文案和真实Home/资源库链接|既有PhaseA测试+实际双语/主题浏览器|
|HTML语言属性|Provider同步zh-CN/en，不改文字、字体或布局|实际切换后读html.lang|
|作者面包屑/Adoption标签|/authors/:name返回/experts，名称安全decode，补route label|实际函数/恶意格式字符串与桌面DOM；不造作者身份关系|
|手机/账户图标可访问性|补aria-label、aria-expanded、aria-controls和aside id|实际手机展开/收起/关联DOM；属性/语义断言，className不变|
|真正挂载的全局搜索|Layout原样式div→form，Enter导航编码query；资源库useSearch消费初始/同页q|测试改为实际Layout函数；真实中文/保留字符/同页更新与390 query导入|

全局CSS、NAV_ITEMS、顶部二级导航、智能体页面/图形/数据与来源不变。浏览器截图对照及源码契约证明没有重构正式UI；404本身原有可访问性缺陷的主题/文案修正为明确功能修复。

## STALE_ASSERTIONS_UPDATED 的计数口径

为避免把循环展开的14项SVG断言与一行expect替换混为一谈，本报告按**18组可审核契约**计数，不声称是18行assert()。每组均以用户已批准632视觉/导航、保留原知识及有效安全约束为依据。未删测试文件、未skip、未放宽资源隔离或权限。

|组|更新内容|
|---|---|
|S01 About route bindings|wrapper导出字符串→实际default组件/路由；保留frozen十页顺序|
|S02 About sidebar scope|独立监管sidebar→批准的About入口+监管顶栏|
|S03 About top navigation|冻结五项与正式六项分别验证|
|S04 Asia compatibility route wiring|redirect字符串/函数总数→同组件路由与五公开导出|
|S05 Asia Chinese QA baseline|保留旧c8 hash；正式Friday中文另按632原文保护|
|S06 Framework nav label|保留632正式Quantitative Indicators命名|
|S07 Phase C renderer scope|14原断言明确归档，另验实际D01|
|S08 Home legacy claim detection|允许有明确future/否定限定的研究方向，不误报为运行产品|
|S09 Home identity/mapping scope|实际批准摘要措辞；研究页分别渲染两个真实tab状态|
|S10 Home current/future containers|旧data属性→正式可见章节ID与状态文字|
|S11 Home navigation figure|已退役首页图容器→正式栏目入口，原SVG安全检查保留|
|S12 Research section anchors|旧10版式section→632的6锚点；滚动委托实际ContentEdgeNav|
|S13 Home entry locations|原独立卡片要求→批准首页入口与全局主导航|
|S14 Research baseline audit|忽略目录里的本机scope文件→可重现Git对象及原映射deepEqual|
|S15 Regulatory international section|旧id/标题/连字符→实际批准章节，FSB/FATF/CPMI-IOSCO及非国内法边界保留|
|S16 Regulatory desktop contract|旧2248px表格实现→632已批准源保护；有效事实/字段断言继续失败|
|S17 Regulatory actual-row selectors|从真实table提取现有行，不因data属性缺失返回伪造内容|
|S18 Canonical visual preservation|禁止所有字节变化→完整className/NAV及CSS不变，允许本轮功能属性修复|

## 测试环境修复

共享TSX loader仅把Vite env宏转为明确的本地空API base，并递归解析真实本地依赖；实际React状态/memo保持。SSR UI primitives透明以扫描弹窗内容；effects在SSR不执行，未产生或伪造API返回。监管实际table selector替换失效data属性后，原实质日期/状态断言仍全部存在；剩余错误可定位到真实文本，而非空字符串。

历史audit report从原始本机输出原字节迁入fixtures，SHA256锁定；未将它当当前生产计数。ignored scope-before依赖改为可复现Git对象；原冻结概念映射deepEqual仍保留。pnpm不重装共享依赖；实际构建全部执行。没有修改审核权限、数据库或批准状态。

## 验证与限制

- Full Suite：**211/232 PASS，21 FAIL，0skip**；16/16文件加载。
- Typecheck：PASS；Build：PASS（有已存在的大bundle及隔离symlink sourcemap警告，最终各包Done，不是静默忽略构建失败）。
- Agentic Targeted：51/51 PASS；Production UI unit：26/26 PASS。
- Production UI浏览器：8/8；搜索8/8；智能体概览/AP2桌面和390截图4组像素一致；1660 Header截图亦逐像素一致，共5/5。
- 新回归0；剩余21条按有效内容整合要求保留，不篡改测试制造全绿。治理PGlite真实HTTP/持久化/回滚全部执行；没有生产DML。

浏览器中间两次定位错误（标题/标签搜索框、全局Header/Hero header）均保存原始失败结果后定向修正选择器，最终8/8完整重跑；未过滤console或伪造API返回。

本轮测试没有证明今天生产监管事实已经更新、没有证明研究者身份已整合，也没有证明未实施的内容模块发布就绪。**READY_FOR_RELEASE=NO**。

```text
ALL_TEST_FILES_LOADED = YES
REAL_DEFECTS_FIXED = 5
STALE_ASSERTIONS_UPDATED = 18 (contract groups)
REMAINING_FAILURES = 21
FULL_TESTS = 211/232 (FAIL)
NEW_REGRESSIONS = 0
READY_FOR_RELEASE = NO
PUSHED = NO
MAIN_UPDATED = NO
RENDER_DEPLOYED = NO
PRODUCTION_DML = 0
```

本地增量commit的SHA/parent及clean状态保存于outputs/full-test-triage-2026-10-19/LOCAL_COMMIT_RECEIPT.json。完成后停止，等待用户确认；未上传分支或操作Render。
