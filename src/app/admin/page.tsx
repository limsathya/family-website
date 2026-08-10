"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Pencil, Trash2, Plus, ArrowLeft, ShieldCheck, Shield, Loader2, Home,
  CalendarDays, Clock, MapPin, Users, Camera, Image, Star, Settings, GitBranch, FileText,
} from "lucide-react";
import { MemberDialog } from "@/components/member-dialog";
import { EventDialog } from "@/components/event-dialog";
import { GalleryDialog } from "@/components/gallery-dialog";
import { ValueDialog } from "@/components/value-dialog";
import { BranchDialog } from "@/components/branch-dialog";
import { useAuth } from "@/lib/auth-context";
import type {
  FamilyMember,
  FamilyEvent,
  GalleryItem,
  FamilyValue,
  Branch,
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

export default function AdminPage() {
  const t = useTranslation();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [values, setValues] = useState<FamilyValue[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [hero, setHero] = useState({ title: "", subtitle: "", ctaPrimary: "", ctaSecondary: "" });
  const [meta, setMeta] = useState({ siteTitle: "", siteDescription: "", ogImage: "", familySectionTitle: "", familySectionSubtitle: "", valuesSectionTitle: "", valuesSectionSubtitle: "", gallerySectionTitle: "", gallerySectionSubtitle: "", eventsSectionTitle: "", eventsSectionSubtitle: "" });
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [memberOpen, setMemberOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [valueOpen, setValueOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [editingEvent, setEditingEvent] = useState<FamilyEvent | null>(null);
  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
  const [editingValue, setEditingValue] = useState<FamilyValue | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    try {
      const [mRes, eRes, gRes, vRes, bRes, hRes, metaRes] = await Promise.all([
        fetch("/api/members"),
        fetch("/api/events"),
        fetch("/api/gallery"),
        fetch("/api/values"),
        fetch("/api/branches"),
        fetch("/api/settings/hero"),
        fetch("/api/settings/meta"),
      ]);
      setMembers(await mRes.json());
      setEvents(await eRes.json());
      setGallery(await gRes.json());
      setValues(await vRes.json());
      setBranches(await bRes.json());
      setHero(await hRes.json());
      setMeta(await metaRes.json());
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (user) fetchAll();
  }, [user, authLoading, router]);

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

  const handleCreate = (base: string, setOpen: (v: boolean) => void) => async (data: unknown) => {
    setSaving(true);
    try {
      await apiCrud(`/api/${base}`, "POST", data);
      await fetchAll();
      setOpen(false);
    } finally { setSaving(false); }
  };

  const handleUpdate = (base: string, id: number, setOpen: (v: boolean) => void) => async (data: unknown) => {
    setSaving(true);
    try {
      await apiCrud(`/api/${base}/${id}`, "PUT", data);
      await fetchAll();
      setOpen(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (base: string, id: number) => {
    if (!confirm(t("admin.deleteConfirm"))) return;
    try {
      await apiCrud(`/api/${base}/${id}`, "DELETE");
      await fetchAll();
    } catch (err) {
      console.error("Delete error:", err);
      alert(t("admin.deleteError"));
    }
  };

  const handleSaveHero = async () => {
    setSaving(true);
    try {
      await apiCrud("/api/settings/hero", "POST", hero);
      alert(t("admin.hero.saved"));
    } catch (err) {
      console.error("Hero save error:", err);
      alert(t("admin.hero.saveError"));
    } finally { setSaving(false); }
  };

  const handleSaveMeta = async () => {
    setSaving(true);
    try {
      await apiCrud("/api/settings/meta", "POST", meta);
      alert(t("admin.hero.saved"));
    } catch (err) {
      console.error("Meta save error:", err);
      alert(t("admin.hero.saveError"));
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
              <p className="text-sm font-semibold">{user?.name}</p>
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
        </TabsList>

        {/* Members */}
        <TabsContent value="members">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => {
              const PermIcon = PERMISSION_ICONS[m.permissions] || Shield;
              return (
                <Card key={m.id} className="group transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 ring-2 ring-background">
                          <AvatarImage src={m.avatar || undefined} />
                          <AvatarFallback className={`text-lg font-bold text-white ${m.color}`}>{m.initials}</AvatarFallback>
                        </Avatar>
                        <div><CardTitle className="text-lg">{m.name}</CardTitle><Badge variant="outline" className="mt-1">{m.role}</Badge></div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingMember(m); setMemberOpen(true); }} className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete("members", m.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{m.bio}</p>
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
                  <Badge variant="secondary" className="mt-2 capitalize text-xs">{g.category}</Badge>
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
            <CardHeader><CardTitle>{t("admin.hero.title")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("admin.hero.titleLabel")}</Label>
                <Input value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} placeholder="Hero title" />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.hero.subtitleLabel")}</Label>
                <Textarea value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} rows={3} placeholder="Hero subtitle" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.hero.ctaPrimaryLabel")}</Label>
                  <Input value={hero.ctaPrimary} onChange={(e) => setHero({ ...hero, ctaPrimary: e.target.value })} placeholder="Button text" />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.hero.ctaSecondaryLabel")}</Label>
                  <Input value={hero.ctaSecondary} onChange={(e) => setHero({ ...hero, ctaSecondary: e.target.value })} placeholder="Button text" />
                </div>
              </div>
              <Button onClick={handleSaveHero} disabled={saving} className="bg-rose-500 hover:bg-rose-600">
                {saving ? t("admin.saving") : t("admin.hero.save")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Site Metadata */}
        <TabsContent value="meta">
          <Card>
            <CardHeader><CardTitle>{t("admin.meta.title")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.meta.siteTitle")}</Label>
                  <Input value={meta.siteTitle} onChange={(e) => setMeta({ ...meta, siteTitle: e.target.value })} placeholder="Our Family" />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.meta.siteDescription")}</Label>
                  <Input value={meta.siteDescription} onChange={(e) => setMeta({ ...meta, siteDescription: e.target.value })} placeholder="Welcome to our family website" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("admin.meta.ogImage")}</Label>
                <Input value={meta.ogImage} onChange={(e) => setMeta({ ...meta, ogImage: e.target.value })} placeholder="https://..." />
              </div>
              <Separator />
              <h3 className="font-semibold">{t("admin.meta.sectionTitles")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.meta.familyTitle")}</Label>
                  <Input value={meta.familySectionTitle} onChange={(e) => setMeta({ ...meta, familySectionTitle: e.target.value })} placeholder="Meet Our Family" />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.meta.familySubtitle")}</Label>
                  <Input value={meta.familySectionSubtitle} onChange={(e) => setMeta({ ...meta, familySectionSubtitle: e.target.value })} placeholder="Each one brings something special..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.meta.valuesTitle")}</Label>
                  <Input value={meta.valuesSectionTitle} onChange={(e) => setMeta({ ...meta, valuesSectionTitle: e.target.value })} placeholder="What Matters Most" />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.meta.valuesSubtitle")}</Label>
                  <Input value={meta.valuesSectionSubtitle} onChange={(e) => setMeta({ ...meta, valuesSectionSubtitle: e.target.value })} placeholder="These core values..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.meta.galleryTitle")}</Label>
                  <Input value={meta.gallerySectionTitle} onChange={(e) => setMeta({ ...meta, gallerySectionTitle: e.target.value })} placeholder="Our Precious Moments" />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.meta.gallerySubtitle")}</Label>
                  <Input value={meta.gallerySectionSubtitle} onChange={(e) => setMeta({ ...meta, gallerySectionSubtitle: e.target.value })} placeholder="A collection of memories..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.meta.eventsTitle")}</Label>
                  <Input value={meta.eventsSectionTitle} onChange={(e) => setMeta({ ...meta, eventsSectionTitle: e.target.value })} placeholder="Upcoming Family Events" />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.meta.eventsSubtitle")}</Label>
                  <Input value={meta.eventsSectionSubtitle} onChange={(e) => setMeta({ ...meta, eventsSectionSubtitle: e.target.value })} placeholder="Mark your calendars..." />
                </div>
              </div>
              <Button onClick={handleSaveMeta} disabled={saving} className="bg-rose-500 hover:bg-rose-600">
                {saving ? t("admin.saving") : t("admin.meta.save")}
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
      </Tabs>

      {/* Dialogs */}
      <MemberDialog open={memberOpen} onOpenChange={(o) => { setMemberOpen(o); if (!o) setEditingMember(null); }} member={editingMember} branches={branches} onSave={editingMember ? handleUpdate("members", editingMember.id, setMemberOpen) : handleCreate("members", setMemberOpen)} saving={saving} />
      <EventDialog open={eventOpen} onOpenChange={(o) => { setEventOpen(o); if (!o) setEditingEvent(null); }} event={editingEvent} onSave={editingEvent ? handleUpdate("events", editingEvent.id, setEventOpen) : handleCreate("events", setEventOpen)} saving={saving} />
      <GalleryDialog open={galleryOpen} onOpenChange={(o) => { setGalleryOpen(o); if (!o) setEditingGallery(null); }} item={editingGallery} onSave={editingGallery ? handleUpdate("gallery", editingGallery.id, setGalleryOpen) : handleCreate("gallery", setGalleryOpen)} saving={saving} />
      <ValueDialog open={valueOpen} onOpenChange={(o) => { setValueOpen(o); if (!o) setEditingValue(null); }} value={editingValue} onSave={editingValue ? handleUpdate("values", editingValue.id, setValueOpen) : handleCreate("values", setValueOpen)} saving={saving} />
      <BranchDialog open={branchOpen} onOpenChange={(o) => { setBranchOpen(o); if (!o) setEditingBranch(null); }} branch={editingBranch} onSave={editingBranch ? handleUpdate("branches", editingBranch.id, setBranchOpen) : handleCreate("branches", setBranchOpen)} saving={saving} />
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
