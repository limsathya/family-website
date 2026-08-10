import { NextRequest, NextResponse } from "next/server";
import { getAllGallery, createGalleryItem } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || undefined;
  try { return NextResponse.json(await getAllGallery(lang)); }
  catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
};

export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    if (!body.title) return NextResponse.json({ error: "Title required" }, { status: 400 });
    return NextResponse.json(await createGalleryItem(body), { status: 201 });
  } catch (error) {
    console.error("POST /api/gallery error:", error);
    return NextResponse.json({ error: "Failed to create gallery item" }, { status: 500 });
  }
});
