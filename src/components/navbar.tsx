"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, LogOut, User, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

function useIsActive(href: string) {
  const pathname = usePathname();
  if (href === "/") return pathname === "/";
  if (href.startsWith("/#")) return pathname === "/";
  return pathname.startsWith(href);
}

function NavLink({ href, label, onClick, mobile }: {
  href: string;
  label: string;
  onClick?: () => void;
  mobile?: boolean;
}) {
  const active = useIsActive(href);
  return (
    <Link
      href={href}
      scroll={href.startsWith("/#")}
      onClick={onClick}
      className={
        mobile
          ? `text-lg font-medium transition-colors ${active ? "text-rose-500" : "hover:text-rose-500"}`
          : `text-sm font-medium transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`
      }
    >
      {label}
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const t = useTranslation();
  const [logoUrl, setLogoUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const publicLinks = useMemo(() => [
    { href: "/", label: t("nav.home") },
    { href: "/#family", label: t("nav.family") },
    { href: "/#gallery", label: t("nav.gallery") },
    { href: "/#events", label: t("nav.events") },
  ], [t]);

  const adminLink = useMemo(() => ({ href: "/admin", label: t("nav.admin") }), [t]);

  useEffect(() => {
    fetch("/api/settings/logo")
      .then((res) => res.json())
      .then((data) => setLogoUrl(data.logo || ""))
      .catch(() => {});
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.status === 401) return;
      const data = await res.json();
      if (data.url) {
        setLogoUrl(data.url);
        await fetch("/api/settings/logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logo: data.url }),
        });
      }
    } catch { /* ignore */ }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 font-semibold text-lg">
          {logoUrl ? (
            <Avatar className="h-8 w-8 ring-2 ring-rose-200">
              <AvatarImage src={logoUrl} alt={t("nav.logoAlt")} />
              <AvatarFallback className="bg-rose-100 text-rose-500 text-xs">
                <Heart className="h-4 w-4 fill-rose-500" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
          )}
          <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
            {t("nav.ourFamily")}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5">
          {publicLinks.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
          {!loading && user && (
            <NavLink href={adminLink.href} label={adminLink.label} />
          )}

          <div className="flex items-center gap-2 ml-4 pl-4 border-l">
            <ThemeToggle />
            <LanguageSwitcher />
            {user && (
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" />{t("nav.logo")}
              </Button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

            {loading ? null : user ? (
              <div className="flex items-center gap-3">
                <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  {user.name}
                </Link>
                <Button variant="ghost" size="sm" onClick={logout} className="gap-1">
                  <LogOut className="h-3.5 w-3.5" />{t("nav.logout")}
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  <User className="h-3.5 w-3.5 mr-1" />{t("nav.login")}
                </Button>
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="md:hidden" render={<Button variant="ghost" size="icon" />}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right">
            <nav className="flex flex-col gap-4 mt-8">
              {publicLinks.map((link) => (
                <NavLink key={link.href} href={link.href} label={link.label} mobile onClick={() => setOpen(false)} />
              ))}
              {!loading && user && (
                <NavLink href={adminLink.href} label={adminLink.label} mobile onClick={() => setOpen(false)} />
              )}
              <div className="flex items-center gap-2 py-2">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
              <div className="border-t pt-4 mt-2">
                {loading ? null : user ? (
                  <>
                    <Link href="/admin" onClick={() => setOpen(false)} className="text-sm text-muted-foreground mb-2 block hover:text-foreground">
                      {t("nav.signedInAs")} {user.name}
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}
                      className="gap-1 w-full justify-start mb-2">
                      <Upload className="h-4 w-4" />{t("nav.uploadLogo")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { logout(); setOpen(false); }}
                      className="gap-1 w-full">
                      <LogOut className="h-4 w-4" />{t("nav.logout")}
                    </Button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setOpen(false)} className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      <User className="h-4 w-4 mr-1" />{t("nav.login")}
                    </Button>
                  </Link>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
