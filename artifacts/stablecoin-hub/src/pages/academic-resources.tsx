import React, { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { 
  useListResources, 
  useCreateResource, 
  useExtractResource, 
  useDeleteResource, 
  useListTags,
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
  Wand2, Loader2, ExternalLink, Tags, FileText, Users
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
  
  const [activeView, setActiveView] = useState<"type" | "tags" | "experts">("type");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: resources, isLoading: resourcesLoading } = useListResources({
    resource_type: activeView === "type" && selectedType ? selectedType : undefined,
    tag: activeView === "tags" && selectedTag ? selectedTag : undefined,
    search: searchQuery || undefined,
  });

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
            {t("Academic Resources", "学术资源")}
          </h2>
          <p className="mt-2 text-muted-foreground max-w-3xl">
            {t(
              "Curated collection of papers, reports, and data sources on stablecoin economics and technology.", 
              "关于稳定币经济学和技术的论文、报告和数据源精选汇编。"
            )}
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Wand2 className="mr-2 h-4 w-4" />
              {t("Add via AI", "AI辅助添加")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("Add Resource", "添加资源")}</DialogTitle>
              <DialogDescription>
                {t("Use AI to extract metadata from a URL, DOI, or text, then review and save.", "使用AI从URL、DOI或文本中提取元数据，然后检查并保存。")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Extraction Section */}
              <Card className="border-secondary/20 shadow-none bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-secondary-foreground">
                    <Wand2 className="h-4 w-4" />
                    {t("Step 1: AI Extraction", "第一步：AI提取")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...extractForm}>
                    <form onSubmit={extractForm.handleSubmit(onExtractSubmit)} className="flex items-end gap-3">
                      <div className="flex-1 space-y-3">
                        <FormField
                          control={extractForm.control}
                          name="source_type"
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Source type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="url">URL</SelectItem>
                                  <SelectItem value="doi">DOI</SelectItem>
                                  <SelectItem value="text">Raw Text</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        {sourceType === "url" && (
                          <FormField control={extractForm.control} name="url" render={({ field }) => (
                            <FormItem><FormControl><Input placeholder="https://..." {...field} /></FormControl></FormItem>
                          )}/>
                        )}
                        {sourceType === "doi" && (
                          <FormField control={extractForm.control} name="doi" render={({ field }) => (
                            <FormItem><FormControl><Input placeholder="10.1000/xyz123" {...field} /></FormControl></FormItem>
                          )}/>
                        )}
                        {sourceType === "text" && (
                          <FormField control={extractForm.control} name="text" render={({ field }) => (
                            <FormItem><FormControl><Textarea placeholder="Paste abstract or citation text..." {...field} /></FormControl></FormItem>
                          )}/>
                        )}
                      </div>
                      <Button type="submit" variant="secondary" disabled={extractResource.isPending}>
                        {extractResource.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Extract", "提取")}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Resource Form Section */}
              <div className="pt-2">
                <h4 className="text-sm font-medium mb-3">{t("Step 2: Review & Save", "第二步：检查与保存")}</h4>
                <Form {...resourceForm}>
                  <form onSubmit={resourceForm.handleSubmit(onResourceSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={resourceForm.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>{t("Title", "标题")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                      )}/>
                      <FormField control={resourceForm.control} name="resource_type" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Type", "类型")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {RESOURCE_TYPES.map(type => (
                                <SelectItem key={type} value={type}>{type.replace("_", " ")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage/>
                        </FormItem>
                      )}/>
                    </div>

                    <FormField control={resourceForm.control} name="abstract" render={({ field }) => (
                      <FormItem><FormLabel>{t("Abstract", "摘要")}</FormLabel><FormControl><Textarea className="h-24" {...field} /></FormControl><FormMessage/></FormItem>
                    )}/>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={resourceForm.control} name="authors" render={({ field }) => (
                        <FormItem><FormLabel>{t("Authors (comma separated)", "作者 (逗号分隔)")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                      )}/>
                      <FormField control={resourceForm.control} name="tags" render={({ field }) => (
                        <FormItem><FormLabel>{t("Tags (comma separated)", "标签 (逗号分隔)")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                      )}/>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField control={resourceForm.control} name="url" render={({ field }) => (
                        <FormItem><FormLabel>URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                      )}/>
                      <FormField control={resourceForm.control} name="doi" render={({ field }) => (
                        <FormItem><FormLabel>DOI</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                      )}/>
                      <FormField control={resourceForm.control} name="published_date" render={({ field }) => (
                        <FormItem><FormLabel>{t("Date", "日期")}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage/></FormItem>
                      )}/>
                    </div>

                    <Button type="submit" disabled={createResource.isPending} className="w-full">
                      {createResource.isPending ? t("Saving...", "保存中...") : t("Save Resource", "保存资源")}
                    </Button>
                  </form>
                </Form>
              </div>
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

          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "type" | "tags" | "experts")} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="type">{t("Types", "分类")}</TabsTrigger>
              <TabsTrigger value="tags">{t("Tags", "标签")}</TabsTrigger>
              <TabsTrigger value="experts">
                <Users className="h-3 w-3 mr-1" />
                {t("Experts", "专家")}
              </TabsTrigger>
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

            <TabsContent value="experts" className="mt-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  {t("Browse all contributors in the resource library.", "浏览资源库中的所有作者。")}
                </p>
                <Link href="/experts">
                  <Button variant="outline" className="w-full justify-start text-primary border-primary/20 hover:bg-primary/5" data-testid="link-go-to-experts">
                    <Users className="mr-2 h-4 w-4" />
                    {t("View All Experts & Scholars", "查看全部专家学者")}
                  </Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Resource List */}
        <div className="flex-1 space-y-4">
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
      </div>
    </div>
  );
}
