import React from "react";
import { SectionTopNav } from "@/components/section-top-nav";
import { useLanguage } from "@/lib/language-context";

export function AboutSectionNav() {
  const { t } = useLanguage();
  return (
    <SectionTopNav
      eyebrow={t("About Stablecoins", "关于稳定币")}
      ariaLabel={t("About-stablecoins sections", "关于稳定币二级导航")}
      items={[
        { href: "/about-stablecoins", label: t("Overview", "概览"), aliases: ["/about-stablecoins/learn"] },
        { href: "/about-stablecoins/history", label: t("History", "发展历程") },
        { href: "/about-stablecoins/types", label: t("Types", "稳定币类别"), matchPrefix: true },
        { href: "/about-stablecoins/applications", label: t("Applications", "应用场景") },
        { href: "/about-stablecoins/regulatory-evolution", label: t("Regulatory Evolution", "监管演进") },
        { href: "/regulatory", label: t("Regulatory Status", "监管现状") },
      ]}
    />
  );
}
