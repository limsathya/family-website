import { NextRequest, NextResponse } from "next/server";
import { getAllMembers, createMember, MemberInput } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET = async () => {
  try {
    const members = getAllMembers();
    return NextResponse.json(members);
  } catch (error) {
    console.error("GET /api/members error:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
};

export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body: MemberInput = await request.json();
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
