import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col justify-center py-10 text-foreground">
      <p className="text-sm font-semibold text-muted-foreground">404</p>
      <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-primary sm:text-4xl">
        {t("Page not found", "页面未找到")}
      </h1>
      <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
        {t(
          "This page is unavailable. You can return home or browse the research library.",
          "此页面暂不可用。你可以返回首页，或浏览研究资源库。",
        )}
      </p>
      <div className="mt-7 flex flex-wrap gap-4">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          {t("Return home", "返回首页")}
        </Link>
        <Link
          href="/academic-resources"
          className="inline-flex min-h-11 items-center rounded border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-muted"
        >
          {t("Research Library", "研究资源库")}
        </Link>
      </div>
    </section>
  );
}
