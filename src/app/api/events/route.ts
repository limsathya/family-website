import { NextRequest, NextResponse } from "next/server";
import { getAllEvents, createEvent } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || undefined;
  try {
    return NextResponse.json(getAllEvents(lang));
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
};

export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    if (!body.title || !body.date) {
      return NextResponse.json({ error: "title and date are required" }, { status: 400 });
    }
    const event = createEvent(body);
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("POST /api/events error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
});
