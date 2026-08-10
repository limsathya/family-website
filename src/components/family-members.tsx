"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, Loader2 } from "lucide-react";
import { useTranslation, useLanguage } from "@/lib/i18n/language-context";
import { useSiteMeta } from "@/lib/site-context";
import { usePolling } from "@/lib/use-polling";
import { groupByLang } from "@/lib/group-by-lang";
import type { FamilyMember, Branch } from "@/lib/db";

// Roles ordered from oldest (ancestors) to youngest (descendants)
const ROLE_ORDER: Record<string, number> = {
  bizu: 0, yuanzu: 1, taizu: 2, liezu: 3, tianzu: 4, gaozu: 5, zengzu: 6, zufu: 7,
  grandfather: 8, grandmother: 9,
  waizufu: 10, waizumu: 11, waizengzu: 12, waigaozu: 13,
  father: 20, mother: 21,
  uncle: 22, aunt: 23,
  self: 30, husband: 31, wife: 32,
  brother: 35, sister: 36, cousin: 37,
  son: 40, daughter: 41,
  sunzi: 50, zengsun: 51, xuansun: 52, laisun: 53, kunsun: 54, rengsun: 55, yunsun: 56, ersun: 57,
  other: 99,
};

function sortByRole(members: FamilyMember[]): FamilyMember[] {
  return [...members].sort((a, b) => (ROLE_ORDER[a.role] ?? 50) - (ROLE_ORDER[b.role] ?? 50));
}

