import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { librarySearchHref } from "@/data/academic-directory";

export function GlobalSearch() {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const label = t("Search the research library", "搜索研究资源库");
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === "k" &&
        inputRef.current?.getClientRects().length
      ) {
        e.preventDefault();
        inputRef.current.focus();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  function submit(event: FormEvent) {
    event.preventDefault();
    navigate(librarySearchHref(query));
  }
  return (
    <form
      role="search"
      aria-label={label}
      onSubmit={submit}
      className="hidden 2xl:flex items-center gap-2 w-full max-w-[280px] h-8 px-3 rounded-md border border-border bg-muted/40 text-sm text-muted-foreground focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20"
    >
      <button
        type="submit"
        aria-label={label}
        className="flex h-5 w-4 shrink-0 items-center justify-center rounded hover:text-primary focus-visible:outline focus-visible:outline-primary"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={label}
        placeholder={t("Search the library…", "搜索资源库…")}
        className="min-w-0 flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70 text-xs"
      />
      <kbd aria-hidden="true" className="text-[10px] border border-border rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
    </form>
  );
}
