import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { authenticatedFetch, useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User, BookOpen, Link as LinkIcon,
  Calendar, ArrowLeft, Building2, Pencil, UserPlus, UserCheck,
} from "lucide-react";
import { sourceTypeLabel } from "@/lib/source-types";
import { normalizeAbstractForDisplay, TagSummaryList, type TagSummary } from "@/pages/academic-resources";

interface ApiResource {
  id: number;
  title: string;
  authors?: string[];
  sourceType?: string;
  url?: string | null;
  doi?: string | null;
  abstract?: string | null;
  publishedDate?: string | null;
  createdAt?: string;
  facetedTags?: TagSummary[];
}

interface AuthorProfile {
  id: number;
  name: string;
  researchInterests: string[] | null;
  bio: string | null;
  institutionId: number | null;
  institutionName: string | null;
  institutionCountry: string | null;
  resources: ApiResource[];
}

const editFormSchema = z.object({
  institutionName: z.string().optional(),
  researchInterests: z.string().optional(),
  bio: z.string().optional(),
});

const TYPE_COLORS: Record<string, string> = {
  journal_article: "bg-blue-50 text-blue-700 border-blue-100",
  working_paper: "bg-cyan-50 text-cyan-700 border-cyan-100",
  conference_paper: "bg-purple-50 text-purple-700 border-purple-100",
  thesis: "bg-indigo-50 text-indigo-700 border-indigo-100",
  book: "bg-rose-50 text-rose-700 border-rose-100",
  book_chapter: "bg-pink-50 text-pink-700 border-pink-100",
  report: "bg-emerald-50 text-emerald-700 border-emerald-100",
  gov_document: "bg-violet-50 text-violet-700 border-violet-100",
  news: "bg-amber-50 text-amber-700 border-amber-100",
};

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "");
}

