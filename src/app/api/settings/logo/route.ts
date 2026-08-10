import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET = async () => {
  try {
    return NextResponse.json({ logo: getSetting("family_logo") || "" });
  } catch {
    return NextResponse.json({ logo: "" });
  }
};

export const POST = requireAuth(async (request: NextRequest) => {
  const { logo } = await request.json();
  setSetting("family_logo", logo || "");
  return NextResponse.json({ logo });
});
