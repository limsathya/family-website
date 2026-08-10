"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, Loader2 } from "lucide-react";
import { useTranslation, useLanguage } from "@/lib/i18n/language-context";
import { useSiteMeta } from "@/lib/site-context";
import type { FamilyEvent } from "@/lib/db";

export function EventsTimeline() {
  const t = useTranslation();
  const { lang } = useLanguage();
  const meta = useSiteMeta();
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/events?lang=${lang}`)
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lang]);

  const title = meta.eventsSectionTitle || "";
  const subtitle = meta.eventsSectionSubtitle || "";

  return (
    <section id="events" className="bg-muted/30 py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4"><CalendarDays className="mr-1 h-3 w-3" />{t("events.badge")}</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-border hidden md:block" />
            <div className="space-y-8 animate-stagger">
              {events.map((event) => {
                const borderColorMap: Record<string, string> = {
                  "border-l-rose-500": "#f43f5e",
                  "border-l-violet-500": "#8b5cf6",
                  "border-l-emerald-500": "#10b981",
                  "border-l-amber-500": "#f59e0b",
                  "border-l-sky-500": "#0ea5e9",
                  "border-l-pink-500": "#ec4899",
                  "border-l-orange-500": "#f97316",
                  "border-l-indigo-500": "#6366f1",
                };
                const borderColor = borderColorMap[event.color] || "#f43f5e";
                return (
                  <div key={event.id} className="relative flex gap-6 md:gap-10">
                    <div className="hidden md:flex relative z-10 mt-6 h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-border bg-background text-lg">{event.icon}</div>
                    <Card className="flex-1 border-l-4 transition-all duration-300 hover:shadow-lg" style={{ borderLeftColor: borderColor }}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="text-xl">{event.title}</CardTitle>
                          <span className="text-2xl shrink-0">{event.icon}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">{event.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{event.date}</span>
                          {event.time && <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{event.time}</span>}
                          {event.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{event.location}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
            {events.length === 0 && <div className="text-center py-16 text-muted-foreground"><p>{t("events.empty")}</p></div>}
          </div>
        )}
      </div>
    </section>
  );
}
