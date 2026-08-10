"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n/language-context";
import { Loader2, User, Check } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const t = useTranslation();
  const { user, loading: authLoading, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [nameZh, setNameZh] = useState("");
  const [nameKm, setNameKm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setNameZh(user.name_zh || "");
      setNameKm(user.name_km || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    if (!name.trim()) {
      setError(t("profile.error.nameRequired"));
      return;
    }

    setSaving(true);
    const result = await updateProfile({
      name: name.trim(),
      name_zh: nameZh.trim() || null,
      name_km: nameKm.trim() || null,
    });
    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-[80vh] flex items-start justify-center px-4 pt-16 pb-16">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <div className="h-16 w-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <User className="h-8 w-8 text-rose-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("profile.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("profile.description")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("profile.editTitle")}</CardTitle>
            <CardDescription>{t("profile.editDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}
              {saved && (
                <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <Check className="h-4 w-4" /> {t("profile.saved")}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">{t("profile.nameEn")} *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("profile.placeholder.name")} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameZh">{t("profile.nameZh")}</Label>
                <Input id="nameZh" value={nameZh} onChange={(e) => setNameZh(e.target.value)} placeholder={t("profile.placeholder.nameZh")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameKm">{t("profile.nameKm")}</Label>
                <Input id="nameKm" value={nameKm} onChange={(e) => setNameKm(e.target.value)} placeholder={t("profile.placeholder.nameKm")} />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{t("profile.email")}</Label>
                <Input value={user.email} disabled className="opacity-60" />
                <p className="text-xs text-muted-foreground">{t("profile.emailHint")}</p>
              </div>

              <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {saved ? t("profile.saved") : t("profile.save")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
