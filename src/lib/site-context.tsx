"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { usePolling } from "@/lib/use-polling";

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

  const fetchData = useCallback(async () => {
    try {
      const data = await fetch(`/api/settings/meta?lang=${lang}`).then(r => r.json());
      setMeta(data);
    } catch { /* ignore */ }
  }, [lang]);

  usePolling(fetchData, 30000, true);

  return <SiteContext.Provider value={meta}>{children}</SiteContext.Provider>;
}

export function useSiteMeta() {
  return useContext(SiteContext);
}
