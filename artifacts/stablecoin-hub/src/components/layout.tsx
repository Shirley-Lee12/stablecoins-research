import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";
import { AuthDialog } from "@/components/auth-dialog";
import { Button } from "@/components/ui/button";
import {
  BarChart, BookOpen, Globe, LayoutDashboard,
  LineChart, Menu, X, Sun, Moon, Home, Database,
  Microscope, LogOut, LogIn
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/", labelEn: "Overview", labelZh: "中心概览", icon: Home },
  { href: "/dashboard", labelEn: "Dashboard", labelZh: "数据仪表盘", icon: LayoutDashboard },
  { href: "/about-stablecoins", labelEn: "About Stablecoins", labelZh: "关于稳定币", icon: BookOpen },
  { href: "/research", labelEn: "Our Research", labelZh: "我们的研究", icon: Microscope },
  { href: "/academic-resources", labelEn: "Resources", labelZh: "资源库", icon: Database },
  { href: "/regulatory", labelEn: "Regulatory Status", labelZh: "监管现状", icon: Globe },
  { href: "/quantitative", labelEn: "Quantitative Indicators", labelZh: "量化指标", icon: BarChart },
  { href: "/market-data", labelEn: "Market Data", labelZh: "市场数据", icon: LineChart },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");

  const openAuth = (view: "login" | "register") => {
    setAuthView(view);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen flex bg-background font-sans text-foreground">
      {/* ── Sidebar ── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 ease-in-out border-r border-sidebar-border lg:static lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        {/* Brand header — links to overview */}
        <Link href="/" onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}>
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

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              (item.href === "/" && location === "/") ||
              (item.href !== "/" && (location === item.href || location.startsWith(item.href + "/"))) ||
              false;
            return (
              <Link key={item.href} href={item.href} onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium cursor-pointer",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  {t(item.labelEn, item.labelZh)}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
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
        {/* Top Navbar */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 bg-card border-b border-border sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <Link href="/">
              <h1 className="font-serif text-sm font-bold text-primary hidden sm:block cursor-pointer hover:opacity-75 transition-opacity">
                {t("ZIBS Stablecoins Research Hub", "浙大ZIBS稳定币研究中心")}
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language */}
            <Button variant="ghost" size="sm" onClick={() => setLanguage(language === "en" ? "zh" : "en")}
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
              <>
                {/* Sign out button — always visible when logged in */}
                <Button
                  variant="ghost" size="sm"
                  onClick={logout}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive gap-1.5 hidden sm:flex"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {t("Sign Out", "退出登录")}
                </Button>

                {/* Avatar dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 rounded-full border border-border hover:border-primary/30 p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-52" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <p className="text-sm font-semibold leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground mt-1">{user.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer gap-2">
                      <LogOut className="h-3.5 w-3.5" />
                      {t("Sign Out", "退出登录")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
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
                {/* mobile fallback */}
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
