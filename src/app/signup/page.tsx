"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n/language-context";
import { Heart, Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const t = useTranslation();
  const { user, loading: authLoading, signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace("/admin");
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("signup.error.passwordMismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("signup.error.passwordLength"));
      return;
    }

    setLoading(true);
    try {
      const result = await signup(name, email, password);
      if (result.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch {
      setError(t("signup.error.generic"));
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (user) return null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2"><Heart className="h-8 w-8 text-rose-500 fill-rose-500" /></div>
          <CardTitle className="text-2xl">{t("signup.title")}</CardTitle>
          <CardDescription>{t("signup.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="name">{t("signup.name")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("signup.placeholder.name")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("signup.email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("signup.placeholder.email")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("signup.password")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("signup.placeholder.password")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("signup.confirmPassword")}</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t("signup.placeholder.confirmPassword")} required />
            </div>
            <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{t("signup.submit")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("signup.hasAccount")}{" "}
              <Link href="/login" className="text-rose-500 hover:underline">{t("signup.signIn")}</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
