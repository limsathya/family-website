"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/language-context";

interface SiteMeta {
  siteTitle: string;
  siteDescription: string;
  ogImage: string;
  familySectionTitle: string;
  familySectionSubtitle: string;
  valuesSectionTitle: string;
  valuesSectionSubtitle: string;
  gallerySectionTitle: string;
  gallerySectionSubtitle: string;
  eventsSectionTitle: string;
  eventsSectionSubtitle: string;
}

const defaultMeta: SiteMeta = {
  siteTitle: "",
  siteDescription: "",
  ogImage: "",
  familySectionTitle: "",
  familySectionSubtitle: "",
  valuesSectionTitle: "",
  valuesSectionSubtitle: "",
  gallerySectionTitle: "",
  gallerySectionSubtitle: "",
  eventsSectionTitle: "",
  eventsSectionSubtitle: "",
};

const SiteContext = createContext<SiteMeta>(defaultMeta);

export function SiteMetaProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  const [meta, setMeta] = useState<SiteMeta>(defaultMeta);

  useEffect(() => {
    fetch(`/api/settings/meta?lang=${lang}`)
      .then((res) => res.json())
      .then((data) => setMeta(data))
      .catch(() => {});
  }, [lang]);

  return <SiteContext.Provider value={meta}>{children}</SiteContext.Provider>;
}

export function useSiteMeta() {
  return useContext(SiteContext);
}
