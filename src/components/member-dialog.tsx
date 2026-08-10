"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/language-context";
import type { FamilyMember, Branch } from "@/lib/db";

const COLOR_OPTIONS = [
  { value: "bg-sky-500", label: "Sky Blue" },
  { value: "bg-rose-500", label: "Rose" },
  { value: "bg-violet-500", label: "Violet" },
  { value: "bg-emerald-500", label: "Emerald" },
  { value: "bg-amber-500", label: "Amber" },
  { value: "bg-orange-500", label: "Orange" },
  { value: "bg-pink-500", label: "Pink" },
  { value: "bg-indigo-500", label: "Indigo" },
  { value: "bg-teal-500", label: "Teal" },
  { value: "bg-red-500", label: "Red" },
];

interface MemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: FamilyMember | null;
  branches?: Branch[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: any) => Promise<void>;
  saving: boolean;
}

export function MemberDialog({
  open,
  onOpenChange,
  member,
  branches = [],
  onSave,
  saving,
}: MemberDialogProps) {
  const t = useTranslation();
  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState<number | null>(null);
  const [role, setRole] = useState("");
  const [initials, setInitials] = useState("");
  const [bio, setBio] = useState("");
  const [color, setColor] = useState("bg-sky-500");
  const [avatar, setAvatar] = useState("");
  const [permissions, setPermissions] = useState<"read" | "write">("read");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!member;

  useEffect(() => {
    if (member) {
      setName(member.name);
      setRole(member.role);
      setInitials(member.initials);
      setBio(member.bio);
      setColor(member.color);
      setAvatar(member.avatar || "");
      setPermissions(member.permissions);
      setBranchId(member.branch_id ?? null);
    } else {
      setName("");
      setRole("");
      setInitials("");
      setBio("");
      setColor("bg-sky-500");
      setAvatar("");
      setPermissions("read");
      setBranchId(null);
    }
  }, [member, open]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setAvatar(data.url);
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name,
      role,
      initials,
      bio,
      color,
      avatar,
      permissions,
      branch_id: branchId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t("member.edit") : t("member.add")}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? t("member.editDesc") : t("member.addDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="relative cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar className="h-24 w-24 ring-4 ring-background">
                  <AvatarImage src={avatar || undefined} />
                  <AvatarFallback
                    className={`text-2xl font-bold text-white ${color}`}
                  >
                    {initials || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <span className="text-xs text-muted-foreground">
                {t("member.avatarHint")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("member.name")} *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dad" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">{t("member.role")} *</Label>
                <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Father" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initials">{t("member.initials")} *</Label>
              <Input id="initials" value={initials} onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 3))} placeholder="e.g. DD" maxLength={3} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t("member.bio")}</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short description..." rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("member.color")}</Label>
                <Select value={color} onValueChange={(v) => setColor(v ?? "bg-sky-500")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block h-4 w-4 rounded-full ${c.value}`}
                          />
                          {c.label}
                        </div>
                      </SelectItem>
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
                        <SelectItem key={b.id} value={b.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span className={`inline-block h-3 w-3 rounded-full ${b.color}`} />
                            {b.name} <span className="text-xs text-muted-foreground capitalize">({b.type})</span>
                          </div>
                        </SelectItem>
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
                    <SelectItem value="write">
                      <div className="flex items-center gap-2"><span>✏️</span> {t("member.permissionWrite")}</div>
                    </SelectItem>
                    <SelectItem value="read">
                      <div className="flex items-center gap-2"><span>👁️</span> {t("member.permissionRead")}</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {t("admin.cancel")}
            </Button>
            <Button type="submit" disabled={saving || !name || !role || !initials} className="bg-rose-500 hover:bg-rose-600">
              {saving ? t("admin.saving") : isEditing ? t("admin.update") : t("admin.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
