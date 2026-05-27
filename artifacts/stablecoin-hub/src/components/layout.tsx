import React from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  BookOpen, 
  FileText, 
  Globe, 
  LayoutDashboard, 
  LineChart,
  Menu,
  Users,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/", labelEn: "Dashboard", labelZh: "仪表盘", icon: LayoutDashboard },
  { href: "/about-stablecoins", labelEn: "About Stablecoins", labelZh: "关于稳定币", icon: BookOpen },
  { href: "/research", labelEn: "Our Research", labelZh: "我们的研究", icon: FileText },
  { href: "/academic-resources", labelEn: "Resources", labelZh: "资源", icon: BookOpen },
  { href: "/experts", labelEn: "Experts & Scholars", labelZh: "专家学者", icon: Users },
  { href: "/regulatory", labelEn: "Regulatory Status", labelZh: "监管现状", icon: Globe },
  { href: "/quantitative", labelEn: "Quantitative Indicators", labelZh: "量化指标", icon: BarChart },
  { href: "/market-data", labelEn: "Market Data", labelZh: "市场数据", icon: LineChart },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "zh" : "en");
  };

  return (
    <div className="min-h-screen flex bg-background font-sans text-foreground">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out border-r border-sidebar-border lg:static lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground">
          <span className="font-serif font-bold text-lg leading-tight line-clamp-2">
            {t("ZIBS Stablecoins", "浙江大学ZIBS")}<br/>
            {t("Research Hub", "稳定币研究中心")}
          </span>
          <Button variant="ghost" size="icon" className="lg:hidden text-sidebar-primary-foreground hover:bg-sidebar-accent" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || 
            (location.startsWith(item.href) && item.href !== "/") ||
            (item.href === "/experts" && location.startsWith("/authors/"));
            return (
              <Link key={item.href} href={item.href} onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium cursor-pointer",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}>
                  <item.icon className="h-4 w-4" />
                  {t(item.labelEn, item.labelZh)}
                </div>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-card border-b border-card-border sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-serif text-xl font-bold text-primary hidden sm:block">
              {t("ZIBS Stablecoins Research Hub", "浙江大学ZIBS稳定币研究中心")}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleLanguage}
              className="font-medium text-xs rounded-full px-3 h-8 border-primary/20 text-primary hover:bg-primary/5"
            >
              {language === "en" ? "中文" : "EN"}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full border border-primary/10">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/5 text-primary text-xs">U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{t("Guest User", "访客用户")}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      guest@zju.edu.cn
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  {t("Login", "登录")}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  {t("Register", "注册")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  {t("About Us", "关于我们")}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  {t("Contact Us", "联系我们")}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  {t("User Guide", "用户指南")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
