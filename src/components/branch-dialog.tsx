"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/language-context";
import type { Branch } from "@/lib/db";

const TYPE_OPTIONS = ["clan", "family", "branch"] as const;
const COLOR_OPTIONS = [
  "bg-rose-500", "bg-sky-500", "bg-violet-500", "bg-emerald-500",
  "bg-amber-500", "bg-orange-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: Branch | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: any) => Promise<void>;
  saving: boolean;
}

export function BranchDialog({ open, onOpenChange, branch, onSave, saving }: Props) {
  const t = useTranslation();
  const [name, setName] = useState("");
  const [type, setType] = useState("branch");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("bg-rose-500");
  const isEditing = !!branch;

  useEffect(() => {
    if (branch) { setName(branch.name); setType(branch.type); setDescription(branch.description); setColor(branch.color); }
    else { setName(""); setType("branch"); setDescription(""); setColor("bg-rose-500"); }
  }, [branch, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, type, description, color }); }}>
          <DialogHeader>
            <DialogTitle>{isEditing ? t("branch.edit") : t("branch.add")}</DialogTitle>
            <DialogDescription>{isEditing ? t("branch.editDesc") : t("branch.addDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("branch.name")} *</Label><Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Dad's Side" />
              </div>
              <div className="space-y-2">
                <Label>{t("branch.type")}</Label>
                <Select value={type} onValueChange={v => setType(v ?? "branch")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map(opt => <SelectItem key={opt} value={opt} className="capitalize">{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("branch.description")}</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Brief description..." />
            </div>
            <div className="space-y-2">
              <Label>{t("branch.color")}</Label>
              <Select value={color} onValueChange={v => setColor(v ?? "bg-rose-500")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map(c => (
                    <SelectItem key={c} value={c}><div className="flex items-center gap-2"><span className={`inline-block h-4 w-4 rounded ${c}`} />{c.replace("bg-", "")}</div></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("admin.cancel")}</Button>
            <Button type="submit" disabled={saving || !name} className="bg-rose-500 hover:bg-rose-600">
              {saving ? t("admin.saving") : isEditing ? t("admin.update") : t("admin.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
