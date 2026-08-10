import { NextRequest, NextResponse } from "next/server";
import { getAllValues, createValue, FamilyValueInput } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET = async () => {
  try { return NextResponse.json(getAllValues()); }
  catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
};

export const POST = requireAuth(async (request: NextRequest) => {
  const body: FamilyValueInput = await request.json();
  if (!body.title || !body.icon) return NextResponse.json({ error: "Title and icon required" }, { status: 400 });
  return NextResponse.json(createValue(body), { status: 201 });
});
