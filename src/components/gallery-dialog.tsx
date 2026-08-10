"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/language-context";
import type { GalleryItem } from "@/lib/db";

const LANGS: Language[] = ["en", "zh", "km"];
const LANG_LABELS: Record<string, string> = { en: "EN", zh: "中文", km: "ខ្មែរ" };
const GRADIENTS = [
  "from-rose-400 to-pink-500", "from-cyan-400 to-blue-500", "from-red-400 to-green-500",
  "from-amber-400 to-orange-500", "from-emerald-400 to-teal-500", "from-orange-400 to-red-500",
  "from-indigo-400 to-purple-500", "from-purple-400 to-orange-500", "from-slate-400 to-gray-500",
];

interface LangData { title: string; description: string; category: string; }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: GalleryItem | null;
  onSave: (data: any) => Promise<void>;
  saving: boolean;
}

export function GalleryDialog({ open, onOpenChange, item, onSave, saving }: Props) {
  const t = useTranslation();
  const [tab, setTab] = useState<Language>("en");
  const [langData, setLangData] = useState<Record<string, LangData>>({
    en: { title: "", description: "", category: "everyday" },
    zh: { title: "", description: "", category: "everyday" },
    km: { title: "", description: "", category: "everyday" },
  });
  const [image, setImage] = useState("");
  const [gradient, setGradient] = useState("from-rose-400 to-pink-500");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEditing = !!item;
  const cur = langData[tab];

  useEffect(() => {
    if (item) {
      const sibs = (item as any)._siblings as GalleryItem[] | undefined;
      const newLang: Record<string, LangData> = {
        en: { title: "", description: "", category: "everyday" },
        zh: { title: "", description: "", category: "everyday" },
        km: { title: "", description: "", category: "everyday" },
      };
      if (sibs) {
        for (const s of sibs) {
          if (newLang[s.lang]) newLang[s.lang] = { title: s.title, description: s.description, category: s.category };
        }
      } else {
        newLang.en = { title: item.title, description: item.description, category: item.category };
        newLang.zh = { title: item.title, description: item.description, category: item.category };
        newLang.km = { title: item.title, description: item.description, category: item.category };
      }
      setLangData(newLang);
      setImage(item.image);
      setGradient(item.gradient);
    } else {
      setLangData({
        en: { title: "", description: "", category: "everyday" },
        zh: { title: "", description: "", category: "everyday" },
        km: { title: "", description: "", category: "everyday" },
      });
      setImage("");
      setGradient("from-rose-400 to-pink-500");
    }
  }, [item, open]);

  const setCur = (f: keyof LangData, v: string) => setLangData({ ...langData, [tab]: { ...cur, [f]: v } });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setImage(data.url);
    } catch { /* ignore */ }
    finally { setUploading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sibs = (item as any)?._siblings as GalleryItem[] | undefined;
    const groupId = (item as any)?.group_id || `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const items = LANGS.map((l) => ({
      id: sibs?.find((s) => s.lang === l)?.id,
      title: langData[l].title,
      description: langData[l].description,
      category: langData[l].category,
      image, gradient, lang: l, group_id: groupId,
    }));
    onSave({ items });
  };

  const allFilled = LANGS.every((l) => langData[l].title);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? t("galleryDialog.edit") : t("galleryDialog.add")}</DialogTitle>
            <DialogDescription>{isEditing ? t("galleryDialog.editDesc") : t("galleryDialog.addDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Image preview & upload */}
            <div className={`relative h-40 rounded-lg overflow-hidden cursor-pointer bg-gradient-to-br ${gradient} flex items-center justify-center`} onClick={() => fileRef.current?.click()}>
              {image ? <img src={image} alt={t("galleryDialog.previewAlt")} className="h-full w-full object-cover" /> :
                uploading ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Camera className="h-8 w-8 text-white/70" />}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>

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

            {/* Translatable fields */}
            <div className="space-y-2">
              <Label>{t("galleryDialog.title")} * ({LANG_LABELS[tab]})</Label>
              <Input value={cur.title} onChange={(e) => setCur("title", e.target.value)} required placeholder={t("galleryDialog.placeholder.title")} />
            </div>
            <div className="space-y-2">
              <Label>{t("galleryDialog.category")}</Label>
              <Input value={cur.category} onChange={(e) => setCur("category", e.target.value)} placeholder={t("galleryDialog.placeholder.category")} />
            </div>
            <div className="space-y-2">
              <Label>{t("galleryDialog.description")}</Label>
              <Textarea value={cur.description} onChange={(e) => setCur("description", e.target.value)} rows={2} placeholder={t("galleryDialog.placeholder.description")} />
            </div>

            {/* Shared field */}
            <div className="space-y-2">
              <Label>{t("galleryDialog.gradient")}</Label>
              <Select value={gradient} onValueChange={v => setGradient(v ?? "from-rose-400 to-pink-500")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADIENTS.map(g => (
                    <SelectItem key={g} value={g}>
                      <div className="flex items-center gap-2"><span className={`inline-block h-4 w-4 rounded bg-gradient-to-br ${g}`} />{g.split(" ")[0].replace("from-","")}</div>
                    </SelectItem>
                  ))}
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
