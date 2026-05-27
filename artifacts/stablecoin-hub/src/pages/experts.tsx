import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { useListAuthors } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, User, FileText, ChevronRight, BookOpen } from "lucide-react";

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

export default function Experts() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");

  const { data: authors, isLoading } = useListAuthors({ search: search || undefined });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h2 className="text-3xl font-serif font-bold text-primary tracking-tight">
          {t("Experts & Scholars", "专家学者")}
        </h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          {t(
            "Browse contributors and researchers whose work appears in this stablecoin resource library. Click any name to view their full publication profile.",
            "浏览稳定币资源库中收录作品的学者与机构。点击任意姓名可查看其完整研究档案。"
          )}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t("Search authors...", "搜索作者...")}
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-authors"
        />
      </div>

      {/* Stats bar */}
      {!isLoading && authors && (
        <p className="text-sm text-muted-foreground">
          {authors.length} {t("contributors found", "位作者")}
        </p>
      )}

      {/* Author grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
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
                <div className="flex gap-1.5">
                  <Skeleton className="h-4 w-12 rounded-sm" />
                  <Skeleton className="h-4 w-14 rounded-sm" />
                  <Skeleton className="h-4 w-10 rounded-sm" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !authors?.length ? (
        <div className="py-16 text-center border-2 border-dashed border-border rounded-lg bg-muted/20">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-lg font-medium text-foreground">
            {t("No authors found", "未找到作者")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("Add resources with author names to see them here.", "添加带有作者姓名的资源以在此处显示。")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {authors.map((author) => (
            <Link key={author.name} href={`/authors/${encodeURIComponent(author.name)}`}>
              <Card
                className="shadow-sm hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group h-full"
                data-testid={`card-author-${author.name}`}
              >
                <CardContent className="pt-5 space-y-4">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-12 h-12 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                      <span className="text-lg font-serif font-bold text-primary">
                        {author.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-semibold text-foreground group-hover:text-primary transition-colors truncate"
                        data-testid={`text-author-name-${author.name}`}
                      >
                        {author.name}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {author.resource_count} {t("resource(s)", "篇资源")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>

                  {/* Resource type badges */}
                  {author.resource_types.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {author.resource_types.slice(0, 3).map((rt) => (
                        <span
                          key={rt.type}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[rt.type] ?? "bg-muted text-muted-foreground border-muted"}`}
                        >
                          {TYPE_LABELS[rt.type] ?? rt.type}
                          {rt.count > 1 && <span className="opacity-70">×{rt.count}</span>}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Top tags */}
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
  );
}
