# 全站内容整合台账 — Phase 2A

生产 UI：`632a7e383e5dfd78ef49cead12d829fe807e1526`；核验资料：`c8a7b6024c0b966781ed3aa4918e22586cacfdd8`。Friday 视觉源码树：`64b1a774c0205dec5e0bc11cb4019ca9a8a1fc3f`，不是臆定的10月16日commit。

此表覆盖 App 所有正式路由声明（含参数路由与兼容入口）；逐项读取当前源文件、632/c8 git版本、历史恢复导出、模块引用和来源字面量。详细源文件/章节/URL/相等性见 outputs 中 ROUTE_CONTENT_INVENTORY.json。参数路径展开的浏览器用例另见 QA。只有智能体模块本轮实施；其他行是后续整合建议，**不是已核验新事实或已完成移植**。

|路由 / 当前组件|当前重要内容|c8新增内容/功能|事实差异及待核验边界|来源差异/保留|实施/功能/重复与图形机会|
|---|---|---|---|---|---|
|`/` · `pages/home-overview.tsx`|平台入口、研究简介、稳定币/市场/资源导航|home-research-v02：已完成成果/未来方向、会议节目表与下载版本|已恢复安全文案，但仍非完整V0.2研究投影；逐项核验后移植|home-research-v02 + 匿名PDF字节；Friday入口保留|P1 仅登记：沿用首页结构，移植准确日期和成果入口；不改首页UI|
|`/dashboard` · `pages/dashboard.tsx`|供应量/占比/历史、价格与流动性、11宏观序列、储备及采用说明|market-data-v02：数据目录、方法/覆盖/未知状态、新API适配|Friday 50个美元目标项目不是全市场；USDT深度不是USD；缺失不得补0；Artemis retired|Friday Oct18/19快照 vs 当前后端实时响应/新版模型，时间与schema不可混用|P1 仅登记：接生产API前做版本适配；保留日期/单位/空值；趋势和覆盖提示候选|
|`/about-stablecoins` · `pages/about.tsx`|定义、发行赎回套利、五机制、历史、应用、监管演变、机制金额|about-stablecoins-v02：十页模块、九图、来源清单与边界|五机制界面与V0.2九图/十页内容组织不同；分类口径和历史失败案例须逐条比对|Friday机制说明/应用数据 vs V0.2 frozen manifest；金额来自带日期快照|P1 仅登记：保留顶部栏目，按模块移植知识/来源；机制流程、反馈环、时间轴候选|
|`/research` · `pages/research.tsx`|会议风险框架代表性实例、研究方法、匿名稿、未来量化计划|conference-risk/home-research：三会议框架页、节目表、55原子风险的公开边界|不得公开重建完整55项或称已完成模型；632已做最低文字修正，缺V0.2完整投影|会议框架数据/匿名PDF已保留，学位论文原始资料不等于网站成果|P1 仅登记：保持页面结构，整合研究事实/证据；生命周期和放大路径候选|
|`/academic-resources` · `pages/academic-resources.tsx`|旧资源库搜索/筛选/贡献、专家作者聚合和出版物入口|public-directory、verified researcher projection、确定性元数据/作者纠正|作者同名不得推断身份；legacy聚合不是已核验研究者；pending不可公开|生产7条已修正；新API/数据不回退，旧前端待接入新公共投影|P1 仅登记：旧UI接新API，保持检索/过滤/来源/unknown和账户审核隔离|
|`/experts` · `pages/experts.tsx`|旧资源库搜索/筛选/贡献、专家作者聚合和出版物入口|public-directory、verified researcher projection、确定性元数据/作者纠正|作者同名不得推断身份；legacy聚合不是已核验研究者；pending不可公开|生产7条已修正；新API/数据不回退，旧前端待接入新公共投影|P1 仅登记：旧UI接新API，保持检索/过滤/来源/unknown和账户审核隔离|
|`/authors/:name` · `pages/author.tsx`|旧资源库搜索/筛选/贡献、专家作者聚合和出版物入口|public-directory、verified researcher projection、确定性元数据/作者纠正|作者同名不得推断身份；legacy聚合不是已核验研究者；pending不可公开|生产7条已修正；新API/数据不回退，旧前端待接入新公共投影|P1 仅登记：旧UI接新API，保持检索/过滤/来源/unknown和账户审核隔离|
|`/regulatory` · `pages/regulatory.tsx`|辖区规则表、监管状态与访问入口|regulatory-v02：日期、状态类型、规则来源和适用边界|咨询≠生效；法律状态必须按日期与辖区核验，不能以新版覆盖旧版|旧页链接与冻结规则来源不同；需要逐条记录canonical来源|P1 仅登记：规则结构/时间轴，保留独立入口，不合并到比较工具|
|`/market-data` · `pages/market-data.tsx`|供应量/占比/历史、价格与流动性、11宏观序列、储备及采用说明|market-data-v02：数据目录、方法/覆盖/未知状态、新API适配|Friday 50个美元目标项目不是全市场；USDT深度不是USD；缺失不得补0；Artemis retired|Friday Oct18/19快照 vs 当前后端实时响应/新版模型，时间与schema不可混用|P1 仅登记：接生产API前做版本适配；保留日期/单位/空值；趋势和覆盖提示候选|
|`/quantitative` · `pages/quantitative.tsx`|会议风险框架代表性实例、研究方法、匿名稿、未来量化计划|conference-risk/home-research：三会议框架页、节目表、55原子风险的公开边界|不得公开重建完整55项或称已完成模型；632已做最低文字修正，缺V0.2完整投影|会议框架数据/匿名PDF已保留，学位论文原始资料不等于网站成果|P1 仅登记：保持页面结构，整合研究事实/证据；生命周期和放大路径候选|
|`/mainland-china` · `pages/asia-development.tsx`|亚洲总览/辖区叙事、角色、时间线与来源|asia-development-v02：五页模块、十事件、政策/产品/试点类型|Friday条目与V0.2日期分类有差异；合作、试点、公开能力须分开，逐项核验|friday-asia-developments vs asia-developments/generated；原图和证据均保留|P1 仅登记：保留URL及视觉，按证据标签整合；时间线/辖区结构候选|
|`/hong-kong` · `pages/asia-development.tsx`|亚洲总览/辖区叙事、角色、时间线与来源|asia-development-v02：五页模块、十事件、政策/产品/试点类型|Friday条目与V0.2日期分类有差异；合作、试点、公开能力须分开，逐项核验|friday-asia-developments vs asia-developments/generated；原图和证据均保留|P1 仅登记：保留URL及视觉，按证据标签整合；时间线/辖区结构候选|
|`/singapore` · `pages/asia-development.tsx`|亚洲总览/辖区叙事、角色、时间线与来源|asia-development-v02：五页模块、十事件、政策/产品/试点类型|Friday条目与V0.2日期分类有差异；合作、试点、公开能力须分开，逐项核验|friday-asia-developments vs asia-developments/generated；原图和证据均保留|P1 仅登记：保留URL及视觉，按证据标签整合；时间线/辖区结构候选|
|`/uae` · `pages/asia-development.tsx`|亚洲总览/辖区叙事、角色、时间线与来源|asia-development-v02：五页模块、十事件、政策/产品/试点类型|Friday条目与V0.2日期分类有差异；合作、试点、公开能力须分开，逐项核验|friday-asia-developments vs asia-developments/generated；原图和证据均保留|P1 仅登记：保留URL及视觉，按证据标签整合；时间线/辖区结构候选|
|`/regional-developments` · `pages/asia-development.tsx`|亚洲总览/辖区叙事、角色、时间线与来源|asia-development-v02：五页模块、十事件、政策/产品/试点类型|Friday条目与V0.2日期分类有差异；合作、试点、公开能力须分开，逐项核验|friday-asia-developments vs asia-developments/generated；原图和证据均保留|P1 仅登记：保留URL及视觉，按证据标签整合；时间线/辖区结构候选|
|`/regional-developments/mainland-china` · `pages/asia-development.tsx`|亚洲总览/辖区叙事、角色、时间线与来源|asia-development-v02：五页模块、十事件、政策/产品/试点类型|Friday条目与V0.2日期分类有差异；合作、试点、公开能力须分开，逐项核验|friday-asia-developments vs asia-developments/generated；原图和证据均保留|P1 仅登记：保留URL及视觉，按证据标签整合；时间线/辖区结构候选|
|`/regional-developments/hong-kong` · `pages/asia-development.tsx`|亚洲总览/辖区叙事、角色、时间线与来源|asia-development-v02：五页模块、十事件、政策/产品/试点类型|Friday条目与V0.2日期分类有差异；合作、试点、公开能力须分开，逐项核验|friday-asia-developments vs asia-developments/generated；原图和证据均保留|P1 仅登记：保留URL及视觉，按证据标签整合；时间线/辖区结构候选|
|`/regional-developments/singapore` · `pages/asia-development.tsx`|亚洲总览/辖区叙事、角色、时间线与来源|asia-development-v02：五页模块、十事件、政策/产品/试点类型|Friday条目与V0.2日期分类有差异；合作、试点、公开能力须分开，逐项核验|friday-asia-developments vs asia-developments/generated；原图和证据均保留|P1 仅登记：保留URL及视觉，按证据标签整合；时间线/辖区结构候选|
|`/regional-developments/uae` · `pages/asia-development.tsx`|亚洲总览/辖区叙事、角色、时间线与来源|asia-development-v02：五页模块、十事件、政策/产品/试点类型|Friday条目与V0.2日期分类有差异；合作、试点、公开能力须分开，逐项核验|friday-asia-developments vs asia-developments/generated；原图和证据均保留|P1 仅登记：保留URL及视觉，按证据标签整合；时间线/辖区结构候选|
|`/agentic-payments` · `pages/agentic-payments.tsx`|任务、授权、资金路径、六协议、三任务、生态与来源|八协议、A402 方法、32来源、20事件、证据分类与UNKNOWN|APOP框架/验证≠全面开放；x402起源≠当前治理；ACP发起≠维护|两套来源保留，按来源ID及日期区分|P0 本轮实施：保留任务交互/筛选/比较/顶部导航，补协议及边界；D01紧凑栈，其他图待办|
|`/agentic-payments/protocols` · `pages/agentic-payments.tsx`|任务、授权、资金路径、六协议、三任务、生态与来源|八协议、A402 方法、32来源、20事件、证据分类与UNKNOWN|APOP框架/验证≠全面开放；x402起源≠当前治理；ACP发起≠维护|两套来源保留，按来源ID及日期区分|P0 本轮实施：保留任务交互/筛选/比较/顶部导航，补协议及边界；D01紧凑栈，其他图待办|
|`/agentic-payments/protocols/:id` · `pages/agentic-payments.tsx`|任务、授权、资金路径、六协议、三任务、生态与来源|八协议、A402 方法、32来源、20事件、证据分类与UNKNOWN|APOP框架/验证≠全面开放；x402起源≠当前治理；ACP发起≠维护|两套来源保留，按来源ID及日期区分|P0 本轮实施：保留任务交互/筛选/比较/顶部导航，补协议及边界；D01紧凑栈，其他图待办|
|`/protocols/:id` · `pages/agentic-payments.tsx`|任务、授权、资金路径、六协议、三任务、生态与来源|八协议、A402 方法、32来源、20事件、证据分类与UNKNOWN|APOP框架/验证≠全面开放；x402起源≠当前治理；ACP发起≠维护|两套来源保留，按来源ID及日期区分|P0 本轮实施：保留任务交互/筛选/比较/顶部导航，补协议及边界；D01紧凑栈，其他图待办|
|`/agentic-payments/scenarios` · `pages/agentic-payments.tsx`|任务、授权、资金路径、六协议、三任务、生态与来源|八协议、A402 方法、32来源、20事件、证据分类与UNKNOWN|APOP框架/验证≠全面开放；x402起源≠当前治理；ACP发起≠维护|两套来源保留，按来源ID及日期区分|P0 本轮实施：保留任务交互/筛选/比较/顶部导航，补协议及边界；D01紧凑栈，其他图待办|
|`/agentic-payments/ecosystem` · `pages/agentic-payments.tsx`|任务、授权、资金路径、六协议、三任务、生态与来源|八协议、A402 方法、32来源、20事件、证据分类与UNKNOWN|APOP框架/验证≠全面开放；x402起源≠当前治理；ACP发起≠维护|两套来源保留，按来源ID及日期区分|P0 本轮实施：保留任务交互/筛选/比较/顶部导航，补协议及边界；D01紧凑栈，其他图待办|
|`/reset-password` · `pages/reset-password.tsx`|账户/认证/贡献/管理员/连接器现有工作流与错误状态|c8保留的后端兼容、审核持久化、权限治理与辅助功能|UI文本或可访问性有旧版差异；安全语义/parse-confirm-persist不得改变|后端/数据库/schema/治理不动；只读本地fixture不证明全部生产账户流程|P2 本轮不移植：仅只读路由检查，不提交表单，不修改审核或用户状态|
|`/verify-email` · `pages/verify-email.tsx`|账户/认证/贡献/管理员/连接器现有工作流与错误状态|c8保留的后端兼容、审核持久化、权限治理与辅助功能|UI文本或可访问性有旧版差异；安全语义/parse-confirm-persist不得改变|后端/数据库/schema/治理不动；只读本地fixture不证明全部生产账户流程|P2 本轮不移植：仅只读路由检查，不提交表单，不修改审核或用户状态|
|`/admin` · `pages/admin-center.tsx`|账户/认证/贡献/管理员/连接器现有工作流与错误状态|c8保留的后端兼容、审核持久化、权限治理与辅助功能|UI文本或可访问性有旧版差异；安全语义/parse-confirm-persist不得改变|后端/数据库/schema/治理不动；只读本地fixture不证明全部生产账户流程|P2 本轮不移植：仅只读路由检查，不提交表单，不修改审核或用户状态|
|`/connector/authorize` · `pages/connector.tsx`|账户/认证/贡献/管理员/连接器现有工作流与错误状态|c8保留的后端兼容、审核持久化、权限治理与辅助功能|UI文本或可访问性有旧版差异；安全语义/parse-confirm-persist不得改变|后端/数据库/schema/治理不动；只读本地fixture不证明全部生产账户流程|P2 本轮不移植：仅只读路由检查，不提交表单，不修改审核或用户状态|
|`/connector` · `pages/connector.tsx`|账户/认证/贡献/管理员/连接器现有工作流与错误状态|c8保留的后端兼容、审核持久化、权限治理与辅助功能|UI文本或可访问性有旧版差异；安全语义/parse-confirm-persist不得改变|后端/数据库/schema/治理不动；只读本地fixture不证明全部生产账户流程|P2 本轮不移植：仅只读路由检查，不提交表单，不修改审核或用户状态|
|`/about-stablecoins/history` · `pages/about-history.tsx`|定义、发行赎回套利、五机制、历史、应用、监管演变、机制金额|about-stablecoins-v02：十页模块、九图、来源清单与边界|五机制界面与V0.2九图/十页内容组织不同；分类口径和历史失败案例须逐条比对|Friday机制说明/应用数据 vs V0.2 frozen manifest；金额来自带日期快照|P1 仅登记：保留顶部栏目，按模块移植知识/来源；机制流程、反馈环、时间轴候选|
|`/about-stablecoins/types/:mechanism` · `pages/stablecoin-mechanism.tsx`|定义、发行赎回套利、五机制、历史、应用、监管演变、机制金额|about-stablecoins-v02：十页模块、九图、来源清单与边界|五机制界面与V0.2九图/十页内容组织不同；分类口径和历史失败案例须逐条比对|Friday机制说明/应用数据 vs V0.2 frozen manifest；金额来自带日期快照|P1 仅登记：保留顶部栏目，按模块移植知识/来源；机制流程、反馈环、时间轴候选|
|`/about-stablecoins/types` · `pages/about-types.tsx`|定义、发行赎回套利、五机制、历史、应用、监管演变、机制金额|about-stablecoins-v02：十页模块、九图、来源清单与边界|五机制界面与V0.2九图/十页内容组织不同；分类口径和历史失败案例须逐条比对|Friday机制说明/应用数据 vs V0.2 frozen manifest；金额来自带日期快照|P1 仅登记：保留顶部栏目，按模块移植知识/来源；机制流程、反馈环、时间轴候选|
|`/about-stablecoins/applications` · `pages/about-applications.tsx`|定义、发行赎回套利、五机制、历史、应用、监管演变、机制金额|about-stablecoins-v02：十页模块、九图、来源清单与边界|五机制界面与V0.2九图/十页内容组织不同；分类口径和历史失败案例须逐条比对|Friday机制说明/应用数据 vs V0.2 frozen manifest；金额来自带日期快照|P1 仅登记：保留顶部栏目，按模块移植知识/来源；机制流程、反馈环、时间轴候选|
|`/about-stablecoins/regulatory-evolution` · `pages/about-regulatory-evolution.tsx`|定义、发行赎回套利、五机制、历史、应用、监管演变、机制金额|about-stablecoins-v02：十页模块、九图、来源清单与边界|五机制界面与V0.2九图/十页内容组织不同；分类口径和历史失败案例须逐条比对|Friday机制说明/应用数据 vs V0.2 frozen manifest；金额来自带日期快照|P1 仅登记：保留顶部栏目，按模块移植知识/来源；机制流程、反馈环、时间轴候选|
|`/quantitative/dimension-a` · `pages/placeholder.tsx`|会议风险框架代表性实例、研究方法、匿名稿、未来量化计划|conference-risk/home-research：三会议框架页、节目表、55原子风险的公开边界|不得公开重建完整55项或称已完成模型；632已做最低文字修正，缺V0.2完整投影|会议框架数据/匿名PDF已保留，学位论文原始资料不等于网站成果|P1 仅登记：保持页面结构，整合研究事实/证据；生命周期和放大路径候选|
|`/quantitative/dimension-b` · `pages/placeholder.tsx`|会议风险框架代表性实例、研究方法、匿名稿、未来量化计划|conference-risk/home-research：三会议框架页、节目表、55原子风险的公开边界|不得公开重建完整55项或称已完成模型；632已做最低文字修正，缺V0.2完整投影|会议框架数据/匿名PDF已保留，学位论文原始资料不等于网站成果|P1 仅登记：保持页面结构，整合研究事实/证据；生命周期和放大路径候选|
|`/market-data/market` · `pages/market-structure.tsx`|供应量/占比/历史、价格与流动性、11宏观序列、储备及采用说明|market-data-v02：数据目录、方法/覆盖/未知状态、新API适配|Friday 50个美元目标项目不是全市场；USDT深度不是USD；缺失不得补0；Artemis retired|Friday Oct18/19快照 vs 当前后端实时响应/新版模型，时间与schema不可混用|P1 仅登记：接生产API前做版本适配；保留日期/单位/空值；趋势和覆盖提示候选|
|`/market-data/on-chain` · `pages/market-data-sections.tsx`|供应量/占比/历史、价格与流动性、11宏观序列、储备及采用说明|market-data-v02：数据目录、方法/覆盖/未知状态、新API适配|Friday 50个美元目标项目不是全市场；USDT深度不是USD；缺失不得补0；Artemis retired|Friday Oct18/19快照 vs 当前后端实时响应/新版模型，时间与schema不可混用|P1 仅登记：接生产API前做版本适配；保留日期/单位/空值；趋势和覆盖提示候选|
|`/market-data/issuers-reserves` · `pages/market-data-sections.tsx`|供应量/占比/历史、价格与流动性、11宏观序列、储备及采用说明|market-data-v02：数据目录、方法/覆盖/未知状态、新API适配|Friday 50个美元目标项目不是全市场；USDT深度不是USD；缺失不得补0；Artemis retired|Friday Oct18/19快照 vs 当前后端实时响应/新版模型，时间与schema不可混用|P1 仅登记：接生产API前做版本适配；保留日期/单位/空值；趋势和覆盖提示候选|
|`/market-data/macro` · `pages/market-data-sections.tsx`|供应量/占比/历史、价格与流动性、11宏观序列、储备及采用说明|market-data-v02：数据目录、方法/覆盖/未知状态、新API适配|Friday 50个美元目标项目不是全市场；USDT深度不是USD；缺失不得补0；Artemis retired|Friday Oct18/19快照 vs 当前后端实时响应/新版模型，时间与schema不可混用|P1 仅登记：接生产API前做版本适配；保留日期/单位/空值；趋势和覆盖提示候选|
|`/market-data/adoption` · `pages/market-data-sections.tsx`|供应量/占比/历史、价格与流动性、11宏观序列、储备及采用说明|market-data-v02：数据目录、方法/覆盖/未知状态、新API适配|Friday 50个美元目标项目不是全市场；USDT深度不是USD；缺失不得补0；Artemis retired|Friday Oct18/19快照 vs 当前后端实时响应/新版模型，时间与schema不可混用|P1 仅登记：接生产API前做版本适配；保留日期/单位/空值；趋势和覆盖提示候选|
|`/profile` · `pages/profile.tsx`|账户/认证/贡献/管理员/连接器现有工作流与错误状态|c8保留的后端兼容、审核持久化、权限治理与辅助功能|UI文本或可访问性有旧版差异；安全语义/parse-confirm-persist不得改变|后端/数据库/schema/治理不动；只读本地fixture不证明全部生产账户流程|P2 本轮不移植：仅只读路由检查，不提交表单，不修改审核或用户状态|
|`/change-password` · `pages/change-password.tsx`|账户/认证/贡献/管理员/连接器现有工作流与错误状态|c8保留的后端兼容、审核持久化、权限治理与辅助功能|UI文本或可访问性有旧版差异；安全语义/parse-confirm-persist不得改变|后端/数据库/schema/治理不动；只读本地fixture不证明全部生产账户流程|P2 本轮不移植：仅只读路由检查，不提交表单，不修改审核或用户状态|
|`/my-contributions` · `pages/my-contributions.tsx`|账户/认证/贡献/管理员/连接器现有工作流与错误状态|c8保留的后端兼容、审核持久化、权限治理与辅助功能|UI文本或可访问性有旧版差异；安全语义/parse-confirm-persist不得改变|后端/数据库/schema/治理不动；只读本地fixture不证明全部生产账户流程|P2 本轮不移植：仅只读路由检查，不提交表单，不修改审核或用户状态|

