import React, { useEffect, useState } from "react";
import { ListTree, X } from "lucide-react";

type EdgeNavItem = {
  id: string;
  label: string;
};

type ContentEdgeNavProps = {
  items: EdgeNavItem[];
  label: string;
};

export function ContentEdgeNav({ items, label }: ContentEdgeNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.1, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  const openSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    setMobileOpen(false);
  };

  return (
    <>
      <nav aria-label={label} className="group fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 xl:block">
        <div className="relative h-72 w-3 overflow-hidden transition-[width] duration-300 group-hover:w-72 group-focus-within:w-72">
          <button type="button" className="absolute inset-y-0 right-0 w-3 bg-transparent focus:outline-none" aria-label={label}><span className="absolute right-0 top-1/2 h-20 w-1 -translate-y-1/2 bg-primary/70 transition-colors group-hover:bg-primary" aria-hidden="true" /><span className="sr-only">{label}</span></button>
          <div className="absolute right-3 top-1/2 w-64 -translate-y-1/2 translate-x-[calc(100%+0.75rem)] border-l-4 border-primary bg-background/95 px-5 py-4 opacity-0 shadow-lg backdrop-blur transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-primary">{label}</p>
            <ol className="space-y-1">
              {items.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openSection(item.id)}
                    className={`flex w-full items-center gap-3 py-1.5 text-left text-sm transition-colors ${activeId === item.id ? "font-semibold text-primary" : "text-foreground/75 hover:text-primary"}`}
                  >
                    <span className="w-5 text-xs tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </nav>

      <div className="fixed bottom-5 right-4 z-40 xl:hidden">
        {mobileOpen && (
          <nav aria-label={label} className="absolute bottom-12 right-0 w-64 border-l-4 border-primary bg-background px-4 py-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{label}</p>
              <button type="button" onClick={() => setMobileOpen(false)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            {items.map((item, index) => (
              <button key={item.id} type="button" onClick={() => openSection(item.id)} className={`flex w-full gap-3 py-2 text-left text-sm ${activeId === item.id ? "font-semibold text-primary" : "text-foreground/80"}`}>
                <span className="w-5 text-xs tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>{item.label}
              </button>
            ))}
          </nav>
        )}
        <button type="button" onClick={() => setMobileOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center bg-primary text-primary-foreground shadow-lg" aria-label={label} title={label}><ListTree className="h-5 w-5" /></button>
      </div>
    </>
  );
}
