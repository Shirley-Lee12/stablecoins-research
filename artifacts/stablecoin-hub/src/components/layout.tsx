import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { useTheme } from "@/lib/theme-context";
import { authenticatedFetch, useAuth } from "@/lib/auth-context";
import { AuthDialog } from "@/components/auth-dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart,
  BookOpen,
  LayoutDashboard,
  LineChart,
  Menu,
  X,
  Sun,
  Moon,
  Home,
  Database,
  Microscope,
  LogOut,
  LogIn,
  ChevronLeft,
  ChevronRight,
  Search,
  Shield,
  User,
  BookMarked,
  KeyRound,
  Bell,
  CheckCheck,
  UsersRound,
  ArrowUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Route map ─────────────────────────────────────────────────────────────────
const ROUTE_LABELS: Record<string, { en: string; zh: string }> = {
  "/": { en: "Home", zh: "首页" },
  "/dashboard": { en: "Dashboard", zh: "数据仪表盘" },
  "/about-stablecoins": { en: "About Stablecoins", zh: "关于稳定币" },
  "/about-stablecoins/learn": { en: "Learn Stablecoins", zh: "了解稳定币" },
  "/about-stablecoins/history": { en: "History", zh: "历程" },
  "/about-stablecoins/types": { en: "Stablecoin Types", zh: "稳定币类别" },
  "/about-stablecoins/applications": { en: "Applications", zh: "应用" },
  "/about-stablecoins/regulatory-evolution": {
    en: "Regulatory Evolution",
    zh: "监管演变",
  },
  "/research": { en: "Our Research", zh: "我们的研究" },
  "/academic-resources": { en: "Resources", zh: "资源库" },
  "/experts": { en: "Experts & Institutions", zh: "专家与机构" },
  "/regulatory": { en: "Regulatory Status", zh: "监管现状" },
  "/quantitative": { en: "Quantitative Indicators", zh: "量化指标" },
  "/quantitative/dimension-a": { en: "Dimension A", zh: "维度 A" },
  "/quantitative/dimension-b": { en: "Dimension B", zh: "维度 B" },
  "/market-data": { en: "Market Data", zh: "市场数据" },
  "/market-data/price-tracking": { en: "Price Tracking", zh: "价格追踪" },
  "/market-data/trading-volume": { en: "Trading Volume", zh: "交易量" },
  "/admin": { en: "Admin Center", zh: "管理中心" },
  "/profile": { en: "My Profile", zh: "个人资料" },
  "/my-contributions": { en: "My Contributions", zh: "我的贡献" },
  "/change-password": { en: "Change Password", zh: "修改密码" },
};

// ── Nav config ────────────────────────────────────────────────────────────────
interface NavChild {
  href: string;
  labelEn: string;
  labelZh: string;
}
interface NavItem {
  href: string;
  labelEn: string;
  labelZh: string;
  icon: React.ElementType;
  children?: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", labelEn: "Overview", labelZh: "中心概览", icon: Home },
  {
    href: "/dashboard",
    labelEn: "Dashboard",
    labelZh: "数据仪表盘",
    icon: LayoutDashboard,
  },
  {
    href: "/about-stablecoins",
    labelEn: "About Stablecoins",
    labelZh: "关于稳定币",
    icon: BookOpen,
    children: [
      {
        href: "/about-stablecoins",
        labelEn: "Learn Stablecoins",
        labelZh: "了解稳定币",
      },
      {
        href: "/about-stablecoins/history",
        labelEn: "History",
        labelZh: "历程",
      },
      { href: "/about-stablecoins/types", labelEn: "Stablecoin Types", labelZh: "稳定币类别" },
      {
        href: "/about-stablecoins/applications",
        labelEn: "Applications",
        labelZh: "应用",
      },
      {
        href: "/about-stablecoins/regulatory-evolution",
        labelEn: "Regulatory Evolution",
        labelZh: "监管演变",
      },
      {
        href: "/regulatory",
        labelEn: "Regulatory Status",
        labelZh: "监管现状",
      },
    ],
  },
  {
    href: "/research",
    labelEn: "Our Research",
    labelZh: "我们的研究",
    icon: Microscope,
  },
  {
    href: "/academic-resources",
    labelEn: "Resources",
    labelZh: "资源库",
    icon: Database,
  },
  {
    href: "/experts",
    labelEn: "Experts & Institutions",
    labelZh: "专家与机构",
    icon: UsersRound,
  },
  {
    href: "/quantitative",
    labelEn: "Quantitative Indicators",
    labelZh: "量化指标",
    icon: BarChart,
  },
  {
    href: "/market-data",
    labelEn: "Market Data",
    labelZh: "市场数据",
    icon: LineChart,
  },
];

