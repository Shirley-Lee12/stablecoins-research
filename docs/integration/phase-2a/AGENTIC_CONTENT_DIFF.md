# 智能体支付内容整合差异

## 来源与范围

基线为线上632a7e3，而不是542旧站或c8的未批准布局。c8内容作为截至2026-10-15的保留证据，未冒称2026-10-19重新逐链接核查。Friday原数据截至2026-10-14；两者日期同时显示。

|正式路由|632内容与交互保留|本轮新增/协调|边界|
|---|---|---|---|
|/agentic-payments|原Hero、三任务探索、逐笔/预授权按钮、稳定币三例、近期发展、栏目入口|D01五层概念栈、身份与授权、三资金控制模型、轨道/资产边界、八类风险|图默认可见；9个研究层对应5组；不造市场统计或统一报文规范|
|/agentic-payments/protocols|关键词搜索、功能筛选、2–3个协议可选比较、原卡片布局|6→8个协议/框架，补MPP和ACT，规范分类与成熟度|比较只在协议集合可选，不把全站改成比较工具；A402不列独立协议|
|/agentic-payments/protocols/:id|六旧协议的任务/控制/流程/历史/角色/风险/证据/引用，顶部协议nav|八详情统一日期证据段；MPP/ACT使用既有页面模板|ACT概念职责不是已验证字段线序；AMP nano结算资产UNKNOWN；APOP框架及生产验证边界|
|/agentic-payments/scenarios|购物、API与企业任务、步骤、风险问答|A402七步明确字段、Agent-to-Agent过程与结算限制|Machine Pay是产品，A402是其方法规范；付款证明≠履约|
|/agentic-payments/ecosystem|关键词搜索、历史参与角色和来源|九条V0.2机构+Visa/Mastercard合并11条；产品、支付设施、稳定币状态；20条日期事件|合作/试点/生产验证不等于开放；Meta维护者≠产品采用；JD/X不造独立协议|
|旧/protocols/:id|c8兼容入口恢复，复用同一React详情|/protocols/ap2→AP2内容|不修改全局Layout|
|/agentic-payments/protocols/a2p2|原不展示独立记录|内部redirect到协议目录|HOLD不推断规范|
|/agentic-payments/protocols/a402|不新增协议条目|内部redirect到scenarios#api-pay|不是独立开放标准|

## 字段级保留

- 六Friday协议的flow、controls、history、risks、evidence、actors数组逐字段deepEqual；resources为原ID集合的超集。原data文件保持字节不变。
- V0.2所有32来源的URL、日期、状态、原来源类型及用途一致；引用resolver使用同一合并ID空间，不按相似标题替换URL。原始资料标题可以保留原文；新增面向读者的解释为中英文。
- V0.2九卡中8条进入协议/框架详情，A402方法进入场景；所有卡片能力字段可见：人确认、委托、机器付款、身份、轨道、稳定币、成熟度。
- APOP活动/发布2026-04-02与来源出版2026-04-03分开；historical review、source publication和release record不同。
- 2026-08-24协会通知无确认来源，依旧UNKNOWN，没有生成替代链接或当生效规则。
- ACT来源PARTIAL保留；完整公开字段规范与AP2映射不足，不能由兼容概念推断能力。
- x402原Coinbase示例与后续基金会治理分别保留；不再将原稳定币路径外推为USDC-only。

## 不在本轮实施

全站研究框架/日期、资源库投影、Asia、市场API刷新与全局搜索等只登记；不改数据库或生产审核状态，不重放七条补丁，不删除原21幅SVG/ZIP/PDF。V0.2文案的版式指令不等于已批准UI，不移植其整页布局。

## 已知剩余内容风险

来源内容会随外部站点变化，本轮只整合已给定日期的证据，未声称当前现势性。Friday版本特定流程仍保留，需按对应历史版本理解。协会UNKNOWN、ACT规范不足、AMP资产未知继续明确。非智能体模块的旧版文本/作者投影/数据连接仍须后续逐项处理，完整测试亦存在基线失败，不能宣称全站整合完成。
