import { NextRequest, NextResponse } from "next/server";
import { getMemberById, updateMember, deleteMember } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const member = getMemberById(Number(id));
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  return NextResponse.json(member);
}

export const PUT = requireAuth<Ctx>(async (request, _user, ctx) => {
  const { id } = await ctx.params;
  const body = await request.json();
  const updated = updateMember(Number(id), body);
  if (!updated) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  return NextResponse.json(updated);
});

export const DELETE = requireAuth<Ctx>(async (_request, _user, ctx) => {
  const { id } = await ctx.params;
  const deleted = deleteMember(Number(id));
  if (!deleted) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  return NextResponse.json({ success: true });
});
