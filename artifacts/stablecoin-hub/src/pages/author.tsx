import { useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import {
  useGetAuthor,
  getGetAuthorQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User, BookOpen, ExternalLink, Link as LinkIcon,
  Calendar, ArrowLeft, FileText, ChevronRight
} from "lucide-react";
import { format } from "date-fns";

const TYPE_LABELS: Record<string, string> = {
  paper: "Paper",
  report: "Report",
  news: "News",
  government_doc: "Gov. Doc",
  blog: "Blog",
  publication: "Publication",
  forum: "Forum",
  video: "Video",
};

const TYPE_COLORS: Record<string, string> = {
  paper: "bg-blue-50 text-blue-700 border-blue-100",
  report: "bg-emerald-50 text-emerald-700 border-emerald-100",
  news: "bg-amber-50 text-amber-700 border-amber-100",
  government_doc: "bg-purple-50 text-purple-700 border-purple-100",
  blog: "bg-pink-50 text-pink-700 border-pink-100",
  publication: "bg-indigo-50 text-indigo-700 border-indigo-100",
  forum: "bg-orange-50 text-orange-700 border-orange-100",
  video: "bg-rose-50 text-rose-700 border-rose-100",
};

export default function AuthorPage({ params }: { params: { name: string } }) {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const authorName = decodeURIComponent(params.name);

  const { data: author, isLoading } = useGetAuthor(authorName, {
    query: { queryKey: getGetAuthorQueryKey(authorName) },
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back button */}
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
          {/* Author Header Card */}
          <Card className="border-primary/10 bg-gradient-to-br from-primary/3 to-transparent">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* Avatar */}
                <div className="shrink-0 w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-serif font-bold text-primary">
                    {author.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-3xl font-serif font-bold text-primary" data-testid="text-author-name">
                      {author.name}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      {author.resource_count}{" "}
                      {t("publication(s) in the resource library", "篇资源收录于资源库")}
                    </p>
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-3">
                    {author.resource_types.map((rt) => (
                      <div
                        key={rt.type}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${TYPE_COLORS[rt.type] ?? "bg-muted text-muted-foreground border-muted"}`}
                      >
                        <FileText className="h-3 w-3" />
                        {TYPE_LABELS[rt.type] ?? rt.type} ({rt.count})
                      </div>
                    ))}
                  </div>

                  {/* Top tags */}
                  {author.top_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {author.top_tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Publications */}
          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t("Publications in Library", "收录资源")}
              <span className="text-sm font-normal text-muted-foreground ml-1">({author.resources.length})</span>
            </h2>

            <div className="space-y-4">
              {author.resources.map((resource) => {
                const title = language === "zh" && resource.title_zh ? resource.title_zh : resource.title;
                const abstract = language === "zh" && resource.abstract_zh ? resource.abstract_zh : resource.abstract;

                return (
                  <Card
                    key={resource.id}
                    className="shadow-sm hover:border-primary/20 hover:shadow-md transition-all"
                    data-testid={`card-resource-${resource.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${TYPE_COLORS[resource.resource_type] ?? "bg-muted text-muted-foreground"}`}>
                              {TYPE_LABELS[resource.resource_type] ?? resource.resource_type}
                            </span>
                            {resource.published_date && (
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {resource.published_date}
                              </span>
                            )}
                          </div>
                          <CardTitle className="text-lg leading-tight group">
                            {resource.url ? (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary transition-colors flex items-start gap-2"
                                data-testid={`link-resource-${resource.id}`}
                              >
                                {title}
                                <ExternalLink className="h-4 w-4 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                            ) : (
                              title
                            )}
                          </CardTitle>
                          {resource.authors && resource.authors.length > 0 && (
                            <CardDescription className="mt-1">
                              {resource.authors.join(", ")}
                              {resource.journal && <span className="italic"> — {resource.journal}</span>}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {abstract && (
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-3">
                          {abstract}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-1.5">
                          {resource.tags?.map((tag, idx) => (
                            <span key={idx} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                        {resource.doi && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" />
                            DOI: {resource.doi}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
