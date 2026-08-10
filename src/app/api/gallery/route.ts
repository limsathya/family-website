import { NextRequest, NextResponse } from "next/server";
import { getAllGallery, createGalleryItem, GalleryInput } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET = async () => {
  try { return NextResponse.json(getAllGallery()); }
  catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
};

export const POST = requireAuth(async (request: NextRequest) => {
  const body: GalleryInput = await request.json();
  if (!body.title) return NextResponse.json({ error: "Title required" }, { status: 400 });
  return NextResponse.json(createGalleryItem(body), { status: 201 });
});
