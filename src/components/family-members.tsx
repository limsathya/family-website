"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, Loader2 } from "lucide-react";
import { useTranslation, useLanguage } from "@/lib/i18n/language-context";
import { useSiteMeta } from "@/lib/site-context";
import type { FamilyMember, Branch } from "@/lib/db";

export function FamilyMembers() {
  const t = useTranslation();
  const { lang } = useLanguage();
  const meta = useSiteMeta();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/members?lang=${lang}`).then(r => r.json()),
      fetch(`/api/branches?lang=${lang}`).then(r => r.json()),
    ])
      .then(([m, b]) => { setMembers(m); setBranches(b); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lang]);

  const membersWithoutBranch = members.filter(m => !m.branch_id);
  const title = meta.familySectionTitle || "";
  const subtitle = meta.familySectionSubtitle || "";

  return (
    <section id="family" className="bg-muted/30 py-24 overflow-x-auto">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Heart className="mr-1 h-3 w-3 fill-rose-500 text-rose-500" />
            {t("family.badge")}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground"><p>{t("family.empty")}</p></div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Root node: Family name */}
            <RootNode label={title || t("nav.ourFamily")} />

            {/* Branch tree */}
            <div className="flex flex-wrap justify-center gap-8 mt-6 w-full">
              {branches.map((branch) => {
                const branchMembers = members.filter(m => m.branch_id === branch.id);
                if (branchMembers.length === 0) return null;
                return (
                  <BranchTree
                    key={branch.id}
                    branch={branch}
                    members={branchMembers}
                  />
                );
              })}

              {/* Ungrouped members */}
              {membersWithoutBranch.length > 0 && (
                <BranchTree
                  branch={{ id: 0, name: t("branch.otherMembers"), type: "", description: "", color: "bg-gray-400", lang: "", group_id: "", created_at: "" }}
                  members={membersWithoutBranch}
                  isUngrouped
                />
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
    <div className="relative animate-fade-in-down">
      <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-lg shadow-lg">
        <Heart className="h-5 w-5 fill-white" />
        {label}
      </div>
      {/* Vertical line down */}
      <div className="w-0.5 h-8 bg-gradient-to-b from-rose-400 to-amber-400 mx-auto" />
    </div>
  );
}

/* ========== Branch Tree ========== */
function BranchTree({ branch, members, isUngrouped }: {
  branch: Branch;
  members: FamilyMember[];
  isUngrouped?: boolean;
}) {
  return (
    <div className="flex flex-col items-center min-w-[280px] animate-fade-in-up">
      {/* Branch header */}
      <div className="relative mb-4">
        {/* Horizontal connector line */}
        <div className="absolute top-1/2 -left-6 w-6 h-0.5 bg-border hidden xl:block" />

        <div className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border-2 bg-card shadow-sm ${
          isUngrouped ? "border-dashed border-muted-foreground/30" : "border-border"
        }`}
          style={isUngrouped ? {} : { borderLeftColor: getHexColor(branch.color), borderLeftWidth: "4px" }}
        >
          <div className={`h-9 w-9 rounded-full ${isUngrouped ? "bg-muted" : branch.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
            {isUngrouped ? "…" : branch.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-sm whitespace-nowrap">{branch.name}</h3>
            {!isUngrouped && branch.type && (
              <span className="text-xs text-muted-foreground capitalize">{branch.type}</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground ml-1">{members.length}</span>
        </div>
      </div>

      {/* Vertical line from branch to members */}
      <div className="w-0.5 h-5 bg-border" />

      {/* Members as child nodes */}
      <div className="relative">
        {/* Horizontal bar connecting all children */}
        {members.length > 1 && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-0.5 bg-border hidden md:block" />
        )}

        <div className="flex flex-wrap justify-center gap-3 pt-3 md:pt-5 animate-stagger">
          {members.map((member, idx) => (
            <MemberNode key={member.id} member={member} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========== Individual Member Node ========== */
function MemberNode({ member, index }: { member: FamilyMember; index: number }) {
  return (
    <div className="relative">
      {/* Vertical connector to horizontal bar */}
      <div className="w-0.5 h-3 bg-border mx-auto hidden md:block" />

      <Card className="group w-44 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-rose-300 dark:hover:border-rose-700 cursor-default">
        <CardContent className="p-4 text-center">
          <Avatar className="mx-auto h-16 w-16 ring-2 ring-background transition-transform duration-300 group-hover:scale-110">
            <AvatarImage src={member.avatar || undefined} />
            <AvatarFallback className={`text-lg font-bold text-white ${member.color}`}>
              {member.initials}
            </AvatarFallback>
          </Avatar>
          <h4 className="mt-2.5 text-sm font-semibold truncate">{member.name}</h4>
          <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0">
            {member.role}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}

/* ========== Helper: bg color class → hex ========== */
function getHexColor(bgClass: string): string {
  const map: Record<string, string> = {
    "bg-rose-500": "#f43f5e",
    "bg-sky-500": "#0ea5e9",
    "bg-violet-500": "#8b5cf6",
    "bg-emerald-500": "#10b981",
    "bg-amber-500": "#f59e0b",
    "bg-orange-500": "#f97316",
    "bg-pink-500": "#ec4899",
    "bg-indigo-500": "#6366f1",
    "bg-teal-500": "#14b8a6",
    "bg-red-500": "#ef4444",
    "bg-gray-400": "#9ca3af",
  };
  return map[bgClass] || "#f43f5e";
}
