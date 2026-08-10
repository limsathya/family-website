"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown, Heart, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/language-context";

export function HeroSection() {
  const t = useTranslation();
  const [data, setData] = useState({ title: "", subtitle: "", ctaPrimary: "", ctaSecondary: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/hero")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-orange-100/30 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-24 md:py-36 flex flex-col items-center text-center">
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
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-orange-100/30 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-24 md:py-36 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground mb-8">
          <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
          {t("hero.badge")}
        </div>

        {data.title && (
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              {data.title}
            </span>
          </h1>
        )}

        {data.subtitle && (
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            {data.subtitle}
          </p>
        )}

        {(data.ctaPrimary || data.ctaSecondary) && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {data.ctaPrimary && (
              <Button size="lg" className="rounded-full bg-rose-500 hover:bg-rose-600">
                <Heart className="mr-2 h-4 w-4 fill-current" />
                {data.ctaPrimary}
              </Button>
            )}
            {data.ctaSecondary && (
              <Button size="lg" variant="outline" className="rounded-full">
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
