import { NextRequest, NextResponse } from "next/server";
import { getAllBranches, createBranch } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || undefined;
  try { return NextResponse.json(getAllBranches(lang)); }
  catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
};

export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    if (!body.name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    return NextResponse.json(createBranch(body), { status: 201 });
  } catch (error) {
    console.error("POST /api/branches error:", error);
    return NextResponse.json({ error: "Failed to create branch" }, { status: 500 });
  }
});
