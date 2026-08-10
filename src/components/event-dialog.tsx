"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/language-context";
import type { FamilyEvent } from "@/lib/db";

const COLOR_OPTIONS = [
  { value: "border-l-rose-500", label: "Rose" },
  { value: "border-l-violet-500", label: "Violet" },
  { value: "border-l-emerald-500", label: "Emerald" },
  { value: "border-l-amber-500", label: "Amber" },
  { value: "border-l-sky-500", label: "Sky Blue" },
  { value: "border-l-pink-500", label: "Pink" },
  { value: "border-l-orange-500", label: "Orange" },
  { value: "border-l-indigo-500", label: "Indigo" },
];

const ICON_OPTIONS = [
  "🎉", "🎂", "🍖", "🎹", "⚽", "🏕️", "💕", "🩰", "🎄", "🎃",
  "🏖️", "🎓", "✈️", "🎮", "🎨", "📚", "🐶", "🌻", "🎪", "🍕",
];

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: FamilyEvent | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: any) => Promise<void>;
  saving: boolean;
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  onSave,
  saving,
}: EventDialogProps) {
  const t = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [icon, setIcon] = useState("📅");
  const [color, setColor] = useState("border-l-rose-500");

  const isEditing = !!event;

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setDate(event.date);
      setTime(event.time);
      setLocation(event.location);
      setIcon(event.icon);
      setColor(event.color);
    } else {
      setTitle("");
      setDescription("");
      setDate("");
      setTime("");
      setLocation("");
      setIcon("📅");
      setColor("border-l-rose-500");
    }
  }, [event, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ title, description, date, time, location, icon, color });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? t("event.edit") : t("event.add")}</DialogTitle>
            <DialogDescription>{isEditing ? t("event.editDesc") : t("event.addDesc")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">{t("event.title")} *</Label>
              <Input id="event-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("event.placeholder.title")} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-desc">{t("event.description")}</Label>
              <Textarea id="event-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("event.placeholder.description")} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-date">{t("event.date")} *</Label>
                <Input id="event-date" value={date} onChange={(e) => setDate(e.target.value)} placeholder={t("event.placeholder.date")} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-time">{t("event.time")}</Label>
                <Input id="event-time" value={time} onChange={(e) => setTime(e.target.value)} placeholder={t("event.placeholder.time")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-location">{t("event.location")}</Label>
              <Input id="event-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t("event.placeholder.location")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("event.icon")}</Label>
                <Select value={icon} onValueChange={(v) => setIcon(v ?? "📅")}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("event.placeholder.icon")} />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((ico) => (
                      <SelectItem key={ico} value={ico}>
                        <span className="text-lg">{ico}</span> {ico}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("event.color")}</Label>
                <Select value={color} onValueChange={(v) => setColor(v ?? "border-l-rose-500")}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("event.placeholder.color")} />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block h-4 w-4 rounded ${c.value.replace("border-l-", "bg-")}`} />
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {t("admin.cancel")}
            </Button>
            <Button type="submit" disabled={saving || !title || !date} className="bg-rose-500 hover:bg-rose-600">
              {saving ? t("admin.saving") : isEditing ? t("admin.update") : t("admin.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
