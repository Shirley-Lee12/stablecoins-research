---
name: Theme system
description: Dark/light toggle; ThemeProvider adds/removes 'dark' class on html element; CSS vars split in :root vs .dark.
---

**Rule:** Theme is controlled by toggling the `dark` class on `<html>`. CSS custom properties defined in `:root` (light) and `.dark` (dark). Never use Tailwind's `darkMode: 'media'` — it's class-based here.

**Why:** User wanted a persistent dark/light toggle. Class-based dark mode allows manual control independent of OS preference.

**How to apply:**
- Provider: `artifacts/stablecoin-hub/src/lib/theme-context.tsx` — reads from localStorage on init, falls back to `prefers-color-scheme`
- Persists to `localStorage` key `app-theme`
- Toggle button in layout header (sun/moon icon) calls `toggleTheme()`
- CSS vars: `artifacts/stablecoin-hub/src/index.css` — all color tokens defined in both `:root` and `.dark`
- Smooth transitions applied globally with a 150ms ease on background-color, border-color, color (excluded from animation-heavy elements)
