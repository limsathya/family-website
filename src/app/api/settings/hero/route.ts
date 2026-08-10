import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET = async () => {
  try {
    return NextResponse.json({
      title: getSetting("hero_title") || "",
      subtitle: getSetting("hero_subtitle") || "",
      ctaPrimary: getSetting("hero_cta_primary") || "",
      ctaSecondary: getSetting("hero_cta_secondary") || "",
    });
  } catch {
    return NextResponse.json({ title: "", subtitle: "", ctaPrimary: "", ctaSecondary: "" });
  }
};

export const POST = requireAuth(async (request: NextRequest) => {
  const body = await request.json();
  if (body.title !== undefined) setSetting("hero_title", body.title);
  if (body.subtitle !== undefined) setSetting("hero_subtitle", body.subtitle);
  if (body.ctaPrimary !== undefined) setSetting("hero_cta_primary", body.ctaPrimary);
  if (body.ctaSecondary !== undefined) setSetting("hero_cta_secondary", body.ctaSecondary);
  return NextResponse.json({ success: true });
});
