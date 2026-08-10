"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Loader2, X, ChevronDown } from "lucide-react";
import { useTranslation, useLanguage } from "@/lib/i18n/language-context";
import { useAuth } from "@/lib/auth-context";
import { getDisplayName } from "@/lib/display-name";
import type { ChatMessageWithNames } from "@/lib/db";

export function FamilyChat() {
  const t = useTranslation();
  const { lang: language } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageWithNames[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.reverse());
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  // Fetch when opened or user logs in
  useEffect(() => {
    if (open && user) {
      setLoading(true);
      fetchMessages();
    }
  }, [open, user]);

  // Poll for new messages every 5 seconds when open
  useEffect(() => {
    if (!open || !user) return;
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [open, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    setSending(true);
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() }),
      });
      setInput("");
      await fetchMessages();
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  // Don't render anything for visitors
  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat panel */}
      {open && (
        <div className="mb-4 w-80 sm:w-96 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-rose-500 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold leading-tight">{t("chat.title")}</p>
                <p className="text-[11px] opacity-80 leading-tight">{t("chat.online")}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto space-y-3 p-4 bg-muted/20">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">{t("chat.empty")}</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="animate-fade-in-up">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold">{getDisplayName(msg.user_name, msg.name_zh, msg.name_km, language)}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.created_at + "Z").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm bg-background border border-border rounded-xl px-3 py-1.5 mt-0.5 inline-block max-w-full">
                    {msg.message}
                  </p>
                </div>
              ))
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-border bg-background">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chat.placeholder")}
              className="flex-1 h-9 text-sm rounded-xl"
              maxLength={500}
              autoFocus
            />
            <Button
              type="submit"
              size="icon"
              disabled={sending || !input.trim()}
              className="h-9 w-9 shrink-0 rounded-xl bg-rose-500 hover:bg-rose-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label={open ? t("chat.close") : t("chat.open")}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}
