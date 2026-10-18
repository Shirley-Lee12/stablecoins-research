# Content and Function Preservation

比较基准c8a7b602；产品代码只改变呈现和导航。

## 已保留

- 全局搜索的真实提交、特殊字符编码、Ctrl/⌘K、q参数筛选及ID定位。
- zh/en、class-based light/dark、语言与主题持久化、正确面包屑、地区别名。
- 公共目录v0.2 API及approved-only边界；未知metadata保持unknown；筛选、排序、机构和研究者投影。
- 学术DOI/URL/作者/日期修正：运行时generated data和backend均与c8a7b602字节一致；本轮不重放七条生产补丁。
- 55是已提交框架数量，不补造完整清单、不宣称风险独立；T0–T3与L0–L3继续区分。
- AI-DEFIT accepted conference study、已核验的初步programme显示口径（2026-09-30线上第1场）；不将conference year当publication date。
- 匿名送审PDF保留原始字节，不生成署名论文、不篡改论文状态。
- 当前研究/会议论文与未来7项研究方向分开，边界可见；硕士阶段实证成果没有移入网站。
- Agentic overview / protocols / 八个真实protocol详情 / scenarios / ecosystem；所有冻结协议证据、授权/资金/结算区分、风险和引用不变。
- 旧版侧栏视觉、桌面折叠、手机导航抽屉；恢复About六子项并新增Agentic四子项。
- 新版导航图、五个研究问题及说明、证据入口完整保留在首页“研究导航与证据”展开区；该入口可键盘打开。
- Artemis historical/retired、来源时间与数据状态说明不变。
- 登录、贡献、通知、编辑/审核权限和治理测试保持；没有创建或关联新的作者身份。

## 尚未移植的内容

已核验研究数据/功能的未移植项：**0**。旧版错误或已退役内容不属于待移植项，故不恢复：虚假实时风险概率/指数、可运行预警系统宣称、旧完整55清单与不恰当实证成果、把未来方向写成完成成果、把所有书目作者当verified researcher。

新版内容结构产生的视觉差异见 `OLD_VS_NEW_UI_DIFF.md`；这不等于全部页面逐像素回到旧版，仍需用户视觉验收。

## API与数据库证据边界

完整218项测试包含旧后端legacy资源查询、当前schema、新版公开目录、匿名/owner/admin的隐私隔离、临时持久化与回退；均使用临时PGlite。另7项本地fixture HTTP合约验证通过。

旧版Market UI的summary/projects格式与新v0.2 metric格式不同。仅本地原版截图提供快照格式适配，新版产品继续消费现有v0.2 API；不能将这个夹具宣称为旧市场前端对当前生产API完全兼容。

本轮没有连接生产数据库：DML=0、migration=0、审批动作=0、补丁重放=0。22 pending resources及8 ready_for_review jobs没有被本轮读取或修改。既有补丁和治理规则保留。

受保护文件的Git差异检查见 `PROTECTED_INPUT_CHECK.json`。
