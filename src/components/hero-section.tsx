"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown, Heart, Loader2 } from "lucide-react";
import { useTranslation, useLanguage } from "@/lib/i18n/language-context";
import { usePolling } from "@/lib/use-polling";

export function HeroSection() {
  const t = useTranslation();
  const { lang } = useLanguage();
  const [data, setData] = useState({ title: "", subtitle: "", ctaPrimary: "", ctaSecondary: "" });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const d = await fetch(`/api/settings/hero?lang=${lang}`).then(r => r.json());
      setData(d);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [lang]);

  usePolling(fetchData, 15000, true);

  const scrollToFamily = () => {
    document.getElementById("family")?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <section id="home" className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </section>
    );
  }

  // Only render if admin has set content
  if (!data.title && !data.subtitle) {
    return (
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-rose-500/10 dark:bg-rose-500/5 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-orange-500/10 dark:bg-orange-500/5 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-24 md:py-36 flex flex-col items-center text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground mb-8">
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
            {t("hero.badge")}
          </div>
          <p className="text-muted-foreground text-lg">{t("admin.hero.empty")}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="home" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-rose-500/10 dark:bg-rose-500/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-orange-500/10 dark:bg-orange-500/5 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto px-4 py-24 md:py-36 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground mb-8 animate-fade-in-down">
          <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
          {t("hero.badge")}
        </div>

        {data.title && (
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in-up">
            <span className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              {data.title}
            </span>
          </h1>
        )}

        {data.subtitle && (
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            {data.subtitle}
          </p>
        )}

        {(data.ctaPrimary || data.ctaSecondary) && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            {data.ctaPrimary && (
              <Button size="lg" className="rounded-full bg-rose-500 hover:bg-rose-600 transition-all duration-300 hover:scale-105 hover:shadow-lg" onClick={scrollToFamily}>
                <Heart className="mr-2 h-4 w-4 fill-current" />
                {data.ctaPrimary}
              </Button>
            )}
            {data.ctaSecondary && (
              <Button size="lg" variant="outline" className="rounded-full transition-all duration-300 hover:scale-105 hover:shadow-md" onClick={scrollToFamily}>
                {data.ctaSecondary}
              </Button>
            )}
          </div>
        )}

        <div className="mt-20 animate-bounce">
          <ArrowDown className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
    </section>
  );
}
