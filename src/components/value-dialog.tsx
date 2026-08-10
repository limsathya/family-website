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
import type { FamilyValue } from "@/lib/db";

const LANGS: Language[] = ["en", "zh", "km"];
const LANG_LABELS: Record<string, string> = { en: "EN", zh: "中文", km: "ខ្មែរ" };
const ICONS = ["Heart", "HandHeart", "Shield", "Sparkles", "Star", "Sun", "Smile", "Users"];
const GRADIENTS = ["from-rose-400 to-pink-500","from-amber-400 to-orange-500","from-sky-400 to-blue-500","from-emerald-400 to-teal-500","from-violet-400 to-purple-500","from-orange-400 to-red-500"];

interface LangData { title: string; description: string; }

interface Props {
  open: boolean; onOpenChange: (open: boolean) => void;
  value: FamilyValue | null;
  onSave: (data: any) => Promise<void>;
  saving: boolean;
}

export function ValueDialog({ open, onOpenChange, value, onSave, saving }: Props) {
  const t = useTranslation();
  const [tab, setTab] = useState<Language>("en");
  const [langData, setLangData] = useState<Record<string, LangData>>({
    en: { title: "", description: "" }, zh: { title: "", description: "" }, km: { title: "", description: "" },
  });
  const [icon, setIcon] = useState("Heart");
  const [gradient, setGradient] = useState("from-rose-400 to-pink-500");
  const [sortOrder, setSortOrder] = useState(0);
  const isEditing = !!value;
  const cur = langData[tab];

  useEffect(() => {
    if (value) {
      const sibs = (value as any)._siblings as FamilyValue[] | undefined;
      const newLang: Record<string, LangData> = { en: { title: "", description: "" }, zh: { title: "", description: "" }, km: { title: "", description: "" } };
      if (sibs) {
        for (const s of sibs) { if (newLang[s.lang]) newLang[s.lang] = { title: s.title, description: s.description }; }
      } else {
        newLang.en = { title: value.title, description: value.description };
        newLang.zh = { title: value.title, description: value.description };
        newLang.km = { title: value.title, description: value.description };
      }
      setLangData(newLang);
      setIcon(value.icon); setGradient(value.gradient); setSortOrder(value.sort_order);
    } else {
      setLangData({ en: { title: "", description: "" }, zh: { title: "", description: "" }, km: { title: "", description: "" } });
      setIcon("Heart"); setGradient("from-rose-400 to-pink-500"); setSortOrder(0);
    }
  }, [value, open]);

  const setCur = (f: keyof LangData, v: string) => setLangData({ ...langData, [tab]: { ...cur, [f]: v } });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sibs = (value as any)?._siblings as FamilyValue[] | undefined;
    const groupId = value?.group_id || `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const items = LANGS.map((l) => ({
      id: sibs?.find((s) => s.lang === l)?.id,
      title: langData[l].title, description: langData[l].description,
      icon, gradient, sort_order: sortOrder, lang: l, group_id: groupId,
    }));
    onSave({ items });
  };

  const allFilled = LANGS.every((l) => langData[l].title);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? t("value.edit") : t("value.add")}</DialogTitle>
            <DialogDescription>{isEditing ? t("value.editDesc") : t("value.addDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex gap-1 border rounded-md p-0.5 bg-muted self-start">
              {LANGS.map((l) => (
                <button type="button" key={l} onClick={() => setTab(l)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${tab === l ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {LANG_LABELS[l]}{langData[l].title ? " ✓" : ""}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>{t("value.title")} * ({LANG_LABELS[tab]})</Label>
              <Input value={cur.title} onChange={(e) => setCur("title", e.target.value)} required placeholder={t("value.placeholder.title")} />
            </div>
            <div className="space-y-2">
              <Label>{t("value.description")}</Label>
              <Textarea value={cur.description} onChange={(e) => setCur("description", e.target.value)} rows={2} placeholder={t("value.placeholder.description")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("value.sortOrder")}</Label>
                <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>{t("value.icon")}</Label>
                <Select value={icon} onValueChange={(v) => setIcon(v ?? "Heart")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ICONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("value.gradient")}</Label>
              <Select value={gradient} onValueChange={(v) => setGradient(v ?? "from-rose-400 to-pink-500")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADIENTS.map((g) => <SelectItem key={g} value={g}><div className="flex items-center gap-2"><span className={`inline-block h-4 w-4 rounded bg-gradient-to-br ${g}`} />{g.split(" ")[0].replace("from-","")}</div></SelectItem>)}
                </SelectContent>
              </Select>
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
