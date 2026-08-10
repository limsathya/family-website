"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/language-context";
import { useSiteMeta } from "@/lib/site-context";
import type { FamilyMember, Branch } from "@/lib/db";

export function FamilyMembers() {
  const t = useTranslation();
  const meta = useSiteMeta();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/members").then(r => r.json()),
      fetch("/api/branches").then(r => r.json()),
    ])
      .then(([m, b]) => { setMembers(m); setBranches(b); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const membersWithoutBranch = members.filter(m => !m.branch_id);
  const title = meta.familySectionTitle || "";
  const subtitle = meta.familySectionSubtitle || "";

  return (
    <section id="family" className="bg-muted/30 py-24">
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
          <div className="space-y-16">
            {branches.map((branch) => {
              const branchMembers = members.filter(m => m.branch_id === branch.id);
              if (branchMembers.length === 0) return null;
              return (
                <div key={branch.id}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`h-10 w-10 rounded-full ${branch.color} flex items-center justify-center text-white font-bold text-sm`}>
                      {branch.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{branch.name}</h3>
                      <Badge variant="outline" className="capitalize">{branch.type}</Badge>
                    </div>
                  </div>
                  <MemberGrid members={branchMembers} />
                </div>
              );
            })}
            {membersWithoutBranch.length > 0 && (
              <div>
                {branches.length > 0 && (
                  <h3 className="text-lg font-semibold text-muted-foreground mb-6">{t("branch.otherMembers")}</h3>
                )}
                <MemberGrid members={membersWithoutBranch} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function MemberGrid({ members }: { members: FamilyMember[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <Card key={member.id} className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardContent className="pt-6 text-center">
            <Avatar className="mx-auto h-24 w-24 ring-4 ring-background">
              <AvatarImage src={member.avatar || undefined} />
              <AvatarFallback className={`text-2xl font-bold text-white ${member.color}`}>{member.initials}</AvatarFallback>
            </Avatar>
            <h3 className="mt-4 text-xl font-semibold">{member.name}</h3>
            <Badge variant="outline" className="mt-1">{member.role}</Badge>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
