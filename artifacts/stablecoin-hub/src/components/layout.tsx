import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";
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
  BarChart, BookOpen, Globe, LayoutDashboard, LineChart,
  Menu, X, Sun, Moon, Home, Database, Microscope, LogOut,
  LogIn, ChevronRight, Search, Shield, User, BookMarked,
  KeyRound, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Route map ─────────────────────────────────────────────────────────────────
const ROUTE_LABELS: Record<string, { en: string; zh: string }> = {
  "/":                                   { en: "Home",                   zh: "首页" },
  "/dashboard":                          { en: "Dashboard",              zh: "数据仪表盘" },
  "/about-stablecoins":                  { en: "About Stablecoins",      zh: "关于稳定币" },
  "/about-stablecoins/history":          { en: "History",                zh: "历程" },
  "/about-stablecoins/types":            { en: "Types",                  zh: "种类" },
  "/about-stablecoins/applications":     { en: "Applications",           zh: "应用" },
  "/about-stablecoins/regulatory-evolution": { en: "Regulatory Evolution", zh: "监管演变" },
  "/research":                           { en: "Our Research",           zh: "我们的研究" },
  "/academic-resources":                 { en: "Resources",              zh: "资源库" },
  "/experts":                            { en: "Experts & Scholars",     zh: "专家学者" },
  "/regulatory":                         { en: "Regulatory Status",      zh: "监管现状" },
  "/quantitative":                       { en: "Quantitative Indicators",zh: "量化指标" },
  "/quantitative/dimension-a":           { en: "Dimension A",            zh: "维度 A" },
  "/quantitative/dimension-b":           { en: "Dimension B",            zh: "维度 B" },
  "/market-data":                        { en: "Market Data",            zh: "市场数据" },
  "/market-data/price-tracking":         { en: "Price Tracking",         zh: "价格追踪" },
  "/market-data/trading-volume":         { en: "Trading Volume",         zh: "交易量" },
  "/admin":                              { en: "Admin Center",           zh: "管理中心" },
  "/profile":                            { en: "My Profile",             zh: "个人资料" },
  "/my-contributions":                   { en: "My Contributions",       zh: "我的贡献" },
  "/change-password":                    { en: "Change Password",        zh: "修改密码" },
};

