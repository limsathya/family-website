import { NextRequest, NextResponse } from "next/server";
import { getAllBranches, createBranch, BranchInput } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET = async () => {
  try { return NextResponse.json(getAllBranches()); }
  catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
};

export const POST = requireAuth(async (request: NextRequest) => {
  const body: BranchInput = await request.json();
  if (!body.name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  return NextResponse.json(createBranch(body), { status: 201 });
});
