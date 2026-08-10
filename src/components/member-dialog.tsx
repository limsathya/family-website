"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/language-context";
import type { FamilyMember, Branch } from "@/lib/db";

const LANGS: Language[] = ["en", "zh", "km"];
const LANG_LABELS: Record<string, string> = { en: "EN", zh: "中文", km: "ខ្មែរ" };
const COLOR_OPTIONS = [
  { value: "bg-sky-500", label: "Sky Blue" }, { value: "bg-rose-500", label: "Rose" },
  { value: "bg-violet-500", label: "Violet" }, { value: "bg-emerald-500", label: "Emerald" },
  { value: "bg-amber-500", label: "Amber" }, { value: "bg-orange-500", label: "Orange" },
  { value: "bg-pink-500", label: "Pink" }, { value: "bg-indigo-500", label: "Indigo" },
  { value: "bg-teal-500", label: "Teal" }, { value: "bg-red-500", label: "Red" },
];

interface LangData { name: string; role: string; bio: string; }

interface MemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: FamilyMember | null;
  branches?: Branch[];
  onSave: (data: any) => Promise<void>;
  saving: boolean;
}

export function MemberDialog({ open, onOpenChange, member, branches = [], onSave, saving }: MemberDialogProps) {
  const t = useTranslation();
  const [tab, setTab] = useState<Language>("en");
  const [langData, setLangData] = useState<Record<string, LangData>>({
    en: { name: "", role: "", bio: "" },
    zh: { name: "", role: "", bio: "" },
    km: { name: "", role: "", bio: "" },
  });
  const [initials, setInitials] = useState("");
  const [color, setColor] = useState("bg-sky-500");
  const [avatar, setAvatar] = useState("");
  const [permissions, setPermissions] = useState<"read" | "write">("read");
  const [branchId, setBranchId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!member;
  const cur = langData[tab];

  useEffect(() => {
    if (member) {
      // Load data from all sibling rows if available
      const sibs = (member as any)._siblings as FamilyMember[] | undefined;
      const newLang: Record<string, LangData> = { en: { name: "", role: "", bio: "" }, zh: { name: "", role: "", bio: "" }, km: { name: "", role: "", bio: "" } };
      if (sibs) {
        for (const s of sibs) {
          if (newLang[s.lang]) newLang[s.lang] = { name: s.name, role: s.role, bio: s.bio };
        }
      } else {
        // Fallback: same data for all langs
        newLang.en = { name: member.name, role: member.role, bio: member.bio };
        newLang.zh = { name: member.name, role: member.role, bio: member.bio };
        newLang.km = { name: member.name, role: member.role, bio: member.bio };
      }
      setLangData(newLang);
      setInitials(member.initials);
      setColor(member.color);
      setAvatar(member.avatar || "");
      setPermissions(member.permissions);
      setBranchId(member.branch_id ?? null);
    } else {
      setLangData({
        en: { name: "", role: "", bio: "" },
        zh: { name: "", role: "", bio: "" },
        km: { name: "", role: "", bio: "" },
      });
      setInitials("");
      setColor("bg-sky-500");
      setAvatar("");
      setPermissions("read");
      setBranchId(null);
    }
  }, [member, open]);

  const setCur = (field: keyof LangData, value: string) => {
    setLangData({ ...langData, [tab]: { ...cur, [field]: value } });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setAvatar(data.url);
    } catch { /* ignore */ }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sibs = (member as any)?._siblings as FamilyMember[] | undefined;
    const groupId = member?.group_id || `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const items = LANGS.map((l) => ({
      id: sibs?.find((s) => s.lang === l)?.id,
      name: langData[l].name,
      role: langData[l].role,
      bio: langData[l].bio,
      initials,
      color,
      avatar,
      permissions,
      branch_id: branchId,
      lang: l,
      group_id: groupId,
    }));
    await onSave({ items });
  };

  const allFilled = LANGS.every((l) => langData[l].name && langData[l].role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? t("member.edit") : t("member.add")}</DialogTitle>
            <DialogDescription>{isEditing ? t("member.editDesc") : t("member.addDesc")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                <Avatar className="h-24 w-24 ring-4 ring-background">
                  <AvatarImage src={avatar || undefined} />
                  <AvatarFallback className={`text-2xl font-bold text-white ${color}`}>{initials || "?"}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <span className="text-xs text-muted-foreground">{t("member.avatarHint")}</span>
            </div>

            {/* Language Tabs */}
            <div className="flex gap-1 border rounded-md p-0.5 bg-muted self-start">
              {LANGS.map((l) => (
                <button type="button" key={l}
                  onClick={() => setTab(l)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
                    tab === l ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {LANG_LABELS[l]}
                  {langData[l].name ? " ✓" : ""}
                </button>
              ))}
            </div>

            {/* Translatable fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("member.name")} * ({LANG_LABELS[tab]})</Label>
                <Input value={cur.name} onChange={(e) => setCur("name", e.target.value)} placeholder={t("member.placeholder.name")} required />
              </div>
              <div className="space-y-2">
                <Label>{t("member.role")} *</Label>
                <Input value={cur.role} onChange={(e) => setCur("role", e.target.value)} placeholder={t("member.placeholder.role")} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("member.bio")}</Label>
              <Textarea value={cur.bio} onChange={(e) => setCur("bio", e.target.value)} placeholder={t("member.placeholder.bio")} rows={2} />
            </div>

            {/* Shared fields */}
            <div className="space-y-2">
              <Label>{t("member.initials")} *</Label>
              <Input value={initials} onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 3))} placeholder={t("member.placeholder.initials")} maxLength={3} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("member.color")}</Label>
                <Select value={color} onValueChange={(v) => setColor(v ?? "bg-sky-500")}>
                  <SelectTrigger><SelectValue placeholder={t("member.placeholder.color")} /></SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}><div className="flex items-center gap-2"><span className={`inline-block h-4 w-4 rounded-full ${c.value}`} />{c.label}</div></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {branches.length > 0 && (
                <div className="space-y-2">
                  <Label>{t("branch.selectBranch")}</Label>
                  <Select value={branchId?.toString() ?? "none"} onValueChange={(v) => setBranchId(v === "none" ? null : Number(v))}>
                    <SelectTrigger><SelectValue placeholder={t("branch.none")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("branch.none")}</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id.toString()}><div className="flex items-center gap-2"><span className={`inline-block h-3 w-3 rounded-full ${b.color}`} />{b.name}</div></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>{t("member.permissions")}</Label>
                <Select value={permissions} onValueChange={(v) => setPermissions((v ?? "read") as "read" | "write")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="write"><div className="flex items-center gap-2"><span>✏️</span> {t("member.permissionWrite")}</div></SelectItem>
                    <SelectItem value="read"><div className="flex items-center gap-2"><span>👁️</span> {t("member.permissionRead")}</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("admin.cancel")}</Button>
            <Button type="submit" disabled={saving || !allFilled || !initials} className="bg-rose-500 hover:bg-rose-600">
              {saving ? t("admin.saving") : isEditing ? t("admin.update") : t("admin.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
