import { useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { pageMetadata } from "@/lib/page-metadata";

export function PageMetadata() {
  const [location] = useLocation();
  const { language } = useLanguage();
  useEffect(() => {
    const metadata = pageMetadata(location, language);
    document.title = metadata.title;
    for (const [attribute, name, content] of [
      ["name", "description", metadata.description],
      ["property", "og:title", metadata.title],
      ["property", "og:description", metadata.description],
      ["name", "twitter:title", metadata.title],
      ["name", "twitter:description", metadata.description],
    ]) {
      let meta = document.querySelector<HTMLMetaElement>(
        `meta[${attribute}="${name}"]`,
      );
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    }
  }, [location, language]);
  return null;
}
