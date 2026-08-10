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
import type { Branch } from "@/lib/db";

const LANGS: Language[] = ["en", "zh", "km"];
const LANG_LABELS: Record<string, string> = { en: "EN", zh: "中文", km: "ខ្មែរ" };
const TYPE_OPTIONS = ["clan", "family", "branch"] as const;
const COLOR_OPTIONS = ["bg-rose-500","bg-sky-500","bg-violet-500","bg-emerald-500","bg-amber-500","bg-orange-500","bg-pink-500","bg-indigo-500","bg-teal-500"];

interface LangData { name: string; description: string; }

interface Props {
  open: boolean; onOpenChange: (open: boolean) => void;
  branch: Branch | null;
  onSave: (data: any) => Promise<void>;
  saving: boolean;
}

export function BranchDialog({ open, onOpenChange, branch, onSave, saving }: Props) {
  const t = useTranslation();
  const [tab, setTab] = useState<Language>("en");
  const [langData, setLangData] = useState<Record<string, LangData>>({
    en: { name: "", description: "" }, zh: { name: "", description: "" }, km: { name: "", description: "" },
  });
  const [type, setType] = useState("branch");
  const [color, setColor] = useState("bg-rose-500");
  const isEditing = !!branch;
  const cur = langData[tab];

  useEffect(() => {
    if (branch) {
      const sibs = (branch as any)._siblings as Branch[] | undefined;
      const newLang: Record<string, LangData> = { en: { name: "", description: "" }, zh: { name: "", description: "" }, km: { name: "", description: "" } };
      if (sibs) {
        for (const s of sibs) { if (newLang[s.lang]) newLang[s.lang] = { name: s.name, description: s.description }; }
      } else {
        newLang.en = { name: branch.name, description: branch.description };
        newLang.zh = { name: branch.name, description: branch.description };
        newLang.km = { name: branch.name, description: branch.description };
      }
      setLangData(newLang);
      setType(branch.type); setColor(branch.color);
    } else {
      setLangData({ en: { name: "", description: "" }, zh: { name: "", description: "" }, km: { name: "", description: "" } });
      setType("branch"); setColor("bg-rose-500");
    }
  }, [branch, open]);

  const setCur = (f: keyof LangData, v: string) => setLangData({ ...langData, [tab]: { ...cur, [f]: v } });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sibs = (branch as any)?._siblings as Branch[] | undefined;
    const groupId = branch?.group_id || `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const items = LANGS.map((l) => ({
      id: sibs?.find((s) => s.lang === l)?.id,
      name: langData[l].name, description: langData[l].description,
      type, color, lang: l, group_id: groupId,
    }));
    onSave({ items });
  };

  const allFilled = LANGS.every((l) => langData[l].name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? t("branch.edit") : t("branch.add")}</DialogTitle>
            <DialogDescription>{isEditing ? t("branch.editDesc") : t("branch.addDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex gap-1 border rounded-md p-0.5 bg-muted self-start">
              {LANGS.map((l) => (
                <button type="button" key={l} onClick={() => setTab(l)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${tab === l ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {LANG_LABELS[l]}{langData[l].name ? " ✓" : ""}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>{t("branch.name")} * ({LANG_LABELS[tab]})</Label>
              <Input value={cur.name} onChange={(e) => setCur("name", e.target.value)} required placeholder={t("branch.placeholder.name")} />
            </div>
            <div className="space-y-2">
              <Label>{t("branch.description")}</Label>
              <Textarea value={cur.description} onChange={(e) => setCur("description", e.target.value)} rows={2} placeholder={t("branch.placeholder.description")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("branch.type")}</Label>
                <Select value={type} onValueChange={(v) => setType(v ?? "branch")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPE_OPTIONS.map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("branch.color")}</Label>
                <Select value={color} onValueChange={(v) => setColor(v ?? "bg-rose-500")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => <SelectItem key={c} value={c}><div className="flex items-center gap-2"><span className={`inline-block h-4 w-4 rounded ${c}`} />{c.replace("bg-","")}</div></SelectItem>)}
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
