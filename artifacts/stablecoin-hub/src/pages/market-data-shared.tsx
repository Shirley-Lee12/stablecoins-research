import { SectionTopNav } from "@/components/section-top-nav";
import { useLanguage } from "@/lib/language-context";
import { LENSES } from "@/data/market-data-model";
export function MarketSectionNav() {
  const { t } = useLanguage();
  return (
    <SectionTopNav
      eyebrow={t("Market Data", "市场数据")}
      ariaLabel={t("Market-data sections", "市场数据二级导航")}
      items={[
        { href: "/market-data", label: t("Overview", "概览") },
        ...LENSES.map(([slug, en, zh]) => ({
          href: `/market-data/${slug}`,
          label: t(en, zh),
        })),
      ]}
    />
  );
}
