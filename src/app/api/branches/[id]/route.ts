import { NextRequest, NextResponse } from "next/server";
import { updateBranch, deleteBranch } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = requireAuth<Ctx>(async (request, _user, ctx) => {
  const { id } = await ctx.params;
  const body = await request.json();
  const updated = updateBranch(Number(id), body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
});

export const DELETE = requireAuth<Ctx>(async (_request, _user, ctx) => {
  const { id } = await ctx.params;
  const deleted = deleteBranch(Number(id));
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
});
