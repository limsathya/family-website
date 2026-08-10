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
import type { GalleryItem } from "@/lib/db";

const GRADIENTS = [
  "from-rose-400 to-pink-500", "from-cyan-400 to-blue-500", "from-red-400 to-green-500",
  "from-amber-400 to-orange-500", "from-emerald-400 to-teal-500", "from-orange-400 to-red-500",
  "from-indigo-400 to-purple-500", "from-purple-400 to-orange-500", "from-slate-400 to-gray-500",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: GalleryItem | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: any) => Promise<void>;
  saving: boolean;
}

export function GalleryDialog({ open, onOpenChange, item, onSave, saving }: Props) {
  const t = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("everyday");
  const [image, setImage] = useState("");
  const [gradient, setGradient] = useState("from-rose-400 to-pink-500");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEditing = !!item;

  useEffect(() => {
    if (item) { setTitle(item.title); setDescription(item.description); setCategory(item.category); setImage(item.image); setGradient(item.gradient); }
    else { setTitle(""); setDescription(""); setCategory("everyday"); setImage(""); setGradient("from-rose-400 to-pink-500"); }
  }, [item, open]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={(e) => { e.preventDefault(); onSave({ title, description, category, image, gradient }); }}>
          <DialogHeader>
            <DialogTitle>{isEditing ? t("galleryDialog.edit") : t("galleryDialog.add")}</DialogTitle>
            <DialogDescription>{isEditing ? t("galleryDialog.editDesc") : t("galleryDialog.addDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className={`relative h-40 rounded-lg overflow-hidden cursor-pointer bg-gradient-to-br ${gradient} flex items-center justify-center`} onClick={() => fileRef.current?.click()}>
              {image ? <img src={image} alt={t("galleryDialog.previewAlt")} className="h-full w-full object-cover" /> :
                uploading ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Camera className="h-8 w-8 text-white/70" />}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("galleryDialog.title")} *</Label><Input value={title} onChange={e => setTitle(e.target.value)} required placeholder={t("galleryDialog.placeholder.title")} />
              </div>
              <div className="space-y-2">
                <Label>{t("galleryDialog.category")}</Label>
                <Input value={category} onChange={e => setCategory(e.target.value)} placeholder={t("galleryDialog.placeholder.category")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("galleryDialog.description")}</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder={t("galleryDialog.placeholder.description")} />
            </div>
            <div className="space-y-2">
              <Label>{t("galleryDialog.gradient")}</Label>
              <Select value={gradient} onValueChange={v => setGradient(v ?? "from-rose-400 to-pink-500")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADIENTS.map(g => (
                    <SelectItem key={g} value={g}>
                      <div className="flex items-center gap-2"><span className={`inline-block h-4 w-4 rounded bg-gradient-to-br ${g}`} />{g}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("admin.cancel")}</Button>
            <Button type="submit" disabled={saving || !title} className="bg-rose-500 hover:bg-rose-600">{saving ? t("admin.saving") : isEditing ? t("admin.update") : t("admin.create")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
