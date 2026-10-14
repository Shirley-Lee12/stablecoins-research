# 31｜AIF 机构表述与全站标识调整审查

> 审查日期：2026-10-14。
> 项目：`/Users/shirleylee/Downloads/Stablecoin-Lifecycle`，原始网站。
> 本轮结果：已完成机构表述审查和网站代码调整；发布进度见第七节。数据库原始内容和邮件服务账号资料未改动。

## 一、老师的意图与建议口径

根据用户转述，老师希望通过自己所属的浙江大学金融科技研究院（AIF）推动网站公开部署，减少通过 ZIBS 申请时的流程负担。网站保持稳定币学术研究平台的定位，机构支持表述从 ZIBS 转向 AIF。

需要同时处理三个不同层面的信息：

1. **平台品牌与机构支持**：首页、导航、弹窗等当前把平台命名为 ZIBS 研究中心，并称其由 ZIBS 主办，应统一调整。
2. **人员真实身份**：老师的展示机构可以按本次指示突出 AIF；成员实际就读 ZIBS 的 iMF/MBA 身份仍应准确表达。平台支持单位改变，不会自动改变成员学籍或已发表论文署名。
3. **部署申请与运行环境**：未来域名申请、维护交接走 AIF 路线；当前 Render 技术托管可以继续。`Sponsored by` 表达支持关系，不直接说明服务器位置或版权归属。

### 建议统一文案

| 使用位置 | 中文建议 | 英文建议 |
| --- | --- | --- |
| 平台名称 | 稳定币学术研究平台 | Stablecoin Research Hub |
| 学术属性短标签 | 学术研究 | Academic Research |
| 支持单位首次完整展示 | 由浙江大学金融科技研究院（AIF）支持 | Sponsored by the Academy of Internet Finance (AIF), Zhejiang University. |
| 窄屏或重复展示 | 浙江大学 AIF | Zhejiang University · AIF |
| 网站版权署名 | © 当年 稳定币学术研究平台 | © Current year Stablecoin Research Hub |
| 资源维护团队 | 稳定币研究团队 | the stablecoin research team |
| 插件名称 | 稳定币研究采集工具 | Stablecoin Research Connector |

这里的 `Academic` 修饰平台的学术定位，不作为 AIF 名称的一部分。若希望把它直接写入英文标题，可选择 `Stablecoin Academic Research Hub`；建议先使用已有的 `Stablecoin Research Hub`，配独立的 `Academic Research` 标签。

不自动将平台命名为“AIF 稳定币研究院/研究中心”，以免把网站项目名表达成新设的机构名称。也不因支持单位变化就把版权全部署名为 AIF。

### 首页简介建议

英文：

> An academic research platform exploring the economics, technology, regulation, and global impact of stablecoins. Sponsored by the Academy of Internet Finance (AIF), Zhejiang University.

中文：

> 聚焦稳定币的经济、技术、监管与全球影响，提供研究成果、学术资源与市场数据。由浙江大学金融科技研究院（AIF）支持。

沿用老师提出的 `Sponsored by`，中文采用“支持”。如老师希望特指学术支持，可进一步使用 `Academically supported by` / “学术支持”；实施时统一选择一个口径。

### 官方名称核对

