"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/language-context";
import type { FamilyValue } from "@/lib/db";

const ICONS = ["Heart", "HandHeart", "Shield", "Sparkles", "Star", "Sun", "Smile", "Users"];
const GRADIENTS = [
  "from-rose-400 to-pink-500", "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-500", "from-emerald-400 to-teal-500",
  "from-violet-400 to-purple-500", "from-orange-400 to-red-500",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: FamilyValue | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: any) => Promise<void>;
  saving: boolean;
}

export function ValueDialog({ open, onOpenChange, value, onSave, saving }: Props) {
  const t = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Heart");
  const [gradient, setGradient] = useState("from-rose-400 to-pink-500");
  const [sortOrder, setSortOrder] = useState(0);

  const isEditing = !!value;

  useEffect(() => {
    if (value) { setTitle(value.title); setDescription(value.description); setIcon(value.icon); setGradient(value.gradient); setSortOrder(value.sort_order); }
    else { setTitle(""); setDescription(""); setIcon("Heart"); setGradient("from-rose-400 to-pink-500"); setSortOrder(0); }
  }, [value, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={(e) => { e.preventDefault(); onSave({ title, description, icon, gradient, sort_order: sortOrder }); }}>
          <DialogHeader>
            <DialogTitle>{isEditing ? t("value.edit") : t("value.add")}</DialogTitle>
            <DialogDescription>{isEditing ? t("value.editDesc") : t("value.addDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("value.title")} *</Label><Input value={title} onChange={e => setTitle(e.target.value)} required placeholder={t("value.placeholder.title")} />
              </div>
              <div className="space-y-2">
                <Label>{t("value.sortOrder")}</Label>
                <Input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("value.description")}</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder={t("value.placeholder.description")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("value.icon")}</Label>
                <Select value={icon} onValueChange={v => setIcon(v ?? "Heart")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ICONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("value.gradient")}</Label>
                <Select value={gradient} onValueChange={v => setGradient(v ?? "from-rose-400 to-pink-500")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRADIENTS.map(g => (
                      <SelectItem key={g} value={g}><div className="flex items-center gap-2"><span className={`inline-block h-4 w-4 rounded bg-gradient-to-br ${g}`} />{g.split(" ")[0].replace("from-", "")}</div></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
