import React from "react";
import { SectionTopNav } from "@/components/section-top-nav";
import { useLanguage } from "@/lib/language-context";
import { ABOUT } from "@/data/about-stablecoins";

export function AboutSectionNav() {
  const { t } = useLanguage();
  return (
    <SectionTopNav
      eyebrow={t("About Stablecoins", "关于稳定币")}
      ariaLabel={t("About-stablecoins sections", "关于稳定币二级导航")}
      items={ABOUT.nav.section_top_nav.map((item) => ({
        href: item.route,
        label: t(item.label_en, item.label_zh),
        matchPrefix: item.route === "/about-stablecoins/types",
      }))}
    />
  );
}
