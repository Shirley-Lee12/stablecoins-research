# 真实React本地预览

- 整合概览：http://127.0.0.1:5304/agentic-payments
- AP2：http://127.0.0.1:5304/agentic-payments/protocols/ap2
- 对照632基线：http://127.0.0.1:5305/agentic-payments（本机临时独立导出，进程停止后不保证持续）

正式应用源文件在artifacts/stablecoin-hub/src，不是HTML Demo。预览使用envFile:false避免载入凭据；未认证API只读使用此前验收的本地GET响应fixture，POST/PATCH/DELETE返回405。不提交登录、审核、导入或生产写操作。市场读取仍是有日期的公共快照；没有fixture的账户/API不能据此判断生产故障。

重启整合版本（已安装本仓库依赖；端口5304需空闲）：

```sh
node docs/integration/phase-2a/preview.mjs
```

该脚本从仓库位置运行真实Vite React应用；本机缓存fixture不存在时显式404，不生成假数据。需要Node24与现有pnpm依赖。桌面1440×1000与手机390×844、DPR1，切换EN/中文与主题检查；先看原侧边栏/顶部栏目，再看D01与AP2的证据段。

截图和全部浏览器原始记录位于outputs/post-release-integration-phase2a-2026-10-19。此版本仅供本地审核，没有发布。
