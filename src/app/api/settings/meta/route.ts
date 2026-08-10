import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get("lang") || "en").slice(0, 2);
  const prefix = `${lang}_`;

  try {
    return NextResponse.json({
      siteTitle: await getSetting(`${prefix}meta_site_title`) || process.env.NEXT_PUBLIC_APP_NAME || "Our Family",
      siteDescription: await getSetting(`${prefix}meta_site_description`) || "Welcome to our family website.",
      ogImage: await getSetting(`${prefix}meta_og_image`) || "",
      familySectionTitle: await getSetting(`${prefix}family_title`) || "",
      familySectionSubtitle: await getSetting(`${prefix}family_subtitle`) || "",
      valuesSectionTitle: await getSetting(`${prefix}values_title`) || "",
      valuesSectionSubtitle: await getSetting(`${prefix}values_subtitle`) || "",
      gallerySectionTitle: await getSetting(`${prefix}gallery_title`) || "",
      gallerySectionSubtitle: await getSetting(`${prefix}gallery_subtitle`) || "",
      eventsSectionTitle: await getSetting(`${prefix}events_title`) || "",
      eventsSectionSubtitle: await getSetting(`${prefix}events_subtitle`) || "",
    });
  } catch {
    return NextResponse.json({});
  }
}

export const POST = requireAuth(async (request: NextRequest) => {
  const body = await request.json();
  const lang = (body.lang || "en").slice(0, 2);
  const prefix = `${lang}_`;

  const keys: Record<string, string> = {
    siteTitle: "meta_site_title",
    siteDescription: "meta_site_description",
    ogImage: "meta_og_image",
    familySectionTitle: "family_title",
    familySectionSubtitle: "family_subtitle",
    valuesSectionTitle: "values_title",
    valuesSectionSubtitle: "values_subtitle",
    gallerySectionTitle: "gallery_title",
    gallerySectionSubtitle: "gallery_subtitle",
    eventsSectionTitle: "events_title",
    eventsSectionSubtitle: "events_subtitle",
  };

  for (const [key, dbKey] of Object.entries(keys)) {
    if (body[key] !== undefined) {
      await setSetting(`${prefix}${dbKey}`, body[key]);
      // Also save to unprefixed key for backward compatibility when lang is "en"
      if (lang === "en") await setSetting(dbKey, body[key]);
    }
  }

  return NextResponse.json({ success: true });
});
