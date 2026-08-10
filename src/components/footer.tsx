"use client";

import { Heart } from "lucide-react";
import { useState, useCallback } from "react";
import { useTranslation, useLanguage } from "@/lib/i18n/language-context";
import { usePolling } from "@/lib/use-polling";

export function Footer() {
  const t = useTranslation();
  const { lang } = useLanguage();
  const [siteTitle, setSiteTitle] = useState(process.env.NEXT_PUBLIC_APP_NAME || "Our Family");

  const fetchData = useCallback(async () => {
    try {
      const d = await fetch(`/api/settings/meta?lang=${lang}`).then(r => r.json());
      if (d.siteTitle) setSiteTitle(d.siteTitle);
    } catch { /* ignore */ }
  }, [lang]);

  usePolling(fetchData, 30000, true);

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{t("footer.madeWith")}</span>
            <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
            <span>{t("footer.by")}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {siteTitle}. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