export function FamilyMembers() {
  const t = useTranslation();
  const { lang } = useLanguage();
  const meta = useSiteMeta();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [allMembers, b] = await Promise.all([
        fetch("/api/members").then(r => r.json()),
        fetch("/api/branches").then(r => r.json()),
      ]);
      setMembers(groupByLang(allMembers, lang));
      setBranches(b);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [lang]);

  usePolling(fetchData, 10000, true);

  const title = meta.familySectionTitle || "";
  const subtitle = meta.familySectionSubtitle || "";

  return (
    <section id="family" className="bg-muted/30 py-24 overflow-x-auto">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground"><p>{t("family.empty")}</p></div>
        ) : (
          <div className="flex flex-col items-center w-full">
            {/* Root node */}
            <RootNode label={title || t("nav.ourFamily")} />

            {/* Branch trees — or all members if no branches */}
            <div className="flex flex-wrap justify-center gap-12 mt-2 w-full">
              {branches.length > 0 ? (
                branches.map((branch) => {
                  const branchMembers = members.filter(m => m.branch_id === branch.id);
                  if (branchMembers.length === 0) return null;
                  return <BranchTree key={branch.id} branch={branch} members={sortByRole(branchMembers)} />;
                })
              ) : (
                <div className="flex flex-col items-center w-full">
                  <MemberTree members={sortByRole(members)} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ========== Root Node ========== */
function RootNode({ label }: { label: string }) {
  return (
    <div className="relative flex flex-col items-center animate-fade-in-down">
      <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-lg shadow-lg">
        <Heart className="h-5 w-5 fill-white" />
        {label}
      </div>
      <div className="w-0.5 h-12 bg-gradient-to-b from-rose-400 to-rose-300 dark:to-rose-700" />
    </div>
  );
}

/* ========== Branch Tree ========== */
function BranchTree({ branch, members }: {
  branch: Branch;
  members: FamilyMember[];
}) {
  return (
    <div className="flex flex-col items-center min-w-[300px] animate-fade-in-up">
      <div className="relative mb-4">
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl border-2 bg-card shadow-sm border-border"
          style={{ borderLeftColor: getHexColor(branch.color), borderLeftWidth: "4px" }}
        >
          <div className={`h-10 w-10 rounded-xl ${branch.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
            {branch.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-sm whitespace-nowrap">{branch.name}</h3>
            {branch.type && <span className="text-xs text-muted-foreground">{branch.type}</span>}
          </div>
          <span className="text-xs text-muted-foreground ml-1">{members.length}</span>
        </div>
      </div>
      <MemberTree members={members} />
    </div>
  );
}

/* ========== Mindmap Tree (shared) ========== */
function MemberTree({ members }: { members: FamilyMember[] }) {
  const ancestors = members.filter(m => (ROLE_ORDER[m.role] ?? 50) < 20);
  const parents = members.filter(m => m.role === "father" || m.role === "mother");
  const selfAndSpouse = members.filter(m => m.role === "self" || m.role === "husband" || m.role === "wife");
  const siblings = members.filter(m => m.role === "brother" || m.role === "sister" || m.role === "cousin");
  const children = members.filter(m => m.role === "son" || m.role === "daughter");
  const descendants = members.filter(m => (ROLE_ORDER[m.role] ?? 50) >= 50 && m.role !== "son" && m.role !== "daughter");

  return (
    <div className="flex flex-col items-center gap-0">
      {ancestors.length > 0 && (
        <>
          <MemberRow members={ancestors} compact />
          <Connector />
        </>
      )}
      {parents.length > 0 && (
        <>
          <MemberRow members={parents} highlight />
          <Connector />
        </>
      )}
      {selfAndSpouse.length > 0 && (
        <>
          <MemberRow members={selfAndSpouse} />
          <Connector />
        </>
      )}
      {siblings.length > 0 && (
        <>
          <div className="flex items-center w-full my-2">
            <div className="flex-1 h-px bg-rose-300 dark:bg-rose-700" />
            <MemberRow members={siblings} compact />
            <div className="flex-1 h-px bg-rose-300 dark:bg-rose-700" />
          </div>
          <Connector />
        </>
      )}
      {children.length > 0 && (
        <>
          <MemberRow members={children} highlight />
          {descendants.length > 0 && <Connector />}
        </>
      )}
      {descendants.length > 0 && (
        <MemberRow members={descendants} compact />
      )}
    </div>
  );
}

/* ========== Connector Line ========== */
function Connector() {
  return <div className="w-0.5 h-6 bg-rose-300 dark:bg-rose-700" />;
}

/* ========== Row of Members ========== */
function MemberRow({ members, compact, highlight }: {
  members: FamilyMember[];
  compact?: boolean;
  highlight?: boolean;
}) {
  const t = useTranslation();
  return (
    <div className={`flex flex-wrap justify-center gap-3 ${compact ? "scale-90" : ""}`}>
      {members.map((member) => (
        <div key={member.id} className="relative flex flex-col items-center">
          <Card className={`group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-default ${
            highlight
              ? "border-rose-300 dark:border-rose-700 shadow-md min-w-[150px] max-w-[220px]"
              : compact
              ? "min-w-[110px] max-w-[150px] border-muted"
              : "min-w-[160px] max-w-[220px]"
          }`}>
            <CardContent className="p-3 text-center">
              <Avatar className={`mx-auto ring-2 ring-background transition-transform duration-300 group-hover:scale-110 ${
                highlight ? "h-14 w-14" : compact ? "h-10 w-10" : "h-16 w-16"
              }`}>
                <AvatarImage src={member.avatar || undefined} />
                <AvatarFallback className={`font-bold text-white ${member.color} ${
                  highlight ? "text-base" : "text-sm"
                }`}>
                  {member.initials}
                </AvatarFallback>
              </Avatar>
              <h4 className={`mt-2 font-semibold break-words ${highlight ? "text-sm" : compact ? "text-[11px]" : "text-xs"}`}>{member.name}</h4>
              <Badge variant="outline" className="mt-0.5 text-[10px] px-1 py-0 leading-tight">
                {t(`member.role.${member.role}` as any) || member.role}
              </Badge>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

/* ========== Helper ========== */
function getHexColor(bgClass: string): string {
  const map: Record<string, string> = {
    "bg-rose-500": "#f43f5e", "bg-sky-500": "#0ea5e9", "bg-violet-500": "#8b5cf6",
    "bg-emerald-500": "#10b981", "bg-amber-500": "#f59e0b", "bg-orange-500": "#f97316",
    "bg-pink-500": "#ec4899", "bg-indigo-500": "#6366f1", "bg-teal-500": "#14b8a6",
    "bg-red-500": "#ef4444", "bg-gray-400": "#9ca3af",
  };
  return map[bgClass] || "#f43f5e";
}
