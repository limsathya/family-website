import { NextRequest, NextResponse } from "next/server";
import { getAllMembers, createMember } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || undefined;
  try {
    return NextResponse.json(getAllMembers(lang));
  } catch (error) {
    console.error("GET /api/members error:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
};

export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    if (!body.name || !body.role || !body.initials) {
      return NextResponse.json({ error: "name, role, and initials are required" }, { status: 400 });
    }
    const member = createMember(body);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("POST /api/members error:", error);
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
});
