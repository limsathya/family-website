"use client";

import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/language-context";

export function Footer() {
  const t = useTranslation();
  const [siteTitle, setSiteTitle] = useState("Our Family");

  useEffect(() => {
    fetch("/api/settings/meta")
      .then((r) => r.json())
      .then((d) => { if (d.siteTitle) setSiteTitle(d.siteTitle); })
      .catch(() => {});
  }, []);

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