// ── Breadcrumb builder ────────────────────────────────────────────────────────
function useBreadcrumbs(location: string, language: string) {
  if (location === "/") return [{ label: language === "zh" ? "首页" : "Home" }];
  const crumbs: { href?: string; label: string }[] = [
    { href: "/", label: language === "zh" ? "首页" : "Home" },
  ];
  const segments = location.split("/").filter(Boolean);
  let currentPath = "";
  segments.forEach((seg, i) => {
    currentPath += "/" + seg;
    const entry = ROUTE_LABELS[currentPath];
    const mechanismLabels: Record<string, { en: string; zh: string }> = {
      "fiat-backed": { en: "Fiat-backed", zh: "法币储备型" },
      "crypto-backed": { en: "Crypto-collateralized", zh: "加密资产抵押型" },
      synthetic: { en: "Synthetic", zh: "合成型" },
      algorithmic: { en: "Algorithmic", zh: "算法型" },
      other: { en: "Other", zh: "其他" },
    };
    const mechanismEntry = currentPath.startsWith("/about-stablecoins/types/") ? mechanismLabels[seg] : undefined;
    const label = entry ? (language === "zh" ? entry.zh : entry.en) : mechanismEntry ? (language === "zh" ? mechanismEntry.zh : mechanismEntry.en) : seg;
    const isLast = i === segments.length - 1;
    crumbs.push(isLast ? { label } : { href: currentPath, label });
  });
  return crumbs;
}

// ── Global Search ─────────────────────────────────────────────────────────────
function GlobalSearch({ language }: { language: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      className={cn(
        "hidden 2xl:flex items-center gap-2 w-full max-w-[280px] h-8 px-3 rounded-md border transition-all text-sm text-muted-foreground bg-muted/40",
        focused
          ? "border-primary/50 ring-2 ring-primary/20 bg-background"
          : "border-border/60 hover:border-border",
      )}
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      <input
        ref={inputRef}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={language === "zh" ? "搜索内容…" : "Search…"}
        className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70 text-xs"
      />
      <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] text-muted-foreground/60 shrink-0">
        ⌘K
      </kbd>
    </div>
  );
}