// ── Nav config ────────────────────────────────────────────────────────────────
interface NavChild { href: string; labelEn: string; labelZh: string }
interface NavItem {
  href: string; labelEn: string; labelZh: string; icon: React.ElementType;
  children?: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",                   labelEn: "Overview",                labelZh: "中心概览",  icon: Home },
  { href: "/dashboard",          labelEn: "Dashboard",               labelZh: "数据仪表盘", icon: LayoutDashboard },
  {
    href: "/about-stablecoins",  labelEn: "About Stablecoins",       labelZh: "关于稳定币", icon: BookOpen,
    children: [
      { href: "/about-stablecoins/history",              labelEn: "History",              labelZh: "历程" },
      { href: "/about-stablecoins/types",                labelEn: "Types",                labelZh: "种类" },
      { href: "/about-stablecoins/applications",         labelEn: "Applications",         labelZh: "应用" },
      { href: "/about-stablecoins/regulatory-evolution", labelEn: "Regulatory Evolution", labelZh: "监管演变" },
    ],
  },
  { href: "/research",           labelEn: "Our Research",            labelZh: "我们的研究", icon: Microscope },
  { href: "/academic-resources", labelEn: "Resources",               labelZh: "资源库",    icon: Database },
  { href: "/regulatory",         labelEn: "Regulatory Status",       labelZh: "监管现状",  icon: Globe },
  {
    href: "/quantitative",       labelEn: "Quantitative Indicators", labelZh: "量化指标",  icon: BarChart,
    children: [
      { href: "/quantitative/dimension-a", labelEn: "Dimension A", labelZh: "维度 A" },
      { href: "/quantitative/dimension-b", labelEn: "Dimension B", labelZh: "维度 B" },
    ],
  },
  {
    href: "/market-data",        labelEn: "Market Data",             labelZh: "市场数据",  icon: LineChart,
    children: [
      { href: "/market-data/price-tracking",  labelEn: "Price Tracking", labelZh: "价格追踪" },
      { href: "/market-data/trading-volume",  labelEn: "Trading Volume", labelZh: "交易量" },
    ],
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
    const label = entry ? (language === "zh" ? entry.zh : entry.en) : seg;
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
    <div className={cn(
      "hidden md:flex items-center gap-2 w-full max-w-[280px] h-8 px-3 rounded-lg border transition-all text-sm text-muted-foreground bg-muted/40",
      focused ? "border-primary/50 ring-2 ring-primary/20 bg-background" : "border-border/60 hover:border-border",
    )}>
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
  item, location, language, onNavigate, openMap, setOpenMap,
}: {
  item: NavItem; location: string; language: string;
  onNavigate: () => void;
  openMap: Record<string, boolean>;
  setOpenMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const zh = language === "zh";
  const isParentActive =
    (item.href === "/" && location === "/") ||
    (item.href !== "/" && location.startsWith(item.href));
  const hasChildren = !!item.children?.length;
  const isOpen = openMap[item.href] ?? false;

  if (!hasChildren) {
    return (
      <Link href={item.href} onClick={onNavigate}>
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium cursor-pointer select-none",
          isParentActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )}>
          <item.icon className="h-4 w-4 shrink-0" />
          {zh ? item.labelZh : item.labelEn}
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
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium cursor-pointer select-none",
          isParentActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )}>
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1">{zh ? item.labelZh : item.labelEn}</span>
          <ChevronRight className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            isOpen && "rotate-90",
          )} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-7 mt-0.5 mb-0.5 flex flex-col gap-0.5 border-l border-sidebar-border/60 pl-3">
          {item.children!.map((child) => {
            const childActive = location === child.href;
            return (
              <Link key={child.href} href={child.href} onClick={onNavigate}>
                <div className={cn(
                  "px-2 py-2 rounded-md text-xs font-medium cursor-pointer transition-all",
                  childActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/55 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
                )}>
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
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const zh = language === "zh";

  // Collapsible open state — auto-open parent when child route is active
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    NAV_ITEMS.forEach((item) => {
      if (item.children) {
        init[item.href] = item.children.some((c) => location.startsWith(c.href));
      }
    });
    return init;
  });

  // Auto-expand parent on navigation
  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      if (item.children) {
        const shouldOpen = item.children.some((c) => location.startsWith(c.href));
        if (shouldOpen) setOpenMap((prev) => ({ ...prev, [item.href]: true }));
      }
    });
  }, [location]);

  const breadcrumbs = useBreadcrumbs(location, language);
  const openAuth = (view: "login" | "register") => { setAuthView(view); setAuthOpen(true); };
  const closeSidebarOnMobile = () => { if (window.innerWidth < 1024) setIsSidebarOpen(false); };

  return (
    <div className="min-h-screen flex bg-background font-sans text-foreground">
      {/* ── Sidebar ── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 ease-in-out border-r border-sidebar-border lg:static lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full",
      )}>
        {/* Brand */}
        <Link href="/" onClick={closeSidebarOnMobile}>
          <div className="flex h-16 items-center px-4 border-b border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground cursor-pointer hover:brightness-95 transition-all">
            <div className="flex-1 min-w-0">
              <span className="font-serif font-bold text-sm leading-snug block">
                {t("ZIBS Stablecoins", "浙大ZIBS稳定币")}
              </span>
              <span className="font-serif font-bold text-sm leading-snug block opacity-85">
                {t("Research Hub", "研究中心")}
              </span>
            </div>
            <Button
              variant="ghost" size="icon"
              className="lg:hidden text-sidebar-primary-foreground hover:bg-black/10 ml-2 shrink-0 h-8 w-8"
              onClick={(e) => { e.preventDefault(); setIsSidebarOpen(false); }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              location={location}
              language={language}
              onNavigate={closeSidebarOnMobile}
              openMap={openMap}
              setOpenMap={setOpenMap}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border text-xs text-sidebar-foreground/35 px-5">
          {t("© 2025 ZJU ZIBS", "© 2025 浙大ZIBS")}
        </div>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Top Header ── */}
        <header className="h-14 flex items-center gap-3 px-4 sm:px-6 bg-card border-b border-border sticky top-0 z-40 shadow-sm">

          {/* LEFT — hamburger + breadcrumbs */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 shrink-0" onClick={() => setIsSidebarOpen(true)}>
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
                          <BreadcrumbPage className={cn(
                            "text-xs font-medium max-w-[160px] truncate",
                            isLast ? "text-foreground" : "text-muted-foreground",
                          )}>
                            {crumb.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={crumb.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate max-w-[120px]">
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
            <Button variant="ghost" size="sm"
              onClick={() => setLanguage(language === "en" ? "zh" : "en")}
              className="font-medium text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground">
              {language === "en" ? "中文" : "EN"}
            </Button>

            {/* Theme */}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={toggleTheme}
              title={theme === "light" ? t("Dark mode", "深色模式") : t("Light mode", "浅色模式")}>
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {/* ── Auth area ── */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 rounded-full border border-border hover:border-primary/40 p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52" align="end">
                  <DropdownMenuLabel className="font-normal pb-1.5">
                    <p className="text-sm font-semibold leading-none">{user.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-none">{user.email}</p>
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

                  <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2 cursor-pointer">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {zh ? "个人资料" : "My Profile"}
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => navigate("/my-contributions")} className="gap-2 cursor-pointer">
                    <BookMarked className="h-3.5 w-3.5 text-muted-foreground" />
                    {zh ? "我的贡献" : "My Contributions"}
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => navigate("/change-password")} className="gap-2 cursor-pointer">
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                    {zh ? "修改密码" : "Change Password"}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={logout} className="gap-2 text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="h-3.5 w-3.5" />
                    {zh ? "退出登录" : "Sign Out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => openAuth("login")}
                  className="h-8 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground hidden sm:flex">
                  <LogIn className="h-3.5 w-3.5" />
                  {t("Sign In", "登录")}
                </Button>
                <Button size="sm" onClick={() => openAuth("register")}
                  className="h-8 px-3 text-xs hidden sm:flex">
                  {t("Register", "注册")}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" onClick={() => openAuth("login")}>
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

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} initialView={authView} />
    </div>
  );
}
