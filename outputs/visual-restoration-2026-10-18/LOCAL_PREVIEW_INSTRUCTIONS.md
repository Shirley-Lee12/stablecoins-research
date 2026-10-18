# 本地预览与停止点

当前服务：

- **恢复版**：[http://127.0.0.1:5293/](http://127.0.0.1:5293/)
- **旧版542f534**：[http://127.0.0.1:5292/](http://127.0.0.1:5292/)
- 只读公开快照API：`127.0.0.1:5291`，非GET统一405，不加载.env或数据库凭据。
- 截图比较：[VISUAL_REVIEW.html](VISUAL_REVIEW.html)。浏览器访问方式为恢复版地址后加 `/@fs/Users/shirleylee/Downloads/Stablecoin-Lifecycle-history-rewrite-2026-10-17/outputs/visual-restoration-2026-10-18/VISUAL_REVIEW.html`。

使用手机开发者模式：viewport **390×844，DPR=1**；桌面建议1440×1000。原搜索框沿旧版规则仅在2xl（≥1536px）出现，搜索验收用1600px，不应把1440px隐藏认作功能丢失。

建议依次看：首页→展开关于稳定币→六个子项→智能体四个子项→协议详情→研究→风险框架→市场数据→资源→研究者。切换中文/英文及明暗主题；资源页可试 `?id=114`，搜索可试 `Stablecoin Runs`。

## 重启本地预览

在本机已有依赖的正式checkout中运行（不需要生产.env）：

```sh
cd /Users/shirleylee/Downloads/Stablecoin-Lifecycle-history-rewrite-2026-10-17
/Users/shirleylee/.nvm/versions/node/v24.18.0/bin/node outputs/visual-restoration-2026-10-18/scripts/local-preview.mjs
```

若端口已被本任务预览占用，直接访问现有服务即可；不重复启动。前台启动后Ctrl+C结束本地进程。脚本将旧前端从Git archive提取到 `/private/tmp/stablecoin-original-ui-542f534`；不checkout/reset主项目，不修改Git历史。

预览读取本checkout已经保存的公开资源、研究者、书目作者与市场快照；并非实时生产数据。旧市场页由本地legacy格式适配器呈现，未知元数据保持null，未伪造项目状态。没有配置登录凭据；本地上传/审批/写入功能不可用。

截图及大体积原始浏览器证据保留在本地outputs；本地代码提交不把全部截图写入Git历史。重新采集的脚本在本目录scripts中；需要本机已有Playwright/Chrome运行时。

## 质量复验

```sh
GOVERNANCE_PGLITE_MODULE=/private/tmp/hub-governance-test-runtime-direct/node_modules/@electric-sql/pglite/dist/index.js /Users/shirleylee/.nvm/versions/node/v24.18.0/bin/node --import ./scripts/node_modules/tsx/dist/loader.mjs --test scripts/tests/*.test.ts
```

类型检查与构建使用Node24的pnpm：`pnpm run typecheck`、`pnpm run build`。完整验证记录见 `full-tests.log`、`typecheck.log`、`build.log`。构建会重打包连接器ZIP，本轮已还原该无关产物，不应把它混入视觉修复。

**本轮停止于本地视觉审阅。用户明确批准界面后，才能另开正式上线步骤；不要push main、部署Render或操作生产数据库。**
