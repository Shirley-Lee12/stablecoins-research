import React, { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { 
  useGetRegulatoryTimeline, 
  useGetRegulatoryCountryStats, 
  useListRegulatoryEntries,
  useCreateRegulatoryEntry,
  getListRegulatoryEntriesQueryKey,
  getGetRegulatoryTimelineQueryKey,
  getGetRegulatoryCountryStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Globe, Plus, Building2, MapPin, ExternalLink, Scale, Scale3d } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const entrySchema = z.object({
  country: z.string().min(1, "Country is required"),
  region: z.string().optional(),
  authority: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  title_zh: z.string().optional(),
  summary: z.string().optional(),
  summary_zh: z.string().optional(),
  document_url: z.string().url().optional().or(z.literal("")),
  effective_date: z.string().min(1, "Date is required"),
  category: z.string().optional(),
});

export default function Regulatory() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Queries
  const { data: timeline, isLoading: timelineLoading } = useGetRegulatoryTimeline({ lang: language });
  const { data: countryStats, isLoading: statsLoading } = useGetRegulatoryCountryStats();
  const entriesParams = { country: selectedCountry || undefined, lang: language };
  const { data: entries, isLoading: entriesLoading } = useListRegulatoryEntries(
    entriesParams,
    { query: { enabled: !!selectedCountry, queryKey: getListRegulatoryEntriesQueryKey(entriesParams) } }
  );

  const createEntry = useCreateRegulatoryEntry();

  const form = useForm<z.infer<typeof entrySchema>>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      country: "",
      region: "",
      authority: "",
      title: "",
      title_zh: "",
      summary: "",
      summary_zh: "",
      document_url: "",
      effective_date: format(new Date(), "yyyy-MM-dd"),
      category: "legislation",
    },
  });

  const onSubmit = (values: z.infer<typeof entrySchema>) => {
    createEntry.mutate({
      data: values
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRegulatoryTimelineQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRegulatoryCountryStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListRegulatoryEntriesQueryKey() });
        setIsAddDialogOpen(false);
        form.reset();
        toast({
          title: t("Success", "成功"),
          description: t("Regulatory entry added.", "监管条目添加成功。"),
        });
      },
      onError: () => {
        toast({
          title: t("Error", "错误"),
          description: t("Failed to add entry.", "添加条目失败。"),
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-primary tracking-tight">
            {t("Regulatory Status", "监管现状")}
          </h2>
          <p className="mt-2 text-muted-foreground max-w-3xl">
            {t(
              "Global timeline of stablecoin regulations, legislative frameworks, and central bank policies.", 
              "全球稳定币法规、立法框架和中央银行政策的时间表。"
            )}
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              {t("Add Entry", "添加条目")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("Add Regulatory Entry", "添加监管条目")}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>{t("Title (EN)", "标题 (英文)")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                  )}/>
                  <FormField control={form.control} name="title_zh" render={({ field }) => (
                    <FormItem><FormLabel>{t("Title (ZH)", "标题 (中文)")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                  )}/>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem><FormLabel>{t("Country", "国家/地区")}</FormLabel><FormControl><Input {...field} placeholder="e.g. USA, EU, China" /></FormControl><FormMessage/></FormItem>
                  )}/>
                  <FormField control={form.control} name="region" render={({ field }) => (
                    <FormItem><FormLabel>{t("Region/State", "州/省 (可选)")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                  )}/>
                  <FormField control={form.control} name="effective_date" render={({ field }) => (
                    <FormItem><FormLabel>{t("Effective Date", "生效日期")}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage/></FormItem>
                  )}/>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="authority" render={({ field }) => (
                    <FormItem><FormLabel>{t("Regulatory Authority", "监管机构")}</FormLabel><FormControl><Input {...field} placeholder="e.g. SEC, ECB, PBOC" /></FormControl><FormMessage/></FormItem>
                  )}/>
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>{t("Category", "类别")}</FormLabel><FormControl><Input {...field} placeholder="legislation, guidance, warning..." /></FormControl><FormMessage/></FormItem>
                  )}/>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="summary" render={({ field }) => (
                    <FormItem><FormLabel>{t("Summary (EN)", "摘要 (英文)")}</FormLabel><FormControl><Textarea className="h-24" {...field} /></FormControl><FormMessage/></FormItem>
                  )}/>
                  <FormField control={form.control} name="summary_zh" render={({ field }) => (
                    <FormItem><FormLabel>{t("Summary (ZH)", "摘要 (中文)")}</FormLabel><FormControl><Textarea className="h-24" {...field} /></FormControl><FormMessage/></FormItem>
                  )}/>
                </div>

                <FormField control={form.control} name="document_url" render={({ field }) => (
                  <FormItem><FormLabel>{t("Official Document URL", "官方文件链接")}</FormLabel><FormControl><Input type="url" placeholder="https://..." {...field} /></FormControl><FormMessage/></FormItem>
                )}/>

                <Button type="submit" disabled={createEntry.isPending} className="w-full">
                  {createEntry.isPending ? t("Saving...", "保存中...") : t("Save Entry", "保存条目")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar: Country Breakdown */}
        <div className="w-full md:w-64 shrink-0 space-y-4">
          <Card className="shadow-sm bg-muted/20 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Globe className="h-4 w-4 mr-2 text-primary" /> 
                {t("Jurisdictions", "管辖区")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <div className="space-y-1">
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-between font-normal ${selectedCountry === "" ? "bg-primary/10 text-primary font-medium" : ""}`}
                    onClick={() => setSelectedCountry("")}
                  >
                    <span>{t("Global Timeline", "全球时间线")}</span>
                  </Button>
                  {countryStats?.map((stat) => (
                    <Button 
                      key={stat.country}
                      variant="ghost" 
                      className={`w-full justify-between font-normal ${selectedCountry === stat.country ? "bg-primary/10 text-primary font-medium" : ""}`}
                      onClick={() => setSelectedCountry(stat.country)}
                    >
                      <span className="truncate">{stat.country}</span>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{stat.count}</span>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Timeline or Country Filtered List */}
        <div className="flex-1">
          {selectedCountry ? (
            // Filtered view
            <div className="space-y-6">
              <h3 className="text-2xl font-serif text-primary border-b border-border pb-2 flex items-center gap-2">
                <MapPin className="h-6 w-6" /> {selectedCountry} {t("Regulations", "法规")}
              </h3>
              
              {entriesLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : entries?.length ? (
                <div className="space-y-4">
                  {entries.map(entry => (
                    <Card key={entry.id} className="shadow-sm border-l-4 border-l-primary hover-elevate">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1 font-medium tracking-wide uppercase flex items-center gap-2">
                              {format(new Date(entry.effective_date), "MMMM d, yyyy")}
                              {entry.category && <span className="text-secondary bg-secondary/10 px-2 rounded-sm">{entry.category}</span>}
                            </div>
                            <CardTitle className="text-lg">
                              {language === 'zh' && entry.title_zh ? entry.title_zh : entry.title}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {language === 'zh' && entry.summary_zh ? entry.summary_zh : entry.summary}
                        </p>
                        {entry.authority && (
                          <div className="mt-3 flex items-center text-xs text-foreground font-medium bg-muted/50 w-fit px-2 py-1 rounded">
                            <Building2 className="h-3 w-3 mr-1 text-primary" /> {entry.authority}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p>{t("No entries found.", "未找到条目。")}</p>
              )}
            </div>
          ) : (
            // Timeline View
            <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {timelineLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : timeline?.length ? (
                timeline.map((yearGroup) => (
                  <div key={yearGroup.year} className="relative is-active">
                    <div className="flex items-center justify-center mb-8">
                      <span className="relative z-10 font-serif font-bold text-xl bg-background border-2 border-primary/20 text-primary px-6 py-1 rounded-full shadow-sm">
                        {yearGroup.year}
                      </span>
                    </div>
                    
                    <div className="space-y-8">
                      {yearGroup.entries.map((entry, idx) => {
                        const isEven = idx % 2 === 0;
                        return (
                          <div key={entry.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
                            {/* Icon marker */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-secondary text-secondary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                              <Scale className="h-4 w-4" />
                            </div>
                            
                            {/* Card */}
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-border bg-card shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-muted-foreground uppercase">
                                  {format(new Date(entry.effective_date), "MMM d")}
                                </span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  {entry.country}
                                </span>
                              </div>
                              <h4 className="text-base font-bold text-foreground mb-2">
                                {language === 'zh' && entry.title_zh ? entry.title_zh : entry.title}
                              </h4>
                              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                                {language === 'zh' && entry.summary_zh ? entry.summary_zh : entry.summary}
                              </p>
                              
                              <div className="flex items-center justify-between mt-auto">
                                <div className="text-xs font-medium text-foreground/80 flex items-center gap-1">
                                  {entry.authority && <><Building2 className="h-3 w-3" /> {entry.authority}</>}
                                </div>
                                {entry.document_url && (
                                  <a href={entry.document_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center">
                                    {t("Source", "来源")} <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 relative z-10 bg-background/80 backdrop-blur-sm">
                  {t("No timeline data available.", "没有时间线数据。")}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