// ── Sidebar NavItem (with optional Collapsible) ───────────────────────────────
function SidebarNavItem({
  item,
  location,
  language,
  onNavigate,
  openMap,
  setOpenMap,
  collapsed,
  onRequestExpand,
}: {
  item: NavItem;
  location: string;
  language: string;
  onNavigate: () => void;
  openMap: Record<string, boolean>;
  setOpenMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  collapsed: boolean;
  onRequestExpand: () => void;
}) {
  const zh = language === "zh";
  const isParentActive =
    (item.href === "/" && location === "/") ||
    (item.href !== "/" && location.startsWith(item.href)) ||
    item.children?.some((child) => location.startsWith(child.href));
  const hasChildren = !!item.children?.length;
  const isOpen = openMap[item.href] ?? false;

  if (!hasChildren) {
    return (
      <Link href={item.href} onClick={onNavigate}>
        <div
          title={collapsed ? (zh ? item.labelZh : item.labelEn) : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium cursor-pointer select-none",
            collapsed && "lg:justify-center lg:gap-0 lg:px-2",
            isParentActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className={cn("min-w-0 truncate", collapsed && "lg:hidden")}>
            {zh ? item.labelZh : item.labelEn}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={(v) => setOpenMap((prev) => ({ ...prev, [item.href]: v }))}
    >
      <CollapsibleTrigger asChild>
        <div
          onClick={() => {
            if (collapsed && window.innerWidth >= 1024) onRequestExpand();
          }}
          title={collapsed ? (zh ? item.labelZh : item.labelEn) : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium cursor-pointer select-none",
            collapsed && "lg:justify-center lg:gap-0 lg:px-2",
            isParentActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className={cn("flex-1 min-w-0 truncate", collapsed && "lg:hidden")}>
            {zh ? item.labelZh : item.labelEn}
          </span>
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
              isOpen && "rotate-90",
              collapsed && "lg:hidden",
            )}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className={cn(collapsed && "lg:hidden")}>
        <div className="ml-7 mt-0.5 mb-0.5 flex flex-col gap-0.5 border-l border-sidebar-border/60 pl-3">
          {item.children!.map((child) => {
            const childActive = location === child.href || (child.href === "/about-stablecoins/types" && location.startsWith(`${child.href}/`));
            return (
              <Link key={child.href} href={child.href} onClick={onNavigate}>
                <div
                  className={cn(
                    "px-2 py-2 rounded-md text-xs font-medium cursor-pointer transition-all",
                    childActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/55 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
                  )}
                >
                  {zh ? child.labelZh : child.labelEn}
                </div>
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { user, token, logout, sessionExpired } = useAuth();
  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; titleZh?: string | null; body?: string | null; bodyZh?: string | null; href?: string | null; read: boolean; createdAt: string }>>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(
    () => window.localStorage.getItem("global-sidebar-collapsed") === "true",
  );
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const zh = language === "zh";

  useEffect(() => {
    const updateVisibility = () => setShowBackToTop(window.scrollY > 520);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  useEffect(() => {
    if (!token) { setNotifications([]); return; }
    let active = true;
    const load = () => authenticatedFetch(`${(import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "")}/api/account/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => response.ok ? response.json() : []).then((rows) => {
      if (active) setNotifications(Array.isArray(rows) ? rows : []);
    }).catch(() => undefined);
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    authenticatedFetch(`${(import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "")}/api/account/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => response.ok ? response.json() : null).then((profile) => {
      if (!profile) return;
      if (profile.locale === "zh" || profile.locale === "en") setLanguage(profile.locale);
      const resolvedTheme = profile.themePreference === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : profile.themePreference;
      if (resolvedTheme === "light" || resolvedTheme === "dark") setTheme(resolvedTheme);
      const scale = profile.fontScale;
      document.documentElement.style.fontSize = scale === "small" ? "15px" : scale === "large" ? "18px" : "16px";
      if (["small", "medium", "large"].includes(scale)) localStorage.setItem("app-font-scale", scale);
    }).catch(() => undefined);
  }, [setLanguage, setTheme, token]);

  async function openNotification(notification: (typeof notifications)[number]) {
    if (token && !notification.read) {
      await authenticatedFetch(`${(import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "")}/api/account/notifications/${notification.id}/read`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    }
    if (notification.href) navigate(notification.href);
  }

  async function markAllNotificationsRead() {
    if (!token) return;
    await authenticatedFetch(`${(import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "")}/api/account/notifications/read-all`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
  }

  useEffect(() => {
    if (!sessionExpired) return;
    setAuthView("login");
    setAuthOpen(true);
  }, [sessionExpired]);

  useEffect(() => {
    window.localStorage.setItem("global-sidebar-collapsed", String(isDesktopSidebarCollapsed));
  }, [isDesktopSidebarCollapsed]);

  // Collapsible open state — auto-open parent when child route is active
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    NAV_ITEMS.forEach((item) => {
      if (item.children) {
        init[item.href] = item.children.some((c) =>
          location.startsWith(c.href),
        );
      }
    });
    return init;
  });

  // Auto-expand parent on navigation
  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      if (item.children) {
        const shouldOpen = item.children.some((c) =>
          location.startsWith(c.href),
        );
        if (shouldOpen) setOpenMap((prev) => ({ ...prev, [item.href]: true }));
      }
    });
  }, [location]);

  const breadcrumbs = useBreadcrumbs(location, language);
  const openAuth = (view: "login" | "register") => {
    setAuthView(view);
    setAuthOpen(true);
  };
  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-background font-sans text-foreground">
      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-[transform,width] duration-300 ease-in-out border-r border-sidebar-border lg:static lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full",
          isDesktopSidebarCollapsed ? "lg:w-16" : "lg:w-64",
        )}
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute -right-3 top-[76px] z-10 hidden h-6 w-6 rounded-full border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:inline-flex"
          onClick={() => setIsDesktopSidebarCollapsed((collapsed) => !collapsed)}
          aria-label={isDesktopSidebarCollapsed ? t("Expand navigation", "展开导航") : t("Collapse navigation", "收起导航")}
          title={isDesktopSidebarCollapsed ? t("Expand navigation", "展开导航") : t("Collapse navigation", "收起导航")}
        >
          {isDesktopSidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </Button>

        {/* Brand */}
        <Link href="/" onClick={closeSidebarOnMobile}>
          <div className={cn(
            "flex h-16 items-center px-4 border-b border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground cursor-pointer hover:bg-sidebar-accent/25 transition-colors",
            isDesktopSidebarCollapsed && "lg:justify-center lg:px-2",
          )}>
            <div className={cn("flex-1 min-w-0", isDesktopSidebarCollapsed && "lg:hidden")}>
              <span className="font-sans font-semibold text-sm leading-snug block">
                {t("ZIBS Stablecoins", "浙大ZIBS稳定币")}
              </span>
              <span className="font-sans font-medium text-xs leading-snug block opacity-65">
                {t("Research Hub", "研究中心")}
              </span>
            </div>
            <span className={cn("hidden font-sans text-lg font-semibold", isDesktopSidebarCollapsed && "lg:block")}>
              Z
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-sidebar-primary-foreground hover:bg-black/10 ml-2 shrink-0 h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                setIsSidebarOpen(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Link>

        {/* Nav */}
        <nav className={cn("flex-1 p-3 space-y-0.5 overflow-y-auto", isDesktopSidebarCollapsed && "lg:px-2")}>
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              location={location}
              language={language}
              onNavigate={closeSidebarOnMobile}
              openMap={openMap}
              setOpenMap={setOpenMap}
              collapsed={isDesktopSidebarCollapsed}
              onRequestExpand={() => setIsDesktopSidebarCollapsed(false)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className={cn(
          "p-3 border-t border-sidebar-border text-xs text-sidebar-foreground/35 px-5",
          isDesktopSidebarCollapsed && "lg:hidden",
        )}>
          {t(
            `© ${new Date().getFullYear()} ZJU ZIBS`,
            `© ${new Date().getFullYear()} 浙大ZIBS`,
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Top Header ── */}
        <header className="h-14 flex items-center gap-3 px-4 sm:px-6 bg-card/95 backdrop-blur border-b border-border sticky top-0 z-40">
          {/* LEFT — hamburger + breadcrumbs */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 shrink-0"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* Breadcrumbs */}
            <Breadcrumb className="hidden sm:flex min-w-0">
              <BreadcrumbList className="flex-nowrap">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={idx}>
                      {idx > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem>
                        {isLast || !crumb.href ? (
                          <BreadcrumbPage
                            className={cn(
                              "text-xs font-medium max-w-[160px] truncate",
                              isLast
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {crumb.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink
                            href={crumb.href}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate max-w-[120px]"
                          >
                            {crumb.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* CENTER — global search */}
          <div className="flex justify-center shrink-0">
            <GlobalSearch language={language} />
          </div>

          {/* RIGHT — controls */}
          <div className="flex items-center gap-1 shrink-0 flex-1 justify-end">
            {/* Language */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "zh" : "en")}
              className="font-medium text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground"
            >
              {language === "en" ? "中文" : "EN"}
            </Button>

            {/* Theme */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
              title={
                theme === "light"
                  ? t("Dark mode", "深色模式")
                  : t("Light mode", "浅色模式")
              }
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            {/* ── Auth area ── */}
            {user ? (
              <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-foreground" title={t("Messages", "消息中心")}>
                    <Bell className="h-4 w-4" />
                    {notifications.some((item) => !item.read) && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[min(380px,calc(100vw-24px))]" align="end">
                  <DropdownMenuLabel className="flex items-center justify-between gap-3">
                    <span>{zh ? "消息中心" : "Messages"}</span>
                    {notifications.some((item) => !item.read) && <button onClick={() => void markAllNotificationsRead()} className="inline-flex items-center gap-1 text-xs font-normal text-primary hover:underline"><CheckCheck className="h-3.5 w-3.5" />{zh ? "全部已读" : "Mark all read"}</button>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? <div className="px-4 py-8 text-center text-sm text-muted-foreground">{zh ? "暂无新消息" : "No messages yet"}</div> : notifications.slice(0, 8).map((notification) => (
                    <DropdownMenuItem key={notification.id} onClick={() => void openNotification(notification)} className="cursor-pointer items-start gap-3 py-3">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.read ? "bg-border" : "bg-primary"}`} />
                      <span className="min-w-0"><strong className="block whitespace-normal text-sm leading-5">{zh ? notification.titleZh || notification.title : notification.title}</strong>{(zh ? notification.bodyZh || notification.body : notification.body) && <span className="mt-1 line-clamp-2 whitespace-normal text-xs leading-5 text-muted-foreground">{zh ? notification.bodyZh || notification.body : notification.body}</span>}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 rounded-full border border-border hover:border-primary/40 p-0"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52" align="end">
                  <DropdownMenuLabel className="font-normal pb-1.5">
                    <p className="text-sm font-semibold leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-none">
                      {user.email}
                    </p>
                    {user.role === "admin" && (
                      <span className="inline-block mt-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">
                        Admin
                      </span>
                    )}
                  </DropdownMenuLabel>

                  {user.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => navigate("/admin")}
                        className="gap-2 font-semibold text-primary focus:text-primary cursor-pointer"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        {zh ? "管理中心" : "Admin Center"}
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => navigate("/profile")}
                    className="gap-2 cursor-pointer"
                  >
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {zh ? "个人资料" : "My Profile"}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate("/my-contributions")}
                    className="gap-2 cursor-pointer"
                  >
                    <BookMarked className="h-3.5 w-3.5 text-muted-foreground" />
                    {zh ? "我的贡献" : "My Contributions"}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate("/change-password")}
                    className="gap-2 cursor-pointer"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                    {zh ? "修改密码" : "Change Password"}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={logout}
                    className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {zh ? "退出登录" : "Sign Out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openAuth("login")}
                  className="h-8 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground hidden sm:flex"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  {t("Sign In", "登录")}
                </Button>
                <Button
                  size="sm"
                  onClick={() => openAuth("register")}
                  className="h-8 px-3 text-xs hidden sm:flex"
                >
                  {t("Register", "注册")}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:hidden"
                  onClick={() => openAuth("login")}
                >
                  <LogIn className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-background">
          {children}
        </main>
      </div>

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        initialView={authView}
        loginNotice={sessionExpired
          ? t("Your login has expired. Sign in again to continue from this page.", "登录已过期，请重新登录；登录后可继续当前页面的操作。")
          : null}
      />
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={t("Back to top", "返回顶部")}
        title={t("Back to top", "返回顶部")}
        className={cn(
          "fixed bottom-16 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-primary/25 bg-background/95 text-primary shadow-lg backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 xl:bottom-6 xl:right-6",
          showBackToTop
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        <ArrowUp className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