export default function AuthorPage({ params }: { params: { name: string } }) {
  const { t, language } = useLanguage();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const authorName = decodeURIComponent(params.name);
  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [followingAuthor, setFollowingAuthor] = useState(false);
  const [followingInstitution, setFollowingInstitution] = useState(false);

  const loadAuthor = () => {
    setIsLoading(true);
    return fetch(`${apiBase()}/api/authors/${encodeURIComponent(authorName)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAuthor(data))
      .catch(() => setAuthor(null))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setAuthor(null);
    fetch(`${apiBase()}/api/authors/${encodeURIComponent(authorName)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setAuthor(data);
      })
      .catch(() => {
        if (!cancelled) setAuthor(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authorName]);

  useEffect(() => {
    if (!token || !author) { setFollowingAuthor(false); setFollowingInstitution(false); return; }
    authenticatedFetch(`${apiBase()}/api/account/follows`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : [])
      .then((rows) => {
        setFollowingAuthor(rows.some((row: any) => row.targetType === "author" && row.targetKey === String(author.id)));
        setFollowingInstitution(!!author.institutionId && rows.some((row: any) => row.targetType === "institution" && row.targetKey === String(author.institutionId)));
      }).catch(() => undefined);
  }, [author, token]);

  async function toggleFollow(targetType: "author" | "institution") {
    if (!token || !author) {
      toast({ title: t("Sign in required", "请先登录"), description: t("Sign in to follow experts and institutions.", "登录后可关注专家学者与机构。") });
      return;
    }
    const isInstitution = targetType === "institution";
    const targetKey = isInstitution ? String(author.institutionId) : String(author.id);
    const targetLabel = isInstitution ? author.institutionName : author.name;
    if (!targetKey || targetKey === "null" || !targetLabel) return;
    const following = isInstitution ? followingInstitution : followingAuthor;
    const response = await authenticatedFetch(`${apiBase()}/api/account/follows${following ? `/${targetType}/${encodeURIComponent(targetKey)}` : ""}`, {
      method: following ? "DELETE" : "POST",
      headers: { Authorization: `Bearer ${token}`, ...(following ? {} : { "Content-Type": "application/json" }) },
      ...(following ? {} : { body: JSON.stringify({ targetType, targetKey, targetLabel }) }),
    });
    if (!response.ok) return;
    if (isInstitution) setFollowingInstitution(!following); else setFollowingAuthor(!following);
    toast({ title: following ? t("Unfollowed", "已取消关注") : t("Following", "已关注"), description: targetLabel });
  }

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: { institutionName: "", researchInterests: "", bio: "" },
  });

  useEffect(() => {
    if (author && isEditOpen) {
      editForm.reset({
        institutionName: author.institutionName ?? "",
        researchInterests: (author.researchInterests ?? []).join(", "),
        bio: author.bio ?? "",
      });
    }
  }, [author, isEditOpen]);

  const onEditSubmit = async (values: z.infer<typeof editFormSchema>) => {
    if (!author) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${apiBase()}/api/authors/${encodeURIComponent(author.name)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          institutionName: values.institutionName ?? "",
          researchInterests: values.researchInterests
            ? values.researchInterests.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          bio: values.bio ?? "",
        }),
      });
      if (!res.ok) throw new Error("Failed to update author");
      await loadAuthor();
      setIsEditOpen(false);
      toast({
        title: t("Success", "成功"),
        description: t("Author profile updated successfully.", "作者档案更新成功。"),
      });
    } catch {
      toast({
        title: t("Error", "错误"),
        description: t("Failed to update author profile.", "更新作者档案失败。"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <Button
        variant="ghost"
        className="text-muted-foreground hover:text-primary -ml-2"
        onClick={() => setLocation("/experts")}
        data-testid="button-back-to-experts"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("Back to Experts & Scholars", "返回专家学者")}
      </Button>

      {isLoading ? (
        <div className="space-y-6">
          <div className="flex items-start gap-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-40" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-2/3" /></CardHeader>
              <CardContent><Skeleton className="h-16 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      ) : !author ? (
        <div className="py-16 text-center border-2 border-dashed border-border rounded-lg bg-muted/20">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-lg font-medium">{t("Author not found", "未找到作者")}</h3>
          <p className="text-sm text-muted-foreground mt-1">{authorName}</p>
        </div>
      ) : (
        <>
          <Card className="rounded-none border-x-0 border-t-0 border-b border-primary/15 bg-transparent shadow-none">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="shrink-0 w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-serif font-bold text-primary">
                    {author.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-serif font-bold text-primary" data-testid="text-author-name">
                        {author.name}
                      </h1>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                    <Button variant={followingAuthor ? "default" : "outline"} size="sm" onClick={() => void toggleFollow("author")}>
                      {followingAuthor ? <UserCheck className="mr-2 h-3.5 w-3.5" /> : <UserPlus className="mr-2 h-3.5 w-3.5" />}
                      {followingAuthor ? t("Following", "已关注") : t("Follow expert", "关注专家")}
                    </Button>
                    {author.institutionId && author.institutionName && <Button variant={followingInstitution ? "default" : "outline"} size="sm" onClick={() => void toggleFollow("institution")}>
                      <Building2 className="mr-2 h-3.5 w-3.5" />{followingInstitution ? t("Institution followed", "已关注机构") : t("Follow institution", "关注机构")}
                    </Button>}
                    {user?.role === "admin" && (
                      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            data-testid="button-edit-author"
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            {t("Edit", "编辑")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>{t("Edit Author Profile", "编辑作者档案")}</DialogTitle>
                          </DialogHeader>
                          <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                              <FormField
                                control={editForm.control}
                                name="institutionName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t("Institution", "机构")}</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder={t("e.g. Zhejiang University", "例如：浙江大学")} data-testid="input-edit-institution" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={editForm.control}
                                name="researchInterests"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t("Research Interests (comma-separated)", "研究方向（用逗号分隔）")}</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder={t("e.g. Regulation, DeFi, CBDC", "例如：监管, DeFi, 央行数字货币")} data-testid="input-edit-interests" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={editForm.control}
                                name="bio"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t("Bio", "简介")}</FormLabel>
                                    <FormControl>
                                      <Textarea {...field} rows={4} data-testid="input-edit-bio" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" disabled={isSaving} className="w-full" data-testid="button-save-author">
                                {isSaving ? t("Saving...", "保存中...") : t("Save Changes", "保存更改")}
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    )}
                    </div>
                  </div>
                  {author.institutionName && (
                    <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      {author.institutionName}
                      {author.institutionCountry ? ` · ${author.institutionCountry}` : ""}
                    </p>
                  )}
                  <p className="text-muted-foreground mt-1">
                    {(author.resources ?? []).length}{" "}
                    {t("publication(s) in the resource library", "篇资源收录于资源库")}
                  </p>

                  {author.bio && (
                    <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl">{author.bio}</p>
                  )}

                  {Array.isArray(author.researchInterests) && author.researchInterests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {author.researchInterests.map((interest) => (
                        <span
                          key={interest}
                          className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t("Publications in Library", "收录资源")}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                ({(author.resources ?? []).length})
              </span>
            </h2>

            <div className="divide-y divide-border border-y border-border">
              {(author.resources ?? []).map((resource) => (
                <Card
                  key={resource.id}
                  className="rounded-none border-0 bg-transparent shadow-none transition-colors hover:bg-primary/[0.025]"
                  data-testid={`card-resource-${resource.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${TYPE_COLORS[resource.sourceType ?? ""] ?? "bg-muted text-muted-foreground"}`}>
                            {resource.sourceType ? sourceTypeLabel(resource.sourceType, language === "zh") : "Resource"}
                          </span>
                          {resource.publishedDate && (
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {resource.publishedDate}
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-lg leading-tight group">
                          <button type="button"
                            onClick={() => setLocation(`/academic-resources?id=${resource.id}`)}
                            className="w-full text-left transition-colors hover:text-primary hover:underline"
                            data-testid={`link-resource-${resource.id}`}>
                            {resource.title}
                          </button>
                        </CardTitle>
                        {Array.isArray(resource.authors) && resource.authors.length > 0 && (
                          <CardDescription className="mt-1">
                            {resource.authors.join(", ")}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {resource.abstract && (
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-3">
                        {normalizeAbstractForDisplay(resource.abstract)}
                      </p>
                    )}
                    {resource.facetedTags && resource.facetedTags.length > 0 && (
                      <div className="mb-3">
                        <TagSummaryList
                          tags={resource.facetedTags}
                          language={language}
                          onTagClick={(slug) => setLocation(`/academic-resources?tag=${encodeURIComponent(slug)}`)}
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      {resource.doi && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" />
                          DOI: {resource.doi}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