## 三套智能体来源的明确分工

- `friday-agentic-payments.ts`：六个原协议的任务、控制、流程、历史、角色、风险和引用；仍有独立证据价值，原文件不修改。
- `agentic-payments.ts`：V0.2 JSON 的访问、分类翻译、段落提取、来源映射；不是另一套人工事实。
- `agentic-payments-v02.generated.json`：九条卡片（八协议/框架 + A402方法）、九机构、20事件、32来源、双语稿、六幅原SVG；冻结保留。
- 新 `agentic-payments-reconciled.ts`：唯一正式 Agentic 展示入口。保留六协议全部研究数组，新增MPP/ACT，合并生态为11条（九机构+Visa/Mastercard），统一来源解析。页面和citation不再分别读取不同source ID空间。

## 明示的差异裁决

|事项|Friday|V0.2|处理|
|---|---|---|---|
|APOP|网络框架/受邀接入、历史流程|PROTOCOL_FRAMEWORK；五笔生产验证|框架分类，验证≠全面开放；原历史与证据保留|
|APOP日期|事件日2026-04-02|来源发布日期2026-04-03|两日期并列，绝不互换|
|x402|Coinbase发起/原稳定币示例|基金会治理、扩大支付范围|起源与治理分开，旧示例不外推全部网络/资产|
|ACP Meta|主要维护者名单|OpenAI/Stripe发起及产品|发起与维护分开；不由维护名单推断产品采用|
|ACT|缺失|存在，但字段级公开证据不足|补页；概念职责不冒充报文流程，PARTIAL来源保留状态|
|MPP|缺失|机器付款、支持方式依实现|补页；官方案例不是独立采用统计|
|A402 / A2P2|A2P2先前已隔离|方法规范 / HOLD|A402场景段；A2P2重定向，不捏造规范|
|日期覆盖|资料核查2026-10-14|证据快照2026-10-15|分别标注，不冒称今日复核；未核实协会通知仍UNKNOWN|
|D01脚本|无|概念9层，ACT/AVOP placement措辞与卡片并不完全一致|使用卡片已支持的角色映射；不添加AVOP字段/互操作结论；概念分层≠统一线序|

## 市场资料不能自动合并

当前市场/宏观/流动性是有采集日期的恢复快照。depegs/onchain无经核验快照时为unavailable；不能借前端整合补造观测。V0.2后端模型和数据目录保留，但不得把全市场总量、50个可分类美元目标项目分母、USDT报价深度、gross transfer activity互相替换。Artemis retired方法不可当连续实时数据源。本轮这些页面、数据文件和API全不修改。

## 内容覆盖的限度

六个Friday协议原有研究数组及引用保留率100%（测试逐字段deepEqual），所有32个V0.2来源URL/日期/状态和冻结原始资料保留100%；八协议的关键新增知识进入正式路由。全站其他模块尚未移植，不声称全站内容已整合完成，也不以设计文案替代原研究稿。
