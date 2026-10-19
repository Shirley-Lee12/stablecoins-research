import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
export default function NotFound(){
 const {t}=useLanguage();
 return <div className="min-h-screen w-full flex items-center justify-center bg-background"><Card className="w-full max-w-md mx-4"><CardContent className="pt-6"><div className="flex mb-4 gap-2"><AlertCircle className="h-8 w-8 text-destructive"/><h1 className="text-2xl font-bold text-foreground">404 {t("Page not found","页面未找到")}</h1></div><p className="mt-4 text-sm text-muted-foreground">{t("This page is unavailable. Choose a destination below.","此页面不可用，请选择下方入口继续浏览。")}</p><div className="mt-5 flex flex-wrap gap-4 text-sm text-primary"><Link href="/">{t("Home","首页")}</Link><Link href="/academic-resources">{t("Research resources","研究资源库")}</Link></div></CardContent></Card></div>;
}
