import { NextRequest, NextResponse } from "next/server";
import { updateGalleryItem, deleteGalleryItem } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = requireAuth(async (request, _user, ctx: Ctx) => {
  const { id } = await ctx.params;
  const body = await request.json();
  const updated = await updateGalleryItem(Number(id), body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
});

export const DELETE = requireAuth(async (_request, _user, ctx: Ctx) => {
  const { id } = await ctx.params;
  const deleted = await deleteGalleryItem(Number(id));
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
});
