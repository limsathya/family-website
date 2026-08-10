import { NextRequest, NextResponse } from "next/server";
import { getMemberById, getMembersByGroupId, updateMember, deleteMember } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const member = await getMemberById(Number(id));
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  const siblings = member.group_id ? await getMembersByGroupId(member.group_id) : [member];
  return NextResponse.json({ ...member, _siblings: siblings });
}

export const PUT = requireAuth(async (request, _user, ctx: Ctx) => {
  const { id } = await ctx.params;
  const body = await request.json();
  const { id: _bodyId, ...cleanBody } = body;
  if (cleanBody.dod && !cleanBody.in_memoriam) cleanBody.in_memoriam = 1;
  const updated = await updateMember(Number(id), cleanBody);
  if (!updated) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  return NextResponse.json(updated);
});

export const PATCH = requireAuth(async (_request, _user, ctx: Ctx) => {
  const { id } = await ctx.params;
  const member = await getMemberById(Number(id));
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  const updated = await updateMember(Number(id), { in_memoriam: member.in_memoriam ? 0 : 1 } as any);
  return NextResponse.json(updated);
});

export const DELETE = requireAuth(async (_request, _user, ctx: Ctx) => {
  const { id } = await ctx.params;
  const deleted = await deleteMember(Number(id));
  if (!deleted) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  return NextResponse.json({ success: true });
});
