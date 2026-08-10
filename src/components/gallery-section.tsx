"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Heart, Loader2 } from "lucide-react";
import { useTranslation, useLanguage } from "@/lib/i18n/language-context";
import { useSiteMeta } from "@/lib/site-context";
import { usePolling } from "@/lib/use-polling";
import type { GalleryItem } from "@/lib/db";

export function GallerySection() {
  const t = useTranslation();
  const { lang } = useLanguage();
  const meta = useSiteMeta();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await fetch(`/api/gallery?lang=${lang}`).then(r => r.json());
      setItems(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [lang]);

  usePolling(fetchData, 10000, true);

  const categories = [...new Set(items.map((i) => i.category))];
  const title = meta.gallerySectionTitle || "";
  const subtitle = meta.gallerySectionSubtitle || "";

  return (
    <section id="gallery" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4"><Camera className="mr-1 h-3 w-3" />{t("gallery.badge")}</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground"><p>{t("gallery.empty")}</p></div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <div className="flex justify-center mb-10">
              <TabsList>
                <TabsTrigger value="all">{t("gallery.all")}</TabsTrigger>
                {categories.map((cat) => <TabsTrigger key={cat} value={cat} className="capitalize">{cat}</TabsTrigger>)}
              </TabsList>
            </div>
            <TabsContent value="all" className="mt-0"><GalleryGrid items={items} /></TabsContent>
            {categories.map((cat) => (
              <TabsContent key={cat} value={cat} className="mt-0"><GalleryGrid items={items.filter((i) => i.category === cat)} /></TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </section>
  );
}

function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const t = useTranslation();
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
      {items.map((item) => (
        <Card key={item.id} className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
          <div className={`h-48 bg-gradient-to-br ${item.gradient} flex items-center justify-center overflow-hidden`}>
            {item.image ? (
              <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
              <Camera className="h-12 w-12 text-white/70 group-hover:scale-110 transition-transform" />
            )}
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div><h3 className="font-semibold">{item.title}</h3><p className="text-sm text-muted-foreground mt-1">{item.description}</p></div>
              <Heart className="h-4 w-4 text-muted-foreground group-hover:fill-rose-500 group-hover:text-rose-500 transition-all shrink-0 ml-2" />
            </div>
            <Badge variant="secondary" className="mt-3 capitalize">{t(`galleryDialog.category.${item.category}` as any) || item.category}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
