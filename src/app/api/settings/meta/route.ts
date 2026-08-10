import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    return NextResponse.json({
      siteTitle: getSetting("meta_site_title") || "Our Family",
      siteDescription: getSetting("meta_site_description") || "Welcome to our family website.",
      ogImage: getSetting("meta_og_image") || "",
      familySectionTitle: getSetting("family_title") || "",
      familySectionSubtitle: getSetting("family_subtitle") || "",
      valuesSectionTitle: getSetting("values_title") || "",
      valuesSectionSubtitle: getSetting("values_subtitle") || "",
      gallerySectionTitle: getSetting("gallery_title") || "",
      gallerySectionSubtitle: getSetting("gallery_subtitle") || "",
      eventsSectionTitle: getSetting("events_title") || "",
      eventsSectionSubtitle: getSetting("events_subtitle") || "",
    });
  } catch {
    return NextResponse.json({});
  }
}

export const POST = requireAuth(async (request: NextRequest) => {
  const body = await request.json();
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
    if (body[key] !== undefined) setSetting(dbKey, body[key]);
  }
  return NextResponse.json({ success: true });
});
