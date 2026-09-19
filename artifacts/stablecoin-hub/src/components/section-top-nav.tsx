import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export type SectionTopNavItem = {
  href: string;
  label: string;
  aliases?: string[];
  matchPrefix?: boolean;
};

export function SectionTopNav({
  eyebrow,
  items,
  ariaLabel,
}: {
  eyebrow: string;
  items: SectionTopNavItem[];
  ariaLabel: string;
}) {
  const [location] = useLocation();

  return (
    <div className="section-top-nav mb-8 min-w-0 border-y border-border bg-card/55">
      <div className="flex min-w-0 items-stretch gap-5 px-4 sm:gap-8 sm:px-6">
        <p className="flex shrink-0 items-center border-r border-border pr-5 text-xs font-semibold tracking-[0.08em] text-primary sm:pr-8">{eyebrow}</p>
        <nav aria-label={ariaLabel} className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex min-w-max items-stretch gap-6 sm:gap-9">
            {items.map((item) => {
              const active = location === item.href
                || Boolean(item.aliases?.includes(location))
                || Boolean(item.matchPrefix && location.startsWith(`${item.href}/`));
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={cn(
                      "relative flex min-h-14 items-center whitespace-nowrap px-0 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:origin-left after:scale-x-0 after:bg-primary after:transition-transform",
                      active
                        ? "text-foreground after:scale-x-100"
                        : "text-muted-foreground hover:text-foreground hover:after:scale-x-100 hover:after:bg-primary/35",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