- 中文：浙江大学金融科技研究院（AIF）。
- 英文：Academy of Internet Finance，浙江大学官方英文介绍也使用 Academy of Internet Finance, Zhejiang University (AIF)。
- 官方中文介绍：[ZIBS 科研平台](https://zibs.zju.edu.cn/81784/list.htm)，列明其中文名、英文名及旧称。
- 官方英文介绍：[浙江大学人文社科研究院 Research Academy](https://rwsk.zju.edu.cn/rwsken/30504/list.htm)，本轮搜索结果可核对英文名称，直接页面抓取超时。
- 上述官方页面指向的 AIF 网站为 `https://www.aif.zju.edu.cn/`。本轮直接访问超时，未核实可用的教师个人主页和具体联系地址。实施时不能凭旧 ZIBS 信息推定 AIF 地址。

## 二、网站界面修改定位

以下行号以本轮本地源码为准。修改后行号可能变化。

| 区域／入口 | 当前信息 | 定位 | 建议处理 |
| --- | --- | --- | --- |
| 所有页面的左上品牌 | `ZIBS Stablecoins` / `浙大ZIBS稳定币`，第二行 `Research Hub` / `研究中心` | `artifacts/stablecoin-hub/src/components/layout.tsx:541,544` | 两行组合改成稳定币学术研究平台品牌；支持单位可另置简短 AIF 标签，避免全称挤压导航。 |
| 桌面侧栏折叠状态 | 单字母 `Z` | `artifacts/stablecoin-hub/src/components/layout.tsx:548` 附近 | 折叠品牌与新平台名称保持一致，可用 `S` 或现有中性研究图标；不必理解为 ZIBS 专用字母。 |
| 侧栏最底部 | `© 当年 ZJU ZIBS` / `© 当年 浙大ZIBS` | `artifacts/stablecoin-hub/src/components/layout.tsx:587,588` | 使用平台署名，机构支持关系另列。 |
| 移动端展开菜单 | 复用上述品牌和侧栏底部 | 同一个 `layout.tsx` | 无第二套品牌文字，但需验证窄屏完整显示。 |
| 首页 `/` 顶部机构标识 | `Zhejiang University · ZIBS · FinTech Research` / `浙江大学 · 国际联合商学院 · 金融科技研究` | `artifacts/stablecoin-hub/src/pages/home-overview.tsx:80` | 改为浙江大学 AIF 与学术研究标签。 |
| 首页主标题 | `ZIBS Stablecoins Research Hub` / `浙大ZIBS稳定币研究中心` | `home-overview.tsx:83` | 使用统一平台名称。 |
| 首页简介 | `hosted by the Zhejiang University International Business School (ZIBS)`；中文为 ZIBS“主办” | `home-overview.tsx:87,88` | 改为 AIF `Sponsored by` / “支持”；前后两种语言同步。 |
| 首页导师信息 | 张瑞东教授下方显示 ZIBS 全称 | `home-overview.tsx:192` | 按老师此次指示展示浙江大学金融科技研究院（AIF）；保留姓名与课题指导角色，不补写未核实职务。 |
| 首页导师外链 | 教师主页跳到 ZIBS 教师介绍 | `home-overview.tsx:193` | 优先核对 AIF 教师介绍或浙大个人主页；如暂时只有原链接可用，可保留作为个人履历来源，不能把它标成 AIF 官网。 |
| 首页成员身份 | 四位成员的 `ZIBS · iMF` / `ZIBS · MBA` | `home-overview.tsx:55–58` | 保留真实学籍，必要时明确标签为“学位项目”。不直接改成 AIF 任职／学籍。 |
| 首页底部机构名 | ZIBS 中英文全称 | `home-overview.tsx:242` | 改为完整 AIF 支持单位表述，可链接已核实的官方入口。 |
| 首页底部地址与网址 | `Haining, Zhejiang, China · intl.zju.edu.cn/zibs` | `home-overview.tsx:243` | 学院网址应替换；海宁地址不沿用为 AIF 地址。未核实的具体地址可先省略，避免把学院位置误作平台办公地址。 |
| 首页底部版权 | ZIBS 平台名称 | `home-overview.tsx:245` | 使用平台名称与动态年份。 |
| 登录弹窗 | `Welcome back to ZIBS Stablecoins Research Hub` | `artifacts/stablecoin-hub/src/components/auth-dialog.tsx:152` | 中英文改为统一平台名称。 |
| 注册弹窗 | `Join the ZIBS Stablecoins Research Hub` | `auth-dialog.tsx:197` | 同步平台名称。注册邮箱示例 `you@zju.edu.cn` 是示例，不是机构归属声明，可保留。 |
| 我们的研究 `/research` | `ZIBS original research` / `ZIBS原创研究` | `artifacts/stablecoin-hub/src/pages/research.tsx:206` | 建议“课题组研究 / Our research”，不把所有成果自动归属为 AIF 原创。 |
| 资源库 `/academic-resources` | 英文“由 ZIBS research team 持续维护”；中文“由浙大国际商学院稳定币课题组持续维护更新” | `artifacts/stablecoin-hub/src/pages/academic-resources.tsx:2998,2999` | 改为稳定币研究团队持续维护；机构支持统一由首页／全站品牌区说明。 |
| 量化指标 `/quantitative` 简介 | 指数与模型由 ZIBS 平台开发 | `artifacts/stablecoin-hub/src/pages/quantitative.tsx:16,17` | 更新团队／平台名称。 |
| 量化指标名称 | `ZIBS Stablecoin De-peg Risk Index` | `quantitative.tsx:32` | 优先中性名称“稳定币脱锚风险指数”，不要自动改成“AIF 官方指数”。模型完成度另行讨论。 |
| 插件页 `/connector` | `ZIBS Stablecoin Research Connector`，安装步骤中的 `ZIBS Connector` | `artifacts/stablecoin-hub/src/pages/connector.tsx:145,156` | 更新插件可见名称和安装说明。 |
| 插件授权页 `/connector/authorize` | `ZIBS Connector` | `connector.tsx:114` | 同步新名称；授权对象的动态 `clientName` 可能来自旧插件，见第四节。 |
| 浏览器标签、搜索摘要、社交摘要 | 标题已有中性名称；三处 description 仍写 `built on Replit. Update this description...` | `artifacts/stablecoin-hub/index.html:6–14` | 标题可沿用；description、OG description、Twitter description 应换为简洁学术平台简介及 AIF 支持表述。 |
| 分享预览静态图片 | `public/opengraph.jpg` 是旧首页截图，图片里嵌有 ZIBS 品牌和 hosted by ZIBS | `artifacts/stablecoin-hub/public/opengraph.jpg` | 后续重新生成／截图并替换；当前 `index.html` 未设置 `og:image` / `twitter:image` 引用，属于仓库遗留资源，不能称已在分享入口生效。 |

### 其他页面、弹窗与公共区域的检查结果

在源码中检索完整机构名、缩写、中文简称、主办和支持相关表述，并核对路由及共享 Layout 后：

- 数据仪表盘、关于稳定币及其子页、稳定币发展及四个经济体子页、监管现状、市场数据及子页，没有发现本轮需要替换的独立 ZIBS 品牌文字；它们会继承全站侧栏与底部修改。
- 市场数据“数据说明”、资源详情与上传／审核弹窗、账户资料、修改／重置密码页、邮箱验证页、消息入口与提示组件，没有发现独立的硬编码 ZIBS 品牌文案。
- 导航面包屑、横向导航、页内目录以功能／页面名为主，无需因机构调整改动路由或分类。
- `public/favicon.svg` 是中性图形，没有 ZIBS 文字；插件 `icon.svg` 为书签／文档图形，也不含 ZIBS 字样。
- 本轮结论来自本地源码和已查看的静态资源，不是逐页运行浏览器的生产验收。数据库中的动态内容、图片／PDF 内的文字及邮件服务账号资料仍需在实施时专项核对。

## 三、网页之外的用户可见信息

| 区域 | 定位／现状 | 建议 |
| --- | --- | --- |
| 邮件发件人显示名 | `artifacts/api-server/src/lib/mailer.ts:4`，`ZIBS Stablecoin Hub` | 改为统一平台名。该常量直接用于 Brevo；Microsoft Graph 发送函数没有传该常量，发件人显示名由邮箱账号资料决定，需另外核对。 |
| 注册验证码邮件主题 | `mailer.ts:133` | 替换旧 ZIBS 平台名称。 |
| 更换邮箱验证码邮件主题 | `mailer.ts:146` | 同步。 |
| 重置密码邮件主题 | `mailer.ts:165` | 同步。 |
| 资源通知／摘要邮件 | `mailer.ts:217–234` | 主题与正文基本为中性功能文字；发件人显示名称仍要核对，动态题名和摘要不能全量替换。 |
| 插件安装名称、短名、描述、图标提示 | `artifacts/browser-extension/manifest.json:3,4,7,18` | 改为研究平台对应的插件品牌。 |
| 插件侧面板文字 | `artifacts/browser-extension/src/popup.html:6,12,23` | 标题、面板品牌、连接按钮都需同步。文件名虽为 popup，当前插件用途是侧面板。 |
| 插件下载名称及发布描述 | `artifacts/browser-extension/build.mjs:10`、`public/downloads/connector-release.json:3`、`connector.tsx:14` | 新版 ZIP 名称、发布 JSON 和 fallback 要同时更新并重新打包；保留旧版本下载地址作为兼容入口。 |
| 已发布旧版插件 ZIP | `public/downloads/zibs-stablecoin-research-connector-*.zip` | 新插件品牌应通过新版本分发，单改网站介绍不会改变已安装插件的文字。 |
| 邮件授权测试文案 | `scripts/src/microsoft-mail-oauth.ts:84,87` | 下次发送测试邮件前同步平台名称；本轮不触发真实邮件。 |

## 四、应保留或单独核对的内容

### 不做机械替换

- 成员的真实 ZIBS 学籍、文献作者单位、已发表论文或官方报告里的机构署名。
- 作为文献来源的 ZIBS 官方网页链接；它们表达来源，不等于网站支持单位。
- `artifacts/api-server/src/lib/connectorAuth.ts:6` 的 `zibs_conn_` token 前缀，以及插件 `popup.js:16` 的 `__zibsConnectorCloseAfterSubmit` 内部状态键。这些是技术标识，改品牌无需修改；若将来要改，需处理旧凭据和状态兼容。
- 原有 Render 域名、数据库、API key、账户和服务 ID 不因文案变化自动迁移。

### 待核对的动态／外部信息

- `our_research` 发布内容，以及作者／机构资料、资源详情中可能存在的 ZIBS 字样：逐项确认是历史署名还是当前平台品牌后再处理。
- 旧插件配对记录里的 `clientName`：可能在授权弹窗和账号连接管理中显示旧名；应保留历史记录，新版客户端使用新名字。
- 已发表论文 PDF、研究图片里的单位信息：保持原稿真实署名；宣传型图片才重新制作。
- Brevo / Outlook 账号的显示名、发件地址：源码改名不会改变账号资料。可先调整显示名，现有邮箱地址无需仅为本次品牌调整而更换。
- AIF 官网及导师主页实际可用链接、平台联系地址、未来域名申请主体：有明确信息后再填写。

## 五、建设与部署文档衔接

| 文件 | 后续需要同步的内容 |
| --- | --- |
| `README.md:1,3` | 项目名称、学术平台定位、AIF 支持关系。 |
| `docs/requirements.md:5,11,15` | 支持机构与“本课题组研究”表述。 |
| `docs/architecture.md:52`、`docs/database.md:79` | `/research` / `our_research` 功能说明中的 ZIBS 自有研究标签；不因此改表名和接口。 |
| `CLAUDE.md:9` | 项目定位需与新的建设决定一致，防止后续开发恢复旧品牌。 |
| `docs/planning/29-域名部署与迁移执行清单.md:13,34,86,87` | 更新机构域名申请路线为 AIF；旧 ZIBS 子域示例改为历史讨论，不替换成未经分配的 AIF 域名。 |
| `docs/planning/UI设计规范(持续汇总).md:49` | 侧栏旧 ZJU ZIBS 版权描述需跟进新口径。 |
| `.agents/agent_assets_metadata.toml:8` | 部署指南展示标题含 ZIBS，执行品牌调整时核对。 |

邮件问题排查存档、旧测试说明里的账号和历史步骤保留原始记录；可加当前品牌说明，不重写过去发生的事实。

`Sponsored by AIF` 本身不完成域名授权或公开部署申请。申请路径、DNS、账号维护责任单独在部署清单中更新；Render 上的网页运行环境可以保持现状。

## 六、后续实施与验收待办

- [ ] 采用统一平台名、AIF 支持句和中文译法；集中管理这些品牌字符串，避免多页再次分散硬编码。
- [ ] 完成共享 Layout、首页、认证弹窗、研究／资源／量化页的中英文改名。
- [ ] 保留成员真实学籍，按本次指示更新导师的展示机构；核对导师外链。
- [ ] 更新网页 meta description；重新制作品牌宣传图片，不改原论文署名。
- [ ] 同步邮件主题／适用的发件人显示名；核对实际邮箱账号显示名。
- [ ] 以新版本更新插件可见品牌、ZIP、release JSON 与 fallback；验证旧 token 和下载兼容。
- [ ] 更新现行建设文档中的平台归属与 AIF 域名申请路线。
- [ ] 对数据库内容逐条核对，不批量改作者／论文的真实单位。
- [ ] 在中文／英文、日间／夜间、桌面侧栏展开／折叠、移动菜单展开时检查品牌文字完整显示。
- [ ] 检查登录、注册、验证码、忘记密码、插件授权以及资源详情等界面和弹窗。
- [ ] 源码改动后完成 typecheck 与 build，再按部署手册发布前后端和插件相关产物。

上述清单为审查时的完整范围，实际实施与尚待核对内容见下一节。

## 七、2026-10-14 实施与发布记录

- 新增 `src/lib/brand.ts` 集中维护平台名称、机构支持表述与插件名称。
- 完成 Layout、首页、登录／注册弹窗、研究、资源、量化页、插件安装与授权页的品牌调整；首页导师展示机构改为 AIF。
- 保留成员的 ZIBS iMF／MBA 学籍及导师原有可用履历链接，不改论文／资源的真实机构署名。
- 页脚移除旧学院地址和网址，另列 AIF 支持说明及官网链接；版权使用平台名称和动态年份。
- 同步认证邮件主题与 Brevo 发件人显示名；未更换邮箱地址、Microsoft Graph 账号显示名或邮件服务账号资料。
- 插件升级至 0.4.1，更新可见名称及下载元数据；旧 ZIP 地址和内部凭据标识继续保留。
- 更新搜索／分享摘要，使用版本化的新分享图片路径 `opengraph.png`；旧 `opengraph.jpg` 也重新生成，以清除图片内的旧 ZIBS 首页文案。SVG 是可编辑源文件。
- README、需求、架构、数据库说明、开发规则和域名迁移清单已同步 AIF 表述；部署手册更新为此前在 Render 验证通过的 Corepack 构建命令。
- 全量 `pnpm run build`（包含 typecheck）通过；浏览器核对了中文／英文首页、日间／夜间、移动宽度以及登录／注册弹窗；插件 ZIP 中 manifest 的名称与版本核对通过。
- 本地 `.env` 的数据库连接返回 tenant/user not found，无法据此核对生产审核队列；本轮不修订数据库连接或执行迁移。
- 发布前确认远端 main 为 `8aef6bb`。本次只提交机构表述及关联产物，不包含既有 `.gitkeep` 删除或 `scripts/src/audit-import-folders.ts` 改动。
- Render 发布和线上验收状态将在部署后补充。
