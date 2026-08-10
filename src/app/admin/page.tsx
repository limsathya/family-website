"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation, useLanguage } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Pencil, Trash2, Plus, ArrowLeft, ShieldCheck, Shield, Loader2, Home,
  CalendarDays, Clock, MapPin, Users, Camera, Image, Star, Settings, GitBranch, FileText,
  UserCog, KeyRound, Copy, Check, Heart,
} from "lucide-react";
import { MemberDialog } from "@/components/member-dialog";
import { EventDialog } from "@/components/event-dialog";
import { GalleryDialog } from "@/components/gallery-dialog";
import { ValueDialog } from "@/components/value-dialog";
import { BranchDialog } from "@/components/branch-dialog";
import { InviteDialog } from "@/components/invite-dialog";
import { useAuth } from "@/lib/auth-context";
import { useDisplayName, getDisplayName } from "@/lib/display-name";
import { useToast } from "@/lib/toast";
import { usePolling } from "@/lib/use-polling";
import { groupByLang } from "@/lib/group-by-lang";
import type {
  FamilyMember, FamilyEvent, GalleryItem, FamilyValue, Branch,
} from "@/lib/db";

const PERMISSION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  write: ShieldCheck,
  read: Shield,
};

// Map Tailwind color class names to actual hex values for inline styles
const borderColorMap: Record<string, string> = {
  "border-l-rose-500": "#f43f5e",
  "border-l-violet-500": "#8b5cf6",
  "border-l-emerald-500": "#10b981",
  "border-l-amber-500": "#f59e0b",
  "border-l-sky-500": "#0ea5e9",
  "border-l-pink-500": "#ec4899",
  "border-l-orange-500": "#f97316",
  "border-l-indigo-500": "#6366f1",
};

const bgColorMap: Record<string, string> = {
  "bg-rose-500": "#f43f5e",
  "bg-violet-500": "#8b5cf6",
  "bg-emerald-500": "#10b981",
  "bg-amber-500": "#f59e0b",
  "bg-sky-500": "#0ea5e9",
  "bg-pink-500": "#ec4899",
  "bg-orange-500": "#f97316",
  "bg-indigo-500": "#6366f1",
  "bg-rose-600": "#e11d48",
  "bg-rose-400": "#fb7185",
};

type HeroData = { title: string; subtitle: string; ctaPrimary: string; ctaSecondary: string };
type MetaData = { siteTitle: string; siteDescription: string; ogImage: string; familySectionTitle: string; familySectionSubtitle: string; valuesSectionTitle: string; valuesSectionSubtitle: string; gallerySectionTitle: string; gallerySectionSubtitle: string; eventsSectionTitle: string; eventsSectionSubtitle: string };

const LANGUAGES: Language[] = ["en", "zh", "km"];
const LANG_LABELS: Record<string, string> = { en: "EN", zh: "中文", km: "ខ្មែរ" };

const emptyHero: HeroData = { title: "", subtitle: "", ctaPrimary: "", ctaSecondary: "" };
const emptyMeta: MetaData = { siteTitle: "", siteDescription: "", ogImage: "", familySectionTitle: "", familySectionSubtitle: "", valuesSectionTitle: "", valuesSectionSubtitle: "", gallerySectionTitle: "", gallerySectionSubtitle: "", eventsSectionTitle: "", eventsSectionSubtitle: "" };

