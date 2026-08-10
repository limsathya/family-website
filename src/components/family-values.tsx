"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, HandHeart, Shield, Sparkles, Star, Sun, Smile, Users, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/language-context";
import { useSiteMeta } from "@/lib/site-context";
import type { FamilyValue } from "@/lib/db";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart, HandHeart, Shield, Sparkles, Star, Sun, Smile, Users,
};

export function FamilyValues() {
  const t = useTranslation();
  const meta = useSiteMeta();
  const [values, setValues] = useState<FamilyValue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/values")
      .then((res) => res.json())
      .then((data) => setValues(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const title = meta.valuesSectionTitle || "";
  const subtitle = meta.valuesSectionSubtitle || "";

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : values.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground"><p>{t("values.empty")}</p></div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = ICON_MAP[value.icon] || Heart;
              return (
                <Card key={value.id} className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <CardHeader className="pb-2">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${value.gradient} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
