# 重复来源与潜在废弃代码登记

判定依据：正式App路由和从main.tsx递归的TS/TSX/JSON静态导入图（SOURCE_REFERENCE_GRAPH.json）；动态字符串、公用URL、测试和历史证据须另审，**静态不可达本身不构成删除许可**。本轮删除0文件。

|对象|实际引用/证据价值|处置|
|---|---|---|
|Friday Agentic 数据|新canonical adapter引用；六协议独有流程/风险/案例|保留，禁止删成“过时副本”|
|V0.2 wrapper/JSON|adapter与evidence组件引用，32来源/分类/双语稿/原SVG|保留；source ID不混用，单一正式adapter入口|
|旧版Agentic helper|任务步骤/来源dialog/协议nav仍被正式页面引用|保留，未重做侧边导航|
|原D01–D06 SVG及source package|原始研究、哈希测试和恢复价值；D01展示已改React|全部保留；不因未在当前UI展示而删原稿|
|about-stablecoins-v02、academic-directory-v02、market-data-v02、risk-framework 页面|部分没有当前App入口；仍是待移植成果/测试依据|保留，后续按模块合并后再判定|
|friday-asia / asia-developments 两套|现有UI/核验资料双重价值|保留，逐事件核验后适配|
|global search /图形包装等候选|静态图列候选，但有后续恢复与功能价值|本轮不删；恢复搜索需独立验收|
|Layout Collapsible|Market/Regional仍有children，与About/Agentic不同|保留；禁止机械移除通用展开逻辑|
|独立HTML A/B、V1.1 / recovery预览|历史方案NOT APPROVED和恢复证据，不是生产React依赖|不移入正式应用，不删除历史；本轮预览是真实React|
|公共下载与市场snapshot|URL访问不一定被import图识别；下载与数据运行时需要|原字节保留|
|重复生态展示|将9个V0.2记录与历史角色说明合并成同一11条可搜索列表|已合并；Visa/Mastercard保留，Meta维护角色不删|
|重复样式|现有主题tokens与布局类沿用；新增图只局部排版|未进行全站样式清理|

## 静态不可达候选（不是已批准删除清单）

- `components/about-stablecoins-ui.tsx`
- `components/asia-development-ui.tsx`
- `components/directory-ui.tsx`
- `components/global-search.tsx`
- `components/home-research-ui.tsx`
- `components/market-data-ui.tsx`
- `components/page-metadata.tsx`
- `components/regulatory-ui.tsx`
- `components/risk-framework-ui.tsx`
- `components/ui/accordion.tsx`
- `components/ui/alert-dialog.tsx`
- `components/ui/alert.tsx`
- `components/ui/aspect-ratio.tsx`
- `components/ui/badge.tsx`
- `components/ui/button-group.tsx`
- `components/ui/calendar.tsx`
- `components/ui/carousel.tsx`
- `components/ui/chart.tsx`
- `components/ui/checkbox.tsx`
- `components/ui/command.tsx`
- `components/ui/context-menu.tsx`
- `components/ui/drawer.tsx`
- `components/ui/empty.tsx`
- `components/ui/field.tsx`
- `components/ui/input-group.tsx`
- `components/ui/input-otp.tsx`
- `components/ui/item.tsx`
- `components/ui/kbd.tsx`
- `components/ui/menubar.tsx`
- `components/ui/navigation-menu.tsx`
- `components/ui/pagination.tsx`
- `components/ui/popover.tsx`
- `components/ui/progress.tsx`
- `components/ui/radio-group.tsx`
- `components/ui/resizable.tsx`
- `components/ui/scroll-area.tsx`
- `components/ui/select.tsx`
- `components/ui/separator.tsx`
- `components/ui/sidebar.tsx`
- `components/ui/slider.tsx`
- `components/ui/sonner.tsx`
- `components/ui/spinner.tsx`
- `components/ui/switch.tsx`
- `components/ui/table.tsx`
- `components/ui/toggle-group.tsx`
- `components/ui/toggle.tsx`
- `data/about-stablecoins-v02.generated.json`
- `data/about-stablecoins.ts`
- `data/academic-directory-v02.generated.json`
- `data/academic-directory.ts`
- `data/asia-development-v02.generated.json`
- `data/asia-developments.ts`
- `data/asia-english-copy-qa.ts`
- `data/market-data-model.ts`
- `data/market-data-v02.generated.json`
- `data/market-data.ts`
- `data/regulatory-v02.generated.json`
- `data/regulatory.ts`
- `data/research-risks.ts`
- `hooks/use-market-data.ts`
- `hooks/use-mobile.tsx`
- `hooks/use-public-directory.ts`
- `lib/page-metadata.ts`
- `pages/about-stablecoins-v02.tsx`
- `pages/academic-directory-v02.tsx`
- `pages/market-data-v02.tsx`
- `pages/risk-framework.tsx`