export default function AdminPage() {
  const t = useTranslation();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const displayName = useDisplayName();
  const { showToast } = useToast();
  const { lang: language } = useLanguage();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [values, setValues] = useState<FamilyValue[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [heroByLang, setHeroByLang] = useState<Record<string, HeroData>>({ en: { ...emptyHero }, zh: { ...emptyHero }, km: { ...emptyHero } });
  const [metaByLang, setMetaByLang] = useState<Record<string, MetaData>>({ en: { ...emptyMeta }, zh: { ...emptyMeta }, km: { ...emptyMeta } });
  const [loading, setLoading] = useState(true);
  const [adminLang, setAdminLang] = useState<Language>("en");
  const [users, setUsers] = useState<Array<{ id: number; name: string; name_zh: string | null; name_km: string | null; email: string; is_active: number; role: string; created_at: string }>>([]);
  const [redeemCodes, setRedeemCodes] = useState<Array<{ id: number; code: string; used_by: number | null; used_at: string | null; max_uses: number; use_count: number; expires_at: string | null; created_at: string }>>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Dialog states
  const [memberOpen, setMemberOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [valueOpen, setValueOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [editingEvent, setEditingEvent] = useState<FamilyEvent | null>(null);
  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
  const [editingValue, setEditingValue] = useState<FamilyValue | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      // Fetch ALL rows (no lang filter) so we can group by group_id
      const [mRes, eRes, gRes, vRes, bRes] = await Promise.all([
        fetch("/api/members"),
        fetch("/api/events"),
        fetch("/api/gallery"),
        fetch("/api/values"),
        fetch("/api/branches"),
      ]);
      const allMembers: FamilyMember[] = await mRes.json();
      const allEvents: FamilyEvent[] = await eRes.json();
      const allGallery: GalleryItem[] = await gRes.json();
      const allValues: FamilyValue[] = await vRes.json();
      const allBranches: Branch[] = await bRes.json();

      // Group by group_id and show one representative per group (prefer adminLang)
      setMembers(groupByLang(allMembers, adminLang));
      setEvents(groupByLang(allEvents, adminLang));
      setGallery(groupByLang(allGallery, adminLang));
      setValues(groupByLang(allValues, adminLang));
      setBranches(groupByLang(allBranches, adminLang));

      // Fetch hero & meta for all languages
      const heroResults = await Promise.all(
        LANGUAGES.map((l) => fetch(`/api/settings/hero?lang=${l}`).then(r => r.json()))
      );
      const metaResults = await Promise.all(
        LANGUAGES.map((l) => fetch(`/api/settings/meta?lang=${l}`).then(r => r.json()))
      );
      setHeroByLang({ en: heroResults[0], zh: heroResults[1], km: heroResults[2] });
      setMetaByLang({ en: metaResults[0], zh: metaResults[1], km: metaResults[2] });

      // Fetch users & redeem codes
      const [uRes, rcRes] = await Promise.all([
        fetch("/api/admin/users"), fetch("/api/admin/redeem-codes"),
      ]);
      setUsers(await uRes.json());
      setRedeemCodes(await rcRes.json());
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [adminLang]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (user) fetchAll();
  }, [user, authLoading, router, fetchAll]);

  // Poll for real-time updates every 15 seconds
  usePolling(fetchAll, 15000, !!user);

  // Helper to attach lang to CRUD data
  const withLang = (data: unknown) => ({ ...(data as object), lang: adminLang });

  // --- CRUD helpers ---
  const apiCrud = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`${method} ${url} failed`);
    return res.json();
  };

  // Creates one row per language, returns after all succeed
  const handleCreate = (base: string, setOpen: (v: boolean) => void) => async (data: unknown) => {
    setSaving(true);
    try {
      const d = data as { items?: Array<Record<string, unknown>> };
      if (d.items) {
        for (const item of d.items) {
          await apiCrud(`/api/${base}`, "POST", item);
        }
      } else {
        await apiCrud(`/api/${base}`, "POST", withLang(data));
      }
      await fetchAll();
      setOpen(false);
      showToast(t("admin.saved"), "success");
    } finally { setSaving(false); }
  };

  const handleUpdate = (base: string, _id: number, setOpen: (v: boolean) => void) => async (data: unknown) => {
    setSaving(true);
    try {
      const d = data as { items?: Array<Record<string, unknown> & { id?: number }> };
      if (d.items && d.items.length > 0) {
        for (const item of d.items) {
          const itemId = item.id;
          if (!itemId) continue;
          // Remove id from body — it's in the URL
          const { id: _unused, ...body } = item;
          await apiCrud(`/api/${base}/${itemId}`, "PUT", body);
        }
      } else {
        await apiCrud(`/api/${base}/${_id}`, "PUT", withLang(data));
      }
      await fetchAll();
      setOpen(false);
      showToast(t("admin.updated"), "success");
    } catch (err) {
      console.error("Update error:", err);
      showToast(t("admin.deleteError"), "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async (base: string, id: number) => {
    if (!confirm(t("admin.deleteConfirm"))) return;
    try {
      await apiCrud(`/api/${base}/${id}`, "DELETE");
      await fetchAll();
      showToast(t("admin.deleted"), "success");
    } catch (err) {
      console.error("Delete error:", err);
      showToast(t("admin.deleteError"), "error");
    }
  };

  const handleSaveHero = async (lang: string) => {
    const hero = heroByLang[lang];
    if (!hero) return;
    setSaving(true);
    try {
      await apiCrud("/api/settings/hero", "POST", { ...hero, lang });
      showToast(t("admin.hero.saved"), "success");
    } catch (err) {
      console.error("Hero save error:", err);
      showToast(t("admin.hero.saveError"), "error");
    } finally { setSaving(false); }
  };

  const handleSaveMeta = async (lang: string) => {
    const meta = metaByLang[lang];
    if (!meta) return;
    setSaving(true);
    try {
      await apiCrud("/api/settings/meta", "POST", { ...meta, lang });
      showToast(t("admin.hero.saved"), "success");
    } catch (err) {
      console.error("Meta save error:", err);
      showToast(t("admin.hero.saveError"), "error");
    } finally { setSaving(false); }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-4 mb-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
            <Home className="h-3.5 w-3.5" />
            {t("nav.home")}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{t("nav.admin")}</span>
        </div>

        {/* Top bar: back + title + user info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" type="button"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("admin.title")}</h1>
              <p className="text-muted-foreground mt-1">{t("admin.subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-muted/30">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>
        <Separator />
        {/* Action buttons — full width but with min-w to prevent crowding */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setEditingMember(null); setMemberOpen(true); }} size="sm" className="bg-rose-500 hover:bg-rose-600"><Plus className="mr-1 h-4 w-4" />{t("admin.addMember")}</Button>
          <Button onClick={() => { setEditingEvent(null); setEventOpen(true); }} size="sm" className="bg-rose-500 hover:bg-rose-600"><Plus className="mr-1 h-4 w-4" />{t("admin.addEvent")}</Button>
          <Button onClick={() => { setEditingGallery(null); setGalleryOpen(true); }} size="sm" className="bg-rose-500 hover:bg-rose-600"><Plus className="mr-1 h-4 w-4" />{t("admin.addPhoto")}</Button>
          <Button onClick={() => { setEditingValue(null); setValueOpen(true); }} size="sm" className="bg-rose-500 hover:bg-rose-600"><Plus className="mr-1 h-4 w-4" />{t("admin.addValue")}</Button>
          <Button onClick={() => { setEditingBranch(null); setBranchOpen(true); }} size="sm" className="bg-rose-500 hover:bg-rose-600"><Plus className="mr-1 h-4 w-4" />{t("admin.addBranch")}</Button>
        </div>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="members"><Users className="h-4 w-4 mr-1" />{t("admin.tab.members")}</TabsTrigger>
          <TabsTrigger value="events"><CalendarDays className="h-4 w-4 mr-1" />{t("admin.tab.events")}</TabsTrigger>
          <TabsTrigger value="gallery"><Image className="h-4 w-4 mr-1" />{t("admin.tab.gallery")}</TabsTrigger>
          <TabsTrigger value="values"><Star className="h-4 w-4 mr-1" />{t("admin.tab.values")}</TabsTrigger>
          <TabsTrigger value="hero"><Settings className="h-4 w-4 mr-1" />{t("admin.tab.hero")}</TabsTrigger>
          <TabsTrigger value="meta"><FileText className="h-4 w-4 mr-1" />{t("admin.tab.meta")}</TabsTrigger>
          <TabsTrigger value="branches"><GitBranch className="h-4 w-4 mr-1" />{t("admin.tab.branches")}</TabsTrigger>
          <TabsTrigger value="users"><UserCog className="h-4 w-4 mr-1" />{t("admin.tab.users")}</TabsTrigger>
          <TabsTrigger value="redeem"><KeyRound className="h-4 w-4 mr-1" />{t("admin.tab.redeem")}</TabsTrigger>
        </TabsList>

        {/* Members */}
        <TabsContent value="members">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => {
              const PermIcon = PERMISSION_ICONS[m.permissions] || Shield;
              return (
                <Card key={m.id} className={`group transition-all hover:shadow-md ${m.in_memoriam ? "border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/10" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-12 w-12 ring-2 ring-background ${m.in_memoriam ? "grayscale" : ""}`}>
                          <AvatarImage src={m.avatar || undefined} />
                          <AvatarFallback className={`text-lg font-bold text-white ${m.color}`}>{m.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{m.name}</CardTitle>
                            {m.in_memoriam ? <Heart className="h-4 w-4 fill-amber-500 text-amber-500" /> : null}
                          </div>
                          <Badge variant="outline" className="mt-1">{t(`member.role.${m.role}` as any) || m.role}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={async () => {
                          await apiCrud(`/api/members/${m.id}`, "PATCH");
                          fetchAll();
                        }} className="h-8 w-8" title={m.in_memoriam ? t("admin.member.unmarkMemoriam") : t("admin.member.markMemoriam")}>
                          <Heart className={`h-4 w-4 ${m.in_memoriam ? "fill-amber-500 text-amber-500" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingMember(m); setMemberOpen(true); }} className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete("members", m.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-1">{m.bio}</p>
                    {(m.born_year || m.dob) ? (
                      <p className="text-xs text-muted-foreground mb-2">
                        {m.dob ? `${new Date(m.dob + "T00:00:00").getFullYear()}${m.dod ? ` – ${new Date(m.dod + "T00:00:00").getFullYear()}` : ""}` : `${t("member.bornYear")}: ${m.born_year}`}
                      </p>
                    ) : null}
                    <Badge variant={m.permissions === "write" ? "default" : "secondary"} className="gap-1"><PermIcon className="h-3 w-3" />{m.permissions === "write" ? t("family.canEdit") : t("family.readOnly")}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {members.length === 0 && (
            <EmptyState
              msg={t("admin.empty.members")}
              action={{ label: t("admin.addMember"), onClick: () => { setEditingMember(null); setMemberOpen(true); } }}
            />
          )}
        </TabsContent>

        {/* Events */}
        <TabsContent value="events">
          <div className="space-y-4">
            {events.map((e) => {
              const borderColor = borderColorMap[e.color] || "#f43f5e";
              return (
                <Card key={e.id} className="border-l-4 group transition-all hover:shadow-md" style={{ borderLeftColor: borderColor }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3"><span className="text-2xl">{e.icon}</span><CardTitle className="text-lg">{e.title}</CardTitle></div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingEvent(e); setEventOpen(true); }} className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete("events", e.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{e.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{e.date}</span>
                      {e.time && <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{e.time}</span>}
                      {e.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{e.location}</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {events.length === 0 && (
            <EmptyState
              msg={t("admin.empty.events")}
              action={{ label: t("admin.addEvent"), onClick: () => { setEditingEvent(null); setEventOpen(true); } }}
            />
          )}
        </TabsContent>

        {/* Gallery */}
        <TabsContent value="gallery">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gallery.map((g) => (
              <Card key={g.id} className="group transition-all hover:shadow-md overflow-hidden">
                <div className={`h-40 bg-gradient-to-br ${g.gradient} flex items-center justify-center`}>
                  {g.image ? <img src={g.image} alt={g.title} className="h-full w-full object-cover" /> : <Camera className="h-10 w-10 text-white/70" />}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{g.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{g.description}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingGallery(g); setGalleryOpen(true); }} className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete("gallery", g.id)} className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <Badge variant="secondary" className="mt-2 capitalize text-xs">{t(`galleryDialog.category.${g.category}` as any) || g.category}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          {gallery.length === 0 && (
            <EmptyState
              msg={t("admin.empty.gallery")}
              action={{ label: t("admin.addPhoto"), onClick: () => { setEditingGallery(null); setGalleryOpen(true); } }}
            />
          )}
        </TabsContent>

        {/* Values */}
        <TabsContent value="values">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <Card key={v.id} className="group transition-all hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className={`mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${v.gradient} text-white`}>
                      <Star className="h-5 w-5" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingValue(v); setValueOpen(true); }} className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete("values", v.id)} className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <CardTitle className="text-base">{v.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">{v.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">Icon: {v.icon}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {values.length === 0 && (
            <EmptyState
              msg={t("admin.empty.values")}
              action={{ label: t("admin.addValue"), onClick: () => { setEditingValue(null); setValueOpen(true); } }}
            />
          )}
        </TabsContent>

        {/* Hero Settings */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("admin.hero.title")}</CardTitle>
                <div className="flex gap-1 border rounded-md p-0.5 bg-muted">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l}
                      onClick={() => setAdminLang(l)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
                        adminLang === l ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {LANG_LABELS[l]}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("admin.hero.titleLabel")} ({LANG_LABELS[adminLang]})</Label>
                <Input value={heroByLang[adminLang]?.title || ""} onChange={(e) => setHeroByLang({ ...heroByLang, [adminLang]: { ...heroByLang[adminLang], title: e.target.value } })} placeholder={t("admin.hero.placeholder.title")} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.hero.subtitleLabel")}</Label>
                <Textarea value={heroByLang[adminLang]?.subtitle || ""} onChange={(e) => setHeroByLang({ ...heroByLang, [adminLang]: { ...heroByLang[adminLang], subtitle: e.target.value } })} rows={3} placeholder={t("admin.hero.placeholder.subtitle")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.hero.ctaPrimaryLabel")}</Label>
                  <Input value={heroByLang[adminLang]?.ctaPrimary || ""} onChange={(e) => setHeroByLang({ ...heroByLang, [adminLang]: { ...heroByLang[adminLang], ctaPrimary: e.target.value } })} placeholder={t("admin.hero.placeholder.ctaPrimary")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.hero.ctaSecondaryLabel")}</Label>
                  <Input value={heroByLang[adminLang]?.ctaSecondary || ""} onChange={(e) => setHeroByLang({ ...heroByLang, [adminLang]: { ...heroByLang[adminLang], ctaSecondary: e.target.value } })} placeholder={t("admin.hero.placeholder.ctaSecondary")} />
                </div>
              </div>
              <Button onClick={() => handleSaveHero(adminLang)} disabled={saving} className="bg-rose-500 hover:bg-rose-600">
                {saving ? t("admin.saving") : t("admin.hero.save")} ({LANG_LABELS[adminLang]})
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Site Metadata */}
        <TabsContent value="meta">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("admin.meta.title")}</CardTitle>
                <div className="flex gap-1 border rounded-md p-0.5 bg-muted">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l}
                      onClick={() => setAdminLang(l)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
                        adminLang === l ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {LANG_LABELS[l]}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.meta.siteTitle")} ({LANG_LABELS[adminLang]})</Label>
                  <Input value={metaByLang[adminLang]?.siteTitle || ""} onChange={(e) => setMetaByLang({ ...metaByLang, [adminLang]: { ...metaByLang[adminLang], siteTitle: e.target.value } })} placeholder={t("admin.meta.placeholder.siteTitle")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.meta.siteDescription")}</Label>
                  <Input value={metaByLang[adminLang]?.siteDescription || ""} onChange={(e) => setMetaByLang({ ...metaByLang, [adminLang]: { ...metaByLang[adminLang], siteDescription: e.target.value } })} placeholder={t("admin.meta.placeholder.siteDescription")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("admin.meta.ogImage")}</Label>
                <Input value={metaByLang[adminLang]?.ogImage || ""} onChange={(e) => setMetaByLang({ ...metaByLang, [adminLang]: { ...metaByLang[adminLang], ogImage: e.target.value } })} placeholder={t("admin.meta.placeholder.ogImage")} />
              </div>
              <Separator />
              <h3 className="font-semibold">{t("admin.meta.sectionTitles")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.meta.familyTitle")}</Label>
                  <Input value={metaByLang[adminLang]?.familySectionTitle || ""} onChange={(e) => setMetaByLang({ ...metaByLang, [adminLang]: { ...metaByLang[adminLang], familySectionTitle: e.target.value } })} placeholder={t("admin.meta.placeholder.familyTitle")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.meta.familySubtitle")}</Label>
                  <Input value={metaByLang[adminLang]?.familySectionSubtitle || ""} onChange={(e) => setMetaByLang({ ...metaByLang, [adminLang]: { ...metaByLang[adminLang], familySectionSubtitle: e.target.value } })} placeholder={t("admin.meta.placeholder.familySubtitle")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.meta.valuesTitle")}</Label>
                  <Input value={metaByLang[adminLang]?.valuesSectionTitle || ""} onChange={(e) => setMetaByLang({ ...metaByLang, [adminLang]: { ...metaByLang[adminLang], valuesSectionTitle: e.target.value } })} placeholder={t("admin.meta.placeholder.valuesTitle")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.meta.valuesSubtitle")}</Label>
                  <Input value={metaByLang[adminLang]?.valuesSectionSubtitle || ""} onChange={(e) => setMetaByLang({ ...metaByLang, [adminLang]: { ...metaByLang[adminLang], valuesSectionSubtitle: e.target.value } })} placeholder={t("admin.meta.placeholder.valuesSubtitle")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.meta.galleryTitle")}</Label>
                  <Input value={metaByLang[adminLang]?.gallerySectionTitle || ""} onChange={(e) => setMetaByLang({ ...metaByLang, [adminLang]: { ...metaByLang[adminLang], gallerySectionTitle: e.target.value } })} placeholder={t("admin.meta.placeholder.galleryTitle")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.meta.gallerySubtitle")}</Label>
                  <Input value={metaByLang[adminLang]?.gallerySectionSubtitle || ""} onChange={(e) => setMetaByLang({ ...metaByLang, [adminLang]: { ...metaByLang[adminLang], gallerySectionSubtitle: e.target.value } })} placeholder={t("admin.meta.placeholder.gallerySubtitle")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.meta.eventsTitle")}</Label>
                  <Input value={metaByLang[adminLang]?.eventsSectionTitle || ""} onChange={(e) => setMetaByLang({ ...metaByLang, [adminLang]: { ...metaByLang[adminLang], eventsSectionTitle: e.target.value } })} placeholder={t("admin.meta.placeholder.eventsTitle")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.meta.eventsSubtitle")}</Label>
                  <Input value={metaByLang[adminLang]?.eventsSectionSubtitle || ""} onChange={(e) => setMetaByLang({ ...metaByLang, [adminLang]: { ...metaByLang[adminLang], eventsSectionSubtitle: e.target.value } })} placeholder={t("admin.meta.placeholder.eventsSubtitle")} />
                </div>
              </div>
              <Button onClick={() => handleSaveMeta(adminLang)} disabled={saving} className="bg-rose-500 hover:bg-rose-600">
                {saving ? t("admin.saving") : t("admin.meta.save")} ({LANG_LABELS[adminLang]})
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branches */}
        <TabsContent value="branches">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {branches.map((b) => (
              <Card key={b.id} className="border-l-4 group transition-all hover:shadow-md" style={{ borderLeftColor: bgColorMap[b.color] || "#f43f5e" }}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full ${b.color} flex items-center justify-center text-white font-bold text-sm`}>
                        {b.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{b.name}</CardTitle>
                        <Badge variant="outline" className="mt-1 capitalize">{b.type}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingBranch(b); setBranchOpen(true); }} className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete("branches", b.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{b.description || t("branch.noDescription")}</p>
                  <p className="text-xs text-muted-foreground mt-2">{members.filter(m => m.branch_id === b.id).length} {t("branch.membersCount")}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {branches.length === 0 && (
            <EmptyState
              msg={t("admin.empty.branches")}
              action={{ label: t("admin.addBranch"), onClick: () => { setEditingBranch(null); setBranchOpen(true); } }}
            />
          )}
        </TabsContent>

        {/* Users Management */}
        <TabsContent value="users">
          <div className="flex items-center gap-2 mb-4">
            {user?.role === "admin" && (
              <Button size="sm" className="bg-rose-500 hover:bg-rose-600" onClick={() => setInviteOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" />{t("admin.user.invite")}
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {users.map((u) => {
              const userName = getDisplayName(u.name, u.name_zh, u.name_km, language);
              return (
              <Card key={u.id} className="group transition-all hover:shadow-md">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${u.is_active ? "bg-emerald-500" : "bg-gray-400"}`}>
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{userName}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={u.is_active ? "default" : "secondary"} className="text-[10px]">
                          {u.is_active ? t("admin.user.active") : t("admin.user.inactive")}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {u.role === "admin" ? t("admin.user.roleAdmin") : u.role === "viewer" ? t("admin.user.roleViewer") : t("admin.user.roleEditor")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user?.role === "admin" && u.id !== user?.id && (
                      <>
                        <Button variant="outline" size="sm" onClick={async () => {
                          await apiCrud("/api/admin/users", "PUT", { id: u.id, toggleActive: true });
                          fetchAll();
                        }}>{u.is_active ? t("admin.user.deactivate") : t("admin.user.activate")}</Button>
                        <Select value={u.role} onValueChange={async (v) => {
                          await apiCrud("/api/admin/users", "PUT", { id: u.id, role: v });
                          fetchAll();
                        }}>
                          <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{t("admin.user.roleAdmin")}</SelectItem>
                            <SelectItem value="editor">{t("admin.user.roleEditor")}</SelectItem>
                            <SelectItem value="viewer">{t("admin.user.roleViewer")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                          if (!confirm(t("admin.user.deleteConfirm"))) return;
                          await apiCrud(`/api/admin/users?id=${u.id}`, "DELETE");
                          fetchAll();
                        }}><Trash2 className="h-4 w-4" /></Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
          {users.length === 0 && <EmptyState msg={t("admin.empty.users")} />}
        </TabsContent>

        {/* Redeem Codes — Admin Only */}
        <TabsContent value="redeem">
          {user?.role !== "admin" ? (
            <EmptyState msg={t("admin.redeem.adminOnly")} />
          ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle>{t("admin.redeem.title")}</CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" min={1} max={999} defaultValue={1}
                    className="w-16 h-8 text-xs"
                    placeholder={t("admin.redeem.maxUses")}
                    id="rc-maxUses"
                  />
                  <Input
                    type="number" min={1} max={3650} defaultValue={30}
                    className="w-16 h-8 text-xs"
                    placeholder={t("admin.redeem.expiryDays")}
                    id="rc-expiryDays"
                  />
                  <Input
                    type="number" min={1} max={50} defaultValue={1}
                    className="w-14 h-8 text-xs"
                    placeholder={t("admin.redeem.count")}
                    id="rc-count"
                  />
                  <Button size="sm" className="bg-rose-500 hover:bg-rose-600" onClick={async () => {
                    const maxUses = parseInt((document.getElementById("rc-maxUses") as HTMLInputElement)?.value || "1");
                    const expiryDays = parseInt((document.getElementById("rc-expiryDays") as HTMLInputElement)?.value || "30");
                    const count = parseInt((document.getElementById("rc-count") as HTMLInputElement)?.value || "1");
                    const res = await apiCrud("/api/admin/redeem-codes", "POST", { count, maxUses, expiresInDays: expiryDays });
                    await fetchAll();
                    if (res.codes?.length) {
                      const codesStr = res.codes.join(", ");
                      setCopiedCode(codesStr);
                      navigator.clipboard.writeText(codesStr);
                      showToast(`${t("admin.redeem.generated")}: ${codesStr}`, "success");
                      setTimeout(() => setCopiedCode(null), 3000);
                    }
                  }}>
                    <Plus className="mr-1 h-3.5 w-3.5" />{t("admin.redeem.generate")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {redeemCodes.map((rc) => {
                  const expired = rc.expires_at && new Date(rc.expires_at + "Z") < new Date();
                  const exhausted = rc.use_count >= rc.max_uses;
                  const usedByUser = rc.used_by ? users.find((u) => u.id === rc.used_by) : null;
                  return (
                    <div key={rc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-muted/20 gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="text-sm font-mono font-bold bg-muted px-2 py-1 rounded">{rc.code}</code>
                        <span className="text-xs text-muted-foreground">
                          {t("admin.redeem.used")}: {rc.use_count}/{rc.max_uses}
                        </span>
                        {usedByUser && (
                          <Badge variant="secondary" className="text-[10px]">
                            {usedByUser.email}
                          </Badge>
                        )}
                        {rc.expires_at && (
                          <Badge variant={expired ? "destructive" : "outline"} className="text-[10px]">
                            {expired ? t("admin.redeem.expired") : t("admin.redeem.expires")}: {rc.expires_at}
                          </Badge>
                        )}
                        {(exhausted || expired) && <Badge variant="secondary" className="text-[10px]">{t("admin.redeem.unusable")}</Badge>}
                      </div>
                      <div className="flex gap-1 self-end sm:self-auto">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                          navigator.clipboard.writeText(rc.code);
                          setCopiedCode(rc.code);
                          setTimeout(() => setCopiedCode(null), 2000);
                        }}>
                          {copiedCode === rc.code ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => {
                          await apiCrud(`/api/admin/redeem-codes?id=${rc.id}`, "DELETE");
                          await fetchAll();
                        }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {redeemCodes.length === 0 && <EmptyState msg={t("admin.empty.redeem")} />}
            </CardContent>
          </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <MemberDialog open={memberOpen} onOpenChange={(o) => { setMemberOpen(o); if (!o) setEditingMember(null); }} member={editingMember} branches={branches} onSave={editingMember ? handleUpdate("members", editingMember.id, setMemberOpen) : handleCreate("members", setMemberOpen)} saving={saving} />
      <EventDialog open={eventOpen} onOpenChange={(o) => { setEventOpen(o); if (!o) setEditingEvent(null); }} event={editingEvent} onSave={editingEvent ? handleUpdate("events", editingEvent.id, setEventOpen) : handleCreate("events", setEventOpen)} saving={saving} />
      <GalleryDialog open={galleryOpen} onOpenChange={(o) => { setGalleryOpen(o); if (!o) setEditingGallery(null); }} item={editingGallery} onSave={editingGallery ? handleUpdate("gallery", editingGallery.id, setGalleryOpen) : handleCreate("gallery", setGalleryOpen)} saving={saving} />
      <ValueDialog open={valueOpen} onOpenChange={(o) => { setValueOpen(o); if (!o) setEditingValue(null); }} value={editingValue} onSave={editingValue ? handleUpdate("values", editingValue.id, setValueOpen) : handleCreate("values", setValueOpen)} saving={saving} />
      <BranchDialog open={branchOpen} onOpenChange={(o) => { setBranchOpen(o); if (!o) setEditingBranch(null); }} branch={editingBranch} onSave={editingBranch ? handleUpdate("branches", editingBranch.id, setBranchOpen) : handleCreate("branches", setBranchOpen)} saving={saving} />
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} onInvited={fetchAll} />
    </div>
  );
}

function EmptyState({ msg, action }: { msg: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <p className="mb-4">{msg}</p>
      {action && (
        <Button onClick={action.onClick} size="sm" className="bg-rose-500 hover:bg-rose-600">
          <Plus className="mr-1 h-4 w-4" />{action.label}
        </Button>
      )}
    </div>
  );
}
