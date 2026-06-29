# 页面设计规范（UI Guidelines）

## 主题（明/暗）

- 实现：`artifacts/stablecoin-hub/src/lib/theme-context.tsx`，`ThemeProvider` 通过在 `<html>` 上加/去 `dark` class 来切换主题——**class 驱动，不是 `prefers-color-scheme` 媒体查询驱动**。初始值：先读 `localStorage`（key: `app-theme`），没有则回退一次系统偏好，之后完全由用户手动切换控制，不再跟随系统变化。
- CSS 变量：颜色 token 统一定义在 `artifacts/stablecoin-hub/src/index.css` 的 `:root`（浅色）和 `.dark`（深色）两个块里，新增颜色变量时两处都要补。
- 切换入口：布局头部的太阳/月亮图标按钮，调用 `toggleTheme()`。

## 配色

- **禁止使用金色**——主色调统一为海洋蓝（ocean blue）系。
- 不使用 emoji，除非用户明确要求。

## 导航结构

- 侧边栏导航定义在 `artifacts/stablecoin-hub/src/components/layout.tsx` 的 `NAV_ITEMS`（导航项+图标+子项）和 `ROUTE_LABELS`（路由→中英文标题映射，用于面包屑）。
- 当前一级导航：概览、数据仪表盘、关于稳定币（含 4 个子项）、我们的研究、资源库、专家学者、监管现状、量化指标（含 2 个子项）、市场数据（含 2 个子项）。管理中心（`/admin`）、个人资料、我的贡献、修改密码不在主导航，是用户菜单下的二级入口。
- "专家学者"不是独立的顶级业务模块，而是 `/academic-resources` 内 `source_type` 的一个过滤值；详见 [`api-design.md`](./api-design.md)。
- 新增页面时：在 `src/pages/` 建文件 + 在 `layout.tsx` 的 `NAV_ITEMS`/`ROUTE_LABELS` 注册路由和中英文标题，两处缺一都会导致面包屑或导航缺失。

## 国际化（i18n）

- 所有用户可见文案必须通过 `useLanguage().t(en, zh)` 包裹，禁止硬编码单一语言字符串。
- `language` 持久化在 `localStorage` key `app-lang`，默认 `en`。
