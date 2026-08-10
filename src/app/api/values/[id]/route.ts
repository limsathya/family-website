import { NextRequest, NextResponse } from "next/server";
import { updateValue, deleteValue } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = requireAuth(async (request, _user, ctx: Ctx) => {
  const { id } = await ctx.params;
  const body = await request.json();
  const updated = updateValue(Number(id), body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
});

export const DELETE = requireAuth(async (_request, _user, ctx: Ctx) => {
  const { id } = await ctx.params;
  const deleted = deleteValue(Number(id));
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
});
