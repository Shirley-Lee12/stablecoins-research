import React, { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { BookOpen, Video, FileText, Newspaper, GraduationCap, MonitorPlay } from "lucide-react";

const SUBTABS = [
  { id: "general", en: "General Knowledge", zh: "基础知识", icon: BookOpen },
  { id: "videos", en: "Videos", zh: "视频资料", icon: Video },
  { id: "reports", en: "Reports", zh: "行业报告", icon: FileText },
  { id: "news", en: "News", zh: "新闻动态", icon: Newspaper },
  { id: "courses", en: "Courses", zh: "课程", icon: GraduationCap },
  { id: "webinars", en: "Webinars", zh: "研讨会", icon: MonitorPlay },
];

export default function About() {
  const { t } = useLanguage();
  const [location] = useLocation();
  
  // Try to get tab from query params or use default
  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get("tab") || "general";
  
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL without reloading
    const newUrl = `${location}?tab=${value}`;
    window.history.pushState({}, '', newUrl);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="border-b border-border pb-6">
        <h2 className="text-3xl font-serif font-bold text-primary tracking-tight">
          {t("About Stablecoins", "关于稳定币")}
        </h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          {t(
            "A comprehensive knowledge base covering the fundamentals, history, mechanics, and future of stablecoins in the global financial ecosystem.", 
            "一个全面的知识库，涵盖稳定币在全球金融生态系统中的基础知识、发展历史、运作机制和未来展望。"
          )}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-auto p-1 bg-muted/50 w-max min-w-full justify-start sm:w-auto">
            {SUBTABS.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm py-2 px-4 flex items-center gap-2"
              >
                <tab.icon className="h-4 w-4" />
                {t(tab.en, tab.zh)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-6">
          {SUBTABS.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="animate-in fade-in-50 duration-500">
              <Card className="border-border shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md text-primary">
                      <tab.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-serif">{t(tab.en, tab.zh)}</CardTitle>
                      <CardDescription className="mt-1">
                        {t(`Curated ${tab.en.toLowerCase()} resources`, `精选${tab.zh}资源`)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
                  <tab.icon className="h-12 w-12 opacity-10 mb-4" />
                  <p className="text-lg font-medium text-foreground/70 mb-2">
                    {t("Content curating in progress", "内容正在整理中")}
                  </p>
                  <p className="max-w-md mx-auto text-sm">
                    {t(
                      `We are currently compiling high-quality ${tab.en.toLowerCase()} from global academic and industry sources. Check back soon.`,
                      `我们正在从全球学术和行业来源汇编高质量的${tab.zh}。敬请期待。`
                    )}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
