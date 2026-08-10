import { NextRequest, NextResponse } from "next/server";
import { getAllValues, createValue } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || undefined;
  try { return NextResponse.json(getAllValues(lang)); }
  catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
};

export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    if (!body.title || !body.icon) return NextResponse.json({ error: "Title and icon required" }, { status: 400 });
    return NextResponse.json(createValue(body), { status: 201 });
  } catch (error) {
    console.error("POST /api/values error:", error);
    return NextResponse.json({ error: "Failed to create value" }, { status: 500 });
  }
});
