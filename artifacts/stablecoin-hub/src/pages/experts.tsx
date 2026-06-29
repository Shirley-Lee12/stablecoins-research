import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, User, ChevronRight, BookOpen, Building2 } from "lucide-react";

interface ApiAuthor {
  id: number;
  name: string;
  researchInterests: string[] | null;
  bio: string | null;
  institutionId: number | null;
  institutionName: string | null;
  resourceCount: number | string;
}

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "");
}

export default function Experts() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [authors, setAuthors] = useState<ApiAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${apiBase()}/api/authors`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) setAuthors(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setAuthors([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const list = !search
      ? authors
      : authors.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
    return [...list].sort((a, b) => Number(b.resourceCount) - Number(a.resourceCount));
  }, [authors, search]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="border-b border-border pb-6">
        <h2 className="text-3xl font-serif font-bold text-primary tracking-tight">
          {t("Experts & Scholars", "专家学者")}
        </h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          {t(
            "Browse contributors and researchers whose work appears in this stablecoin resource library. Click any name to view their full publication profile.",
            "浏览稳定币资源库中收录作品的学者与机构。点击任意姓名可查看其完整研究档案。",
          )}
        </p>
      </div>

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

      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} {t("contributors found", "位作者")}
        </p>
      )}

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
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
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
          {filtered.map((author) => (
            <Link key={author.id} href={`/authors/${encodeURIComponent(author.name)}`}>
              <Card
                className="shadow-sm hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group h-full"
                data-testid={`card-author-${author.name}`}
              >
                <CardContent className="pt-5 space-y-3">
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
                      {author.institutionName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Building2 className="h-3 w-3 shrink-0" />
                          {author.institutionName}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {Number(author.resourceCount)} {t("resource(s)", "篇资源")}
                  </p>

                  {Array.isArray(author.researchInterests) && author.researchInterests.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {author.researchInterests.slice(0, 4).map((interest) => (
                        <span key={interest} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm">
                          {interest}
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
