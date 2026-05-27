import React, { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { 
  useListResources, 
  useCreateResource, 
  useExtractResource, 
  useDeleteResource, 
  useListTags,
  useListAuthors,
  getListResourcesQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { 
  BookOpen, Link as LinkIcon, Trash2, Calendar, Search, 
  Wand2, Loader2, ExternalLink, Tags, FileText, Users, Building2, Plus, X as XIcon, CheckCircle2, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RESOURCE_TYPES = [
  "paper", "report", "news", "government_doc", "blog", "publication", "forum", "video"
];

const extractSchema = z.object({
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  doi: z.string().optional(),
  text: z.string().optional(),
  source_type: z.enum(["url", "doi", "text"]),
});

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  title_zh: z.string().optional(),
  abstract: z.string().optional(),
  abstract_zh: z.string().optional(),
  authors: z.string().optional(),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  doi: z.string().optional(),
  resource_type: z.string().min(1, "Type is required"),
  tags: z.string().optional(),
  published_date: z.string().optional(),
  journal: z.string().optional(),
});

export default function AcademicResources() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [activeView, setActiveView] = useState<"type" | "tags">("type");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<"url" | "doi" | "manual">("url");
  const [bulkInput, setBulkInput] = useState("");
  const [manualRows, setManualRows] = useState<{ title: string; authors: string; year: string; type: string }[]>([
    { title: "", authors: "", year: "", type: "paper" },
  ]);
  const [batchProgress, setBatchProgress] = useState<{ total: number; done: number; errors: string[] } | null>(null);

  const isExpertsSelected = activeView === "type" && selectedType === "__experts__";

  const { data: resources, isLoading: resourcesLoading } = useListResources({
    resource_type: activeView === "type" && selectedType && !isExpertsSelected ? selectedType : undefined,
    tag: activeView === "tags" && selectedTag ? selectedTag : undefined,
    search: !isExpertsSelected ? searchQuery || undefined : undefined,
  });

  const { data: authors, isLoading: authorsLoading } = useListAuthors(
    { search: isExpertsSelected && searchQuery ? searchQuery : undefined }
  );

  const { data: tags } = useListTags();
  
  const createResource = useCreateResource();
  const extractResource = useExtractResource();
  const deleteResource = useDeleteResource();

  const extractForm = useForm<z.infer<typeof extractSchema>>({
    resolver: zodResolver(extractSchema),
    defaultValues: {
      source_type: "url",
      url: "",
      doi: "",
      text: "",
    },
  });

  const resourceForm = useForm<z.infer<typeof resourceSchema>>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      title_zh: "",
      abstract: "",
      abstract_zh: "",
      authors: "",
      url: "",
      doi: "",
      resource_type: "paper",
      tags: "",
      published_date: format(new Date(), "yyyy-MM-dd"),
      journal: "",
    },
  });

  const onExtractSubmit = (values: z.infer<typeof extractSchema>) => {
    extractResource.mutate({
      data: {
        source_type: values.source_type as any,
        url: values.url,
        doi: values.doi,
        text: values.text,
      }
    }, {
      onSuccess: (data) => {
        toast({
          title: t("Extraction Complete", "提取完成"),
          description: t("Resource details have been pre-filled.", "资源详情已预填。"),
        });
        
        resourceForm.reset({
          ...resourceForm.getValues(),
          title: data.title || "",
          abstract: data.abstract || "",
          authors: data.authors ? data.authors.join(", ") : "",
          tags: data.keywords ? data.keywords.join(", ") : "",
          published_date: data.published_date || format(new Date(), "yyyy-MM-dd"),
          journal: data.journal || "",
          doi: data.doi || values.doi || "",
          url: values.url || "",
        });
      },
      onError: () => {
        toast({
          title: t("Extraction Failed", "提取失败"),
          description: t("Could not extract data from the provided source.", "无法从提供的来源提取数据。"),
          variant: "destructive",
        });
      }
    });
  };

  const onResourceSubmit = (values: z.infer<typeof resourceSchema>) => {
    createResource.mutate({
      data: {
        ...values,
        authors: values.authors ? values.authors.split(",").map(a => a.trim()).filter(Boolean) : [],
        tags: values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
        setIsAddDialogOpen(false);
        resourceForm.reset();
        extractForm.reset();
        toast({
          title: t("Success", "成功"),
          description: t("Resource added successfully.", "资源添加成功。"),
        });
      },
      onError: () => {
        toast({
          title: t("Error", "错误"),
          description: t("Failed to add resource.", "添加资源失败。"),
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm(t("Are you sure you want to delete this resource?", "您确定要删除这个资源吗？"))) {
      deleteResource.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
          toast({
            title: t("Success", "成功"),
            description: t("Resource deleted successfully.", "资源删除成功。"),
          });
        }
      });
    }
  };

  const sourceType = extractForm.watch("source_type");

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-primary tracking-tight">
            {t("Resources", "资源")}
          </h2>
          <p className="mt-2 text-muted-foreground max-w-3xl">
            {t(
              "Curated collection of papers, reports, and data sources on stablecoin economics and technology.", 
              "关于稳定币经济学和技术的论文、报告和数据源精选汇编。"
            )}
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) { setBulkInput(""); setBatchProgress(null); setManualRows([{ title: "", authors: "", year: "", type: "paper" }]); }
        }}>
          <DialogTrigger asChild>
            <Button className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              {t("Add Resources", "添加资源")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("Batch Add Resources", "批量添加资源")}</DialogTitle>
              <DialogDescription>
                {t("Add multiple resources at once by URL, DOI, or manual entry.", "通过 URL、DOI 或手动输入批量添加资源。")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Mode selector */}
              <div className="flex rounded-md border border-border overflow-hidden">
                {(["url", "doi", "manual"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { setBulkMode(mode); setBulkInput(""); setBatchProgress(null); }}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${bulkMode === mode ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted"}`}
                  >
                    {mode === "url" ? "URL" : mode === "doi" ? "DOI" : t("Manual", "手动")}
                  </button>
                ))}
              </div>

              {/* URL mode */}
              {bulkMode === "url" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">{t("Paste one URL per line. AI will extract metadata for each.", "每行粘贴一个 URL，AI 将自动提取每条资源的元数据。")}</p>
                  <Textarea
                    className="h-40 font-mono text-sm"
                    placeholder={"https://example.com/paper1\nhttps://example.com/paper2"}
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    disabled={!!batchProgress && batchProgress.done < batchProgress.total}
                  />
                  {batchProgress && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        {batchProgress.done < batchProgress.total
                          ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        <span>{t(`Processing ${batchProgress.done}/${batchProgress.total}`, `处理中 ${batchProgress.done}/${batchProgress.total}`)}</span>
                      </div>
                      {batchProgress.errors.length > 0 && (
                        <div className="text-xs text-destructive space-y-0.5">
                          {batchProgress.errors.map((e, i) => <div key={i} className="flex gap-1"><AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />{e}</div>)}
                        </div>
                      )}
                    </div>
                  )}
                  <Button
                    className="w-full"
                    disabled={!bulkInput.trim() || (!!batchProgress && batchProgress.done < batchProgress.total)}
                    onClick={async () => {
                      const urls = bulkInput.split("\n").map(u => u.trim()).filter(Boolean);
                      setBatchProgress({ total: urls.length, done: 0, errors: [] });
                      const errors: string[] = [];
                      for (let i = 0; i < urls.length; i++) {
                        try {
                          const extracted = await extractResource.mutateAsync({ data: { source_type: "url", url: urls[i] } });
                          await createResource.mutateAsync({ data: {
                            title: extracted.title || urls[i],
                            abstract: extracted.abstract ?? undefined,
                            authors: extracted.authors ?? [],
                            tags: extracted.keywords ?? [],
                            url: urls[i],
                            doi: extracted.doi ?? undefined,
                            published_date: extracted.published_date ?? undefined,
                            journal: extracted.journal ?? undefined,
                            resource_type: "paper",
                          }});
                        } catch {
                          errors.push(urls[i]);
                        }
                        setBatchProgress({ total: urls.length, done: i + 1, errors: [...errors] });
                      }
                      queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
                      if (errors.length === 0) {
                        toast({ title: t("Done", "完成"), description: t(`Added ${urls.length} resource(s).`, `已添加 ${urls.length} 条资源。`) });
                        setIsAddDialogOpen(false);
                        setBulkInput(""); setBatchProgress(null);
                      }
                    }}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    {t("Extract & Add All", "提取并全部添加")}
                  </Button>
                </div>
              )}

              {/* DOI mode */}
              {bulkMode === "doi" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">{t("Paste one DOI per line. AI will extract metadata for each.", "每行粘贴一个 DOI，AI 将自动提取每条资源的元数据。")}</p>
                  <Textarea
                    className="h-40 font-mono text-sm"
                    placeholder={"10.1000/xyz123\n10.2000/abc456"}
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    disabled={!!batchProgress && batchProgress.done < batchProgress.total}
                  />
                  {batchProgress && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        {batchProgress.done < batchProgress.total
                          ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        <span>{t(`Processing ${batchProgress.done}/${batchProgress.total}`, `处理中 ${batchProgress.done}/${batchProgress.total}`)}</span>
                      </div>
                      {batchProgress.errors.length > 0 && (
                        <div className="text-xs text-destructive space-y-0.5">
                          {batchProgress.errors.map((e, i) => <div key={i} className="flex gap-1"><AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />{e}</div>)}
                        </div>
                      )}
                    </div>
                  )}
                  <Button
                    className="w-full"
                    disabled={!bulkInput.trim() || (!!batchProgress && batchProgress.done < batchProgress.total)}
                    onClick={async () => {
                      const dois = bulkInput.split("\n").map(d => d.trim()).filter(Boolean);
                      setBatchProgress({ total: dois.length, done: 0, errors: [] });
                      const errors: string[] = [];
                      for (let i = 0; i < dois.length; i++) {
                        try {
                          const extracted = await extractResource.mutateAsync({ data: { source_type: "doi", doi: dois[i] } });
                          await createResource.mutateAsync({ data: {
                            title: extracted.title || dois[i],
                            abstract: extracted.abstract ?? undefined,
                            authors: extracted.authors ?? [],
                            tags: extracted.keywords ?? [],
                            doi: dois[i],
                            published_date: extracted.published_date ?? undefined,
                            journal: extracted.journal ?? undefined,
                            resource_type: "paper",
                          }});
                        } catch {
                          errors.push(dois[i]);
                        }
                        setBatchProgress({ total: dois.length, done: i + 1, errors: [...errors] });
                      }
                      queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
                      if (errors.length === 0) {
                        toast({ title: t("Done", "完成"), description: t(`Added ${dois.length} resource(s).`, `已添加 ${dois.length} 条资源。`) });
                        setIsAddDialogOpen(false);
                        setBulkInput(""); setBatchProgress(null);
                      }
                    }}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    {t("Extract & Add All", "提取并全部添加")}
                  </Button>
                </div>
              )}

              {/* Manual mode */}
              {bulkMode === "manual" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">{t("Fill in title, authors, and year for each resource.", "为每条资源填写标题、作者和年份。")}</p>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {manualRows.map((row, i) => (
                      <div key={i} className="grid grid-cols-[1fr_auto] gap-2 items-start border border-border rounded-md p-3 bg-muted/20">
                        <div className="space-y-2">
                          <Input
                            placeholder={t("Title (required)", "标题（必填）")}
                            value={row.title}
                            onChange={(e) => setManualRows(rows => rows.map((r, j) => j === i ? { ...r, title: e.target.value } : r))}
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              placeholder={t("Authors", "作者")}
                              value={row.authors}
                              onChange={(e) => setManualRows(rows => rows.map((r, j) => j === i ? { ...r, authors: e.target.value } : r))}
                              className="col-span-1"
                            />
                            <Input
                              placeholder={t("Year", "年份")}
                              value={row.year}
                              onChange={(e) => setManualRows(rows => rows.map((r, j) => j === i ? { ...r, year: e.target.value } : r))}
                              className="col-span-1"
                            />
                            <select
                              value={row.type}
                              onChange={(e) => setManualRows(rows => rows.map((r, j) => j === i ? { ...r, type: e.target.value } : r))}
                              className="col-span-1 border border-input bg-background text-sm rounded-md px-2 h-10"
                            >
                              {RESOURCE_TYPES.map(rt => <option key={rt} value={rt}>{rt.replace("_", " ")}</option>)}
                            </select>
                          </div>
                        </div>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 mt-1 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => setManualRows(rows => rows.filter((_, j) => j !== i))}
                          disabled={manualRows.length === 1}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setManualRows(rows => [...rows, { title: "", authors: "", year: "", type: "paper" }])}>
                    <Plus className="mr-2 h-4 w-4" /> {t("Add Row", "添加一行")}
                  </Button>
                  {batchProgress && (
                    <div className="flex items-center gap-2 text-sm">
                      {batchProgress.done < batchProgress.total
                        ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      <span>{t(`Saving ${batchProgress.done}/${batchProgress.total}`, `保存中 ${batchProgress.done}/${batchProgress.total}`)}</span>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    disabled={manualRows.every(r => !r.title.trim()) || (!!batchProgress && batchProgress.done < batchProgress.total)}
                    onClick={async () => {
                      const validRows = manualRows.filter(r => r.title.trim());
                      setBatchProgress({ total: validRows.length, done: 0, errors: [] });
                      for (let i = 0; i < validRows.length; i++) {
                        const row = validRows[i];
                        try {
                          await createResource.mutateAsync({ data: {
                            title: row.title.trim(),
                            authors: row.authors ? row.authors.split(",").map(a => a.trim()).filter(Boolean) : [],
                            published_date: row.year ? `${row.year}-01-01` : undefined,
                            resource_type: row.type,
                            tags: [],
                          }});
                        } catch {}
                        setBatchProgress({ total: validRows.length, done: i + 1, errors: [] });
                      }
                      queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
                      toast({ title: t("Done", "完成"), description: t(`Added ${validRows.length} resource(s).`, `已添加 ${validRows.length} 条资源。`) });
                      setIsAddDialogOpen(false);
                      setManualRows([{ title: "", authors: "", year: "", type: "paper" }]);
                      setBatchProgress(null);
                    }}
                  >
                    {t("Save All", "全部保存")}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 shrink-0 space-y-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder={t("Search...", "搜索...")} 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "type" | "tags")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="type">{t("Types", "分类")}</TabsTrigger>
              <TabsTrigger value="tags">{t("Tags", "标签")}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="type" className="mt-4 space-y-1">
              <Button 
                variant="ghost" 
                className={`w-full justify-start font-normal ${selectedType === "" ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => setSelectedType("")}
              >
                <BookOpen className="mr-2 h-4 w-4" /> {t("All Types", "所有类型")}
              </Button>
              {RESOURCE_TYPES.map((type) => (
                <Button 
                  key={type}
                  variant="ghost" 
                  className={`w-full justify-start font-normal capitalize ${selectedType === type ? "bg-primary/10 text-primary" : ""}`}
                  onClick={() => setSelectedType(type)}
                >
                  <FileText className="mr-2 h-4 w-4 opacity-70" /> {type.replace("_", " ")}
                </Button>
              ))}
              <div className="my-1 border-t border-border" />
              <Button
                variant="ghost"
                className={`w-full justify-start font-normal ${selectedType === "__experts__" ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => setSelectedType("__experts__")}
                data-testid="button-type-experts"
              >
                <Users className="mr-2 h-4 w-4 opacity-70" /> {t("Experts / Scholars", "专家学者")}
              </Button>
            </TabsContent>
            
            <TabsContent value="tags" className="mt-4">
              <div className="flex flex-wrap gap-2">
                <span 
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors ${selectedTag === "" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  onClick={() => setSelectedTag("")}
                >
                  {t("All Tags", "所有标签")}
                </span>
                {tags?.map((tag) => (
                  <span 
                    key={tag.name}
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors ${selectedTag === tag.name ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                    onClick={() => setSelectedTag(tag.name)}
                  >
                    {language === 'zh' && tag.name_zh ? tag.name_zh : tag.name} ({tag.count})
                  </span>
                ))}
              </div>
            </TabsContent>

          </Tabs>
        </div>

        {/* Resource List / Author Grid */}
        <div className="flex-1">
          {isExpertsSelected ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {authorsLoading ? "" : `${authors?.length ?? 0} ${t("contributors found", "位作者")}`}
              </p>
              {authorsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="shadow-sm">
                      <CardContent className="pt-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : !authors?.length ? (
                <div className="py-12 text-center border-2 border-dashed border-border rounded-lg bg-muted/20">
                  <Users className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <h3 className="text-lg font-medium text-foreground">{t("No authors found", "未找到作者")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("Add resources with author names to see them here.", "添加带有作者姓名的资源以在此处显示。")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {authors.map((author) => (
                    <Link key={author.name} href={`/authors/${encodeURIComponent(author.name)}`}>
                      <Card
                        className="shadow-sm hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group h-full"
                        data-testid={`card-author-inline-${author.name}`}
                      >
                        <CardContent className="pt-5 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 w-12 h-12 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                              <span className="text-lg font-serif font-bold text-primary">
                                {author.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {author.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {author.resource_count} {t("resource(s)", "篇资源")}
                              </p>
                            </div>
                          </div>
                          {author.institution ? (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3 shrink-0 opacity-70" />
                              <span className="truncate">{author.institution}</span>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground/40 italic">
                              {t("Institution not set", "机构未设置")}
                            </div>
                          )}
                          {author.top_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {author.top_tags.slice(0, 4).map((tag) => (
                                <span key={tag} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {!isExpertsSelected && (
          <div className="space-y-4">
          {resourcesLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          ) : resources?.length ? (
            resources.map((resource) => {
              const title = language === 'zh' && resource.title_zh ? resource.title_zh : resource.title;
              const abstract = language === 'zh' && resource.abstract_zh ? resource.abstract_zh : resource.abstract;

              return (
                <Card key={resource.id} className="shadow-sm hover:border-primary/20 hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                            {resource.resource_type.replace("_", " ")}
                          </span>
                          {resource.published_date && (
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(resource.published_date), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-lg leading-tight group">
                          {resource.url ? (
                            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-start gap-2">
                              {title}
                              <ExternalLink className="h-4 w-4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          ) : title}
                        </CardTitle>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(resource.id)} className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {resource.authors && resource.authors.length > 0 && (
                      <CardDescription className="text-foreground/80 mt-1">
                        {resource.authors.map((author, idx) => (
                          <span key={author}>
                            <Link
                              href={`/authors/${encodeURIComponent(author)}`}
                              className="hover:text-primary hover:underline transition-colors cursor-pointer"
                              data-testid={`link-author-${author}-${resource.id}`}
                            >
                              {author}
                            </Link>
                            {idx < (resource.authors?.length ?? 0) - 1 && ", "}
                          </span>
                        ))}
                        {resource.journal && <span className="italic"> — {resource.journal}</span>}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {abstract && (
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                        {abstract}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap gap-2">
                        {resource.tags?.map((tag, idx) => (
                          <span key={idx} className="inline-flex items-center text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                      {resource.doi && (
                        <div className="text-xs text-muted-foreground flex items-center">
                          <LinkIcon className="h-3 w-3 mr-1" />
                          DOI: {resource.doi}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-border rounded-lg bg-muted/20">
              <Search className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-medium text-foreground">{t("No resources found", "未找到资源")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("Try adjusting your filters or search query.", "尝试调整过滤器或搜索查询。")}
              </p>
            </div>
          )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
