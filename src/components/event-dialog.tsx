"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/language-context";
import type { FamilyEvent } from "@/lib/db";

const LANGS: Language[] = ["en", "zh", "km"];
const LANG_LABELS: Record<string, string> = { en: "EN", zh: "中文", km: "ខ្មែរ" };
const COLOR_OPTIONS = [
  { value: "border-l-rose-500", label: "Rose" }, { value: "border-l-violet-500", label: "Violet" },
  { value: "border-l-emerald-500", label: "Emerald" }, { value: "border-l-amber-500", label: "Amber" },
  { value: "border-l-sky-500", label: "Sky Blue" }, { value: "border-l-pink-500", label: "Pink" },
  { value: "border-l-orange-500", label: "Orange" }, { value: "border-l-indigo-500", label: "Indigo" },
];
const ICON_OPTIONS = ["🎉","🎂","🍖","🎹","⚽","🏕️","💕","🩰","🎄","🎃","🏖️","🎓","✈️","🎮","🎨","📚","🐶","🌻","🎪","🍕"];

interface LangData { title: string; description: string; location: string; }

interface EventDialogProps {
  open: boolean; onOpenChange: (open: boolean) => void;
  event: FamilyEvent | null;
  onSave: (data: any) => Promise<void>;
  saving: boolean;
}

export function EventDialog({ open, onOpenChange, event, onSave, saving }: EventDialogProps) {
  const t = useTranslation();
  const [tab, setTab] = useState<Language>("en");
  const [langData, setLangData] = useState<Record<string, LangData>>({
    en: { title: "", description: "", location: "" },
    zh: { title: "", description: "", location: "" },
    km: { title: "", description: "", location: "" },
  });
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [icon, setIcon] = useState("📅");
  const [color, setColor] = useState("border-l-rose-500");
  const isEditing = !!event;
  const cur = langData[tab];

  useEffect(() => {
    if (event) {
      const sibs = (event as any)._siblings as FamilyEvent[] | undefined;
      const newLang: Record<string, LangData> = { en: { title: "", description: "", location: "" }, zh: { title: "", description: "", location: "" }, km: { title: "", description: "", location: "" } };
      if (sibs) {
        for (const s of sibs) { if (newLang[s.lang]) newLang[s.lang] = { title: s.title, description: s.description, location: s.location }; }
      } else {
        newLang.en = { title: event.title, description: event.description, location: event.location };
        newLang.zh = { title: event.title, description: event.description, location: event.location };
        newLang.km = { title: event.title, description: event.description, location: event.location };
      }
      setLangData(newLang);
      setDate(event.date); setTime(event.time); setIcon(event.icon); setColor(event.color);
    } else {
      setLangData({ en: { title: "", description: "", location: "" }, zh: { title: "", description: "", location: "" }, km: { title: "", description: "", location: "" } });
      setDate(""); setTime(""); setIcon("📅"); setColor("border-l-rose-500");
    }
  }, [event, open]);

  const setCur = (f: keyof LangData, v: string) => setLangData({ ...langData, [tab]: { ...cur, [f]: v } });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sibs = (event as any)?._siblings as FamilyEvent[] | undefined;
    const groupId = event?.group_id || `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const items = LANGS.map((l) => ({
      id: sibs?.find((s) => s.lang === l)?.id,
      title: langData[l].title, description: langData[l].description, location: langData[l].location,
      date, time, icon, color, lang: l, group_id: groupId,
    }));
    await onSave({ items });
  };

  const allFilled = LANGS.every((l) => langData[l].title && date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? t("event.edit") : t("event.add")}</DialogTitle>
            <DialogDescription>{isEditing ? t("event.editDesc") : t("event.addDesc")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Language Tabs */}
            <div className="flex gap-1 border rounded-md p-0.5 bg-muted self-start">
              {LANGS.map((l) => (
                <button type="button" key={l} onClick={() => setTab(l)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${tab === l ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {LANG_LABELS[l]}{langData[l].title ? " ✓" : ""}
                </button>
              ))}
            </div>

            {/* Translatable */}
            <div className="space-y-2">
              <Label>{t("event.title")} * ({LANG_LABELS[tab]})</Label>
              <Input value={cur.title} onChange={(e) => setCur("title", e.target.value)} placeholder={t("event.placeholder.title")} required />
            </div>
            <div className="space-y-2">
              <Label>{t("event.description")}</Label>
              <Textarea value={cur.description} onChange={(e) => setCur("description", e.target.value)} placeholder={t("event.placeholder.description")} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{t("event.location")}</Label>
              <Input value={cur.location} onChange={(e) => setCur("location", e.target.value)} placeholder={t("event.placeholder.location")} />
            </div>

            {/* Shared */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("event.date")} *</Label>
                <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder={t("event.placeholder.date")} required />
              </div>
              <div className="space-y-2">
                <Label>{t("event.time")}</Label>
                <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder={t("event.placeholder.time")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("event.icon")}</Label>
                <Select value={icon} onValueChange={(v) => setIcon(v ?? "📅")}>
                  <SelectTrigger><SelectValue placeholder={t("event.placeholder.icon")} /></SelectTrigger>
                  <SelectContent>{ICON_OPTIONS.map((ico) => <SelectItem key={ico} value={ico}><span className="text-lg">{ico}</span> {ico}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("event.color")}</Label>
                <Select value={color} onValueChange={(v) => setColor(v ?? "border-l-rose-500")}>
                  <SelectTrigger><SelectValue placeholder={t("event.placeholder.color")} /></SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}><div className="flex items-center gap-2"><span className={`inline-block h-4 w-4 rounded ${c.value.replace("border-l-", "bg-")}`} />{c.label}</div></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("admin.cancel")}</Button>
            <Button type="submit" disabled={saving || !allFilled} className="bg-rose-500 hover:bg-rose-600">
              {saving ? t("admin.saving") : isEditing ? t("admin.update") : t("admin.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
