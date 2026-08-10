import { NextRequest, NextResponse } from "next/server";
import { getMemberById, getMembersByGroupId, updateMember, deleteMember } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const member = getMemberById(Number(id));
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  // Include siblings (same group_id, different lang) so the dialog can load all language variants
  const siblings = member.group_id ? getMembersByGroupId(member.group_id) : [member];
  return NextResponse.json({ ...member, _siblings: siblings });
}

export const PUT = requireAuth(async (request, _user, ctx: Ctx) => {
  const { id } = await ctx.params;
  const body = await request.json();
  // Strip id from body — it comes from the URL param, not the request body
  const { id: _bodyId, ...cleanBody } = body;
  // Auto-set in_memoriam if DOD is provided
  if (cleanBody.dod && !cleanBody.in_memoriam) {
    cleanBody.in_memoriam = 1;
  }
  const updated = updateMember(Number(id), cleanBody);
  if (!updated) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  return NextResponse.json(updated);
});

// Toggle in_memoriam for a member
export const PATCH = requireAuth(async (_request, _user, ctx: Ctx) => {
  const { id } = await ctx.params;
  const member = getMemberById(Number(id));
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  const updated = updateMember(Number(id), { in_memoriam: member.in_memoriam ? 0 : 1 } as any);
  return NextResponse.json(updated);
});

export const DELETE = requireAuth(async (_request, _user, ctx: Ctx) => {
  const { id } = await ctx.params;
  const deleted = deleteMember(Number(id));
  if (!deleted) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  return NextResponse.json({ success: true });
});
