import React, { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { useListResearchPapers, useCreateResearchPaper, useDeleteResearchPaper, getListResearchPapersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
import { FileText, Download, Plus, Trash2, Calendar, Users, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  title_zh: z.string().optional(),
  abstract: z.string().min(1, "Abstract is required"),
  abstract_zh: z.string().optional(),
  authors: z.string().min(1, "Authors are required"),
  key_innovations: z.string().optional(),
  key_innovations_zh: z.string().optional(),
  published_date: z.string().optional(),
  pdf_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  keywords: z.string().optional(),
});

export default function Research() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: papers, isLoading } = useListResearchPapers();
  const createPaper = useCreateResearchPaper();
  const deletePaper = useDeleteResearchPaper();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      title_zh: "",
      abstract: "",
      abstract_zh: "",
      authors: "",
      key_innovations: "",
      key_innovations_zh: "",
      published_date: format(new Date(), "yyyy-MM-dd"),
      pdf_url: "",
      keywords: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createPaper.mutate({
      data: {
        title: values.title,
        title_zh: values.title_zh,
        abstract: values.abstract,
        abstract_zh: values.abstract_zh,
        authors: values.authors.split(",").map(a => a.trim()).filter(Boolean),
        key_innovations: values.key_innovations ? values.key_innovations.split(";").map(i => i.trim()).filter(Boolean) : [],
        key_innovations_zh: values.key_innovations_zh ? values.key_innovations_zh.split(";").map(i => i.trim()).filter(Boolean) : [],
        published_date: values.published_date,
        pdf_url: values.pdf_url,
        keywords: values.keywords ? values.keywords.split(",").map(k => k.trim()).filter(Boolean) : [],
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListResearchPapersQueryKey() });
        setIsDialogOpen(false);
        form.reset();
        toast({
          title: t("Success", "成功"),
          description: t("Research paper added successfully.", "研究论文添加成功。"),
        });
      },
      onError: (error) => {
        toast({
          title: t("Error", "错误"),
          description: t("Failed to add research paper.", "添加研究论文失败。"),
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm(t("Are you sure you want to delete this paper?", "您确定要删除这篇论文吗？"))) {
      deletePaper.mutate({ params: { id } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListResearchPapersQueryKey() });
          toast({
            title: t("Success", "成功"),
            description: t("Research paper deleted successfully.", "研究论文删除成功。"),
          });
        }
      });
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-primary tracking-tight">
            {t("Our Research", "我们的研究")}
          </h2>
          <p className="mt-2 text-muted-foreground max-w-3xl">
            {t(
              "Original research, whitepapers, and academic publications by the ZIBS Stablecoins Research Hub.", 
              "浙江大学ZIBS稳定币研究中心的原创研究、白皮书和学术出版物。"
            )}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              {t("Add Paper", "添加论文")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("Add Research Paper", "添加研究论文")}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Title (EN)", "标题 (英文)")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title_zh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Title (ZH)", "标题 (中文)")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="authors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Authors (comma separated)", "作者 (逗号分隔)")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe, Jane Smith" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="abstract"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Abstract (EN)", "摘要 (英文)")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="h-32" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="abstract_zh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Abstract (ZH)", "摘要 (中文)")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="h-32" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="key_innovations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Key Innovations (EN, semicolon separated)", "核心创新点 (英文, 分号分隔)")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="key_innovations_zh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Key Innovations (ZH, semicolon separated)", "核心创新点 (中文, 分号分隔)")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="published_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Published Date", "发布日期")}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pdf_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("PDF URL", "PDF链接")}</FormLabel>
                        <FormControl>
                          <Input type="url" {...field} placeholder="https://..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Keywords (comma separated)", "关键词 (逗号分隔)")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={createPaper.isPending} className="w-full">
                  {createPaper.isPending ? t("Saving...", "保存中...") : t("Save Paper", "保存论文")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : papers?.length ? (
          papers.map((paper) => {
            const title = language === 'zh' && paper.title_zh ? paper.title_zh : paper.title;
            const abstract = language === 'zh' && paper.abstract_zh ? paper.abstract_zh : paper.abstract;
            const innovations = language === 'zh' && paper.key_innovations_zh && paper.key_innovations_zh.length > 0 
              ? paper.key_innovations_zh 
              : paper.key_innovations;

            return (
              <Card key={paper.id} className="shadow-sm border-primary/10 hover-elevate transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-xl font-serif text-primary leading-tight">
                      {title}
                    </CardTitle>
                    <div className="flex items-center gap-2 shrink-0">
                      {paper.pdf_url && (
                        <Button variant="outline" size="sm" asChild className="h-8 border-primary/20 text-primary hover:bg-primary/5">
                          <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            {t("PDF", "PDF文件")}
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(paper.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mt-2">
                    <span className="flex items-center text-foreground font-medium">
                      <Users className="h-4 w-4 mr-1.5 text-muted-foreground" />
                      {paper.authors?.join(", ") || t("Unknown authors", "未知作者")}
                    </span>
                    {paper.published_date && (
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5 text-muted-foreground" />
                        {format(new Date(paper.published_date), "MMM d, yyyy")}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {abstract && (
                    <div className="text-sm text-foreground/90 leading-relaxed">
                      {abstract}
                    </div>
                  )}
                  
                  {innovations && innovations.length > 0 && (
                    <div className="bg-muted/30 rounded-lg p-4 mt-4 border border-border/50">
                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-primary">
                        <Lightbulb className="h-4 w-4" />
                        {t("Key Innovations", "核心创新点")}
                      </h4>
                      <ul className="space-y-2">
                        {innovations.map((innovation, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2 text-muted-foreground">
                            <span className="text-secondary font-bold shrink-0 mt-0.5">•</span>
                            <span>{innovation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
                {paper.keywords && paper.keywords.length > 0 && (
                  <CardFooter className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {paper.keywords.map((kw, idx) => (
                        <span key={idx} className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </CardFooter>
                )}
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <FileText className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium text-foreground/70 mb-2">
                {t("No research papers yet", "暂无研究论文")}
              </p>
              <p className="text-sm">
                {t("Click the Add Paper button to add the first publication.", "点击添加论文按钮添加第一篇出版物。")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
