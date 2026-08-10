import { NextRequest, NextResponse } from "next/server";
import { getEventById, updateEvent, deleteEvent } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const event = getEventById(Number(id));
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json(event);
}

export const PUT = requireAuth<Ctx>(async (request, _user, ctx) => {
  const { id } = await ctx.params;
  const body = await request.json();
  const updated = updateEvent(Number(id), body);
  if (!updated) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json(updated);
});

export const DELETE = requireAuth<Ctx>(async (_request, _user, ctx) => {
  const { id } = await ctx.params;
  const deleted = deleteEvent(Number(id));
  if (!deleted) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json({ success: true });
});
