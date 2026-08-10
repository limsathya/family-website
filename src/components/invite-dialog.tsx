"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/language-context";
import { Loader2, Copy, Check, Mail, Key, Ticket } from "lucide-react";

interface InviteResult {
  user: { id: number; name: string; email: string; role: string };
  redeemCode: string;
  tempPassword: string;
}

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: () => void;
}

export function InviteDialog({ open, onOpenChange, onInvited }: InviteDialogProps) {
  const t = useTranslation();
  const [name, setName] = useState("");
  const [nameZh, setNameZh] = useState("");
  const [nameKm, setNameKm] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!name.trim() || !email.trim()) {
      setError(t("profile.error.nameRequired"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role,
          nameZh: nameZh.trim() || undefined,
          nameKm: nameKm.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to invite user");
      } else {
        setResult(data);
        onInvited();
      }
    } catch {
      setError(t("admin.deleteError"));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    } catch { /* ignore */ }
  };

  const handleClose = () => {
    if (!loading) {
      setName("");
      setNameZh("");
      setNameKm("");
      setEmail("");
      setRole("editor");
      setError("");
      setResult(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.user.invite")}</DialogTitle>
          <DialogDescription>{t("admin.user.inviteDesc")}</DialogDescription>
        </DialogHeader>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="inv-name">{t("profile.nameEn")} *</Label>
              <Input
                id="inv-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("profile.placeholder.name")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-namezh">{t("profile.nameZh")}</Label>
              <Input
                id="inv-namezh"
                value={nameZh}
                onChange={(e) => setNameZh(e.target.value)}
                placeholder={t("profile.placeholder.nameZh")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-namekm">{t("profile.nameKm")}</Label>
              <Input
                id="inv-namekm"
                value={nameKm}
                onChange={(e) => setNameKm(e.target.value)}
                placeholder={t("profile.placeholder.nameKm")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-email">{t("login.email")} *</Label>
              <Input
                id="inv-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`name@${process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "limsathya.com"}`}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.user.inviteRole")}</Label>
              <Select value={role} onValueChange={(v) => setRole(v ?? "editor")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t("admin.user.roleAdmin")}</SelectItem>
                  <SelectItem value="editor">{t("admin.user.roleEditor")}</SelectItem>
                  <SelectItem value="viewer">{t("admin.user.roleViewer")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                {t("admin.cancel")}
              </Button>
              <Button type="submit" className="bg-rose-500 hover:bg-rose-600" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("admin.user.invite")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 p-4 text-sm space-y-3">
              <p className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <Check className="h-4 w-4" /> {t("admin.user.invited")}!
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{t("login.email")}</p>
                      <p className="text-sm font-medium truncate">{result.user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => copyToClipboard(result.user.email, "email")}
                  >
                    {copied === "email" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                  <div className="flex items-center gap-2 min-w-0">
                    <Ticket className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{t("admin.redeem.title")}</p>
                      <p className="text-sm font-mono font-bold">{result.redeemCode}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => copyToClipboard(result.redeemCode, "code")}
                  >
                    {copied === "code" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                  <div className="flex items-center gap-2 min-w-0">
                    <Key className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{t("login.password")}</p>
                      <p className="text-sm font-mono">{result.tempPassword}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => copyToClipboard(result.tempPassword, "pwd")}
                  >
                    {copied === "pwd" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">{t("admin.user.inviteNote")}</p>
            </div>

            <Button variant="outline" className="w-full" onClick={handleClose}>
              {t("admin.close")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
