import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const LANGUAGES = ["en", "zh", "km"] as const;

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get("lang") || "en").slice(0, 2);

  try {
    const prefix = `${lang}_`;
    return NextResponse.json({
      title: await getSetting(`${prefix}hero_title`) || "",
      subtitle: await getSetting(`${prefix}hero_subtitle`) || "",
      ctaPrimary: await getSetting(`${prefix}hero_cta_primary`) || "",
      ctaSecondary: await getSetting(`${prefix}hero_cta_secondary`) || "",
    });
  } catch {
    return NextResponse.json({ title: "", subtitle: "", ctaPrimary: "", ctaSecondary: "" });
  }
};

export const POST = requireAuth(async (request: NextRequest) => {
  const body = await request.json();
  const lang = (body.lang || "en").slice(0, 2);
  const prefix = `${lang}_`;

  if (body.title !== undefined) await setSetting(`${prefix}hero_title`, body.title);
  if (body.subtitle !== undefined) await setSetting(`${prefix}hero_subtitle`, body.subtitle);
  if (body.ctaPrimary !== undefined) await setSetting(`${prefix}hero_cta_primary`, body.ctaPrimary);
  if (body.ctaSecondary !== undefined) await setSetting(`${prefix}hero_cta_secondary`, body.ctaSecondary);

  // If saving the default language, also save to unprefixed keys for backward compatibility
  if (lang === "en") {
    if (body.title !== undefined) await setSetting("hero_title", body.title);
    if (body.subtitle !== undefined) await setSetting("hero_subtitle", body.subtitle);
    if (body.ctaPrimary !== undefined) await setSetting("hero_cta_primary", body.ctaPrimary);
    if (body.ctaSecondary !== undefined) await setSetting("hero_cta_secondary", body.ctaSecondary);
  }

  return NextResponse.json({ success: true });
});
