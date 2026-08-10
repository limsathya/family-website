"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Loader2 } from "lucide-react";
import { useTranslation, useLanguage } from "@/lib/i18n/language-context";
import { usePolling } from "@/lib/use-polling";
import { groupByLang } from "@/lib/group-by-lang";
import type { FamilyMember } from "@/lib/db";

export function RemembranceSection() {
  const t = useTranslation();
  const { lang } = useLanguage();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const allMembers: FamilyMember[] = await fetch("/api/members").then(r => r.json());
      const grouped = groupByLang(allMembers, lang);
      setMembers(grouped.filter((m) => m.in_memoriam === 1));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [lang]);

  usePolling(fetchData, 15000, true);

  if (loading) {
    return (
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (members.length === 0) return null;

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50/40 via-transparent to-transparent dark:from-amber-950/10 pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 border-amber-300 dark:border-amber-700 bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
            <Heart className="mr-1 h-3 w-3 fill-amber-500" />
            {t("remembrance.title")}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("remembrance.heading")}</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">{t("remembrance.subtitle")}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {members.map((member) => (
            <div key={member.id} className="flex flex-col items-center gap-3 group animate-fade-in-up">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-amber-300 to-rose-300 dark:from-amber-600 dark:to-rose-600 opacity-60 blur-sm" />
                <Avatar className="h-24 w-24 border-4 border-background relative ring-2 ring-amber-200 dark:ring-amber-800">
                  {member.avatar ? (
                    <AvatarImage src={member.avatar} alt={member.name} className="grayscale" />
                  ) : null}
                  <AvatarFallback
                    className="text-2xl font-semibold grayscale"
                    style={{ backgroundColor: member.color || "#d1d5db" }}
                  >
                    {member.initials || member.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Heart className="absolute -bottom-1 -right-1 h-5 w-5 fill-amber-400 text-amber-400 drop-shadow-sm" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">{member.name}</p>
                {(member.dob || member.born_year) ? (
                  <p className="text-xs text-muted-foreground">
                    {member.dob
                      ? `${new Date(member.dob + "T00:00:00").getFullYear()}${member.dod ? ` – ${new Date(member.dod + "T00:00:00").getFullYear()}` : ` – `}`
                      : member.born_year}
                  </p>
                ) : null}
                {member.bio && (
                  <p className="text-sm text-muted-foreground max-w-[200px] line-clamp-3">{member.bio}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Candle / decorative line */}
        <div className="mt-16 flex justify-center">
          <div className="flex items-center gap-2 text-amber-400/60 dark:text-amber-500/40">
            <span className="h-px w-12 bg-amber-300 dark:bg-amber-700" />
            <Heart className="h-4 w-4 fill-current" />
            <span className="h-px w-12 bg-amber-300 dark:bg-amber-700" />
          </div>
        </div>
      </div>
    </section>
  );
}
